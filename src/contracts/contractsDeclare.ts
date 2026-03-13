import { createHash } from "crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import type {
  Abi,
  CompiledContract,
  CompiledSierraCasm,
  Contract,
  DeclareContractPayload,
  RpcProvider,
  UniversalDeployerContractPayload,
  UniversalDetails,
} from "starknet";
import { extractContractHashes } from "starknet";
import { deployer } from "../accounts/accounts.js";
import type { DevnetMixin } from "../devnet/devnet.js";
import { l1DataGasPrice, l1GasPrice, l2GasPrice } from "../provider/gas.js";
import type { Constructor } from "../types.js";
import { readJsonFile } from "../utils/files.js";
import type { ContractLike, ContractWithClassHash, LoadContractMixin } from "./loadContract.js";

const contractsFolder = "./target/release";
const artifactsFolder = "./deployments/artifacts";
const cacheClassHashFilepath = "./dist/classHashCache.json";
type CacheClassHashes = Record<string, { classHash: string; compiledClassHash?: string }>;

export interface DeclareMixin extends LoadContractMixin {
  clearClassCache(): void;
  restartDevnetAndClearClassCache(): Promise<void>;
  declareLocalContract(contractName: string, wait?: boolean, folder?: string): Promise<string>;
  declareArtifactAccountContract(contractVersion: string, wait?: boolean): Promise<string>;
  declareArtifactMultisigContract(contractVersion: string, wait?: boolean): Promise<string>;
  declareAndDeployContract<T extends ContractLike = Contract>(
    contractName: string,
    payload?: Omit<UniversalDeployerContractPayload, "classHash"> | UniversalDeployerContractPayload[],
    details?: UniversalDetails,
  ): Promise<ContractWithClassHash<T>>;
}

export function WithDeclare<T extends Constructor<RpcProvider & DevnetMixin & LoadContractMixin>>(
  Base: T,
): Constructor<InstanceType<T> & DeclareMixin> {
  return class extends (Base as unknown as Constructor<RpcProvider & DevnetMixin & LoadContractMixin>) {
    protected declaredContracts: Record<string, string> = {};
    protected cacheClassHashes: Record<string, { classHash: string; compiledClassHash?: string }> = {};

    protected rpcVersion: string | undefined;

    clearClassCache() {
      for (const contractName of Object.keys(this.declaredContracts)) {
        delete this.declaredContracts[contractName];
      }
    }

    async restartDevnetAndClearClassCache() {
      if (this.isDevnet) {
        await this.restart();
        this.clearClassCache();
      }
    }

    async declareLocalContract(contractName: string, wait = true, folder = contractsFolder): Promise<string> {
      const cachedClass = this.declaredContracts[contractName];
      if (cachedClass) {
        return cachedClass;
      }

      const contractClassPath = resolveContractFile(contractName, folder);
      const contract = readJsonFile<CompiledContract>(contractClassPath);
      const casmFilePath = contractClassPath.replace(".contract_class.json", ".compiled_contract_class.json");
      let payload: DeclareContractPayload & { contract: CompiledContract };
      if (existsSync(casmFilePath)) {
        const casm = readJsonFile<CompiledSierraCasm>(casmFilePath);
        payload = { contract, casm } as DeclareContractPayload & { contract: CompiledContract };
      } else {
        payload = { contract } as DeclareContractPayload & { contract: CompiledContract };
      }

      let details: UniversalDetails | undefined;
      if (this.isDevnet) {
        details = {
          skipValidate: true,
          resourceBounds: {
            l2_gas: { max_amount: 10000000000n, max_price_per_unit: l2GasPrice },
            l1_gas: { max_amount: 0n, max_price_per_unit: l1GasPrice },
            l1_data_gas: { max_amount: 1000n, max_price_per_unit: l1DataGasPrice },
          },
        };
      }

      if (!this.rpcVersion) {
        this.rpcVersion = this.readSpecVersion() ?? (await this.getSpecVersion());
      }

      if (Object.keys(this.cacheClassHashes).length === 0) {
        if (!existsSync(cacheClassHashFilepath)) {
          mkdirSync(dirname(cacheClassHashFilepath), { recursive: true });
          writeFileSync(cacheClassHashFilepath, "{}");
        }

        this.cacheClassHashes = readJsonFile<CacheClassHashes>(cacheClassHashFilepath);
      }

      const fileHash = await hashFileFast(contractClassPath);
      const cacheKey = `${this.rpcVersion}:${fileHash}`;
      if (!this.cacheClassHashes[cacheKey]) {
        console.log(`Updating cache for ${contractName} (${cacheKey})`);
        const starknetVersion = await this.channel.getStarknetVersion();
        const { compiledClassHash, classHash } = extractContractHashes(payload, starknetVersion);
        this.cacheClassHashes[cacheKey] = { compiledClassHash, classHash };
        writeFileSync(cacheClassHashFilepath, JSON.stringify(this.cacheClassHashes, null, 2));
      }

      payload.compiledClassHash = this.cacheClassHashes[cacheKey].compiledClassHash;
      payload.classHash = this.cacheClassHashes[cacheKey].classHash;

      const { class_hash, transaction_hash } = await deployer.declareIfNot(payload, details);
      if (wait && transaction_hash) {
        await this.waitForTransaction(transaction_hash);
        console.log(`\t${contractName} declared`);
      }
      this.declaredContracts[contractName] = class_hash;
      (this as unknown as { abiCache: Record<string, Abi> }).abiCache[class_hash] = payload.contract.abi;
      return class_hash;
    }

    async declareArtifactAccountContract(contractVersion: string, wait = true): Promise<string> {
      const allArtifactsFolders = getSubfolders(artifactsFolder);
      let contractName = allArtifactsFolders.find((folder) => folder.startsWith(`account-${contractVersion}`));
      if (!contractName) {
        throw new Error(`No contract found for version ${contractVersion}`);
      }
      contractName = `/${contractName}/ArgentAccount`;
      return await this.declareLocalContract(contractName, wait, artifactsFolder);
    }

    async declareArtifactMultisigContract(contractVersion: string, wait = true): Promise<string> {
      const allArtifactsFolders = getSubfolders(artifactsFolder);
      let contractName = allArtifactsFolders.find((folder) => folder.startsWith(`multisig-${contractVersion}`));
      if (!contractName) {
        throw new Error(`No contract found for version ${contractVersion}`);
      }
      contractName = `/${contractName}/ArgentMultisig`;
      return await this.declareLocalContract(contractName, wait, artifactsFolder);
    }

    async declareAndDeployContract<T extends ContractLike = Contract>(
      contractName: string,
      payload?: Omit<UniversalDeployerContractPayload, "classHash"> | UniversalDeployerContractPayload[],
      details?: UniversalDetails,
    ): Promise<ContractWithClassHash<T>> {
      const classHash = await this.declareLocalContract(contractName, true, contractsFolder);
      const { contract_address } = await deployer.deployContract({ ...payload, classHash }, details);
      return await this.loadContract<T>(contract_address, classHash);
    }
  } as unknown as Constructor<InstanceType<T> & DeclareMixin>;
}

function getSubfolders(dirPath: string): string[] {
  try {
    const absolutePath = resolve(dirPath);
    const items = readdirSync(absolutePath, { withFileTypes: true });
    return items.filter((item) => item.isDirectory()).map((folder) => folder.name);
  } catch (err) {
    throw new Error(`Error reading the directory at ${dirPath}`, { cause: err });
  }
}

function resolveContractFile(contractName: string, folder: string): string {
  const suffix = ".contract_class.json";
  const directPath = join(folder, `${contractName}${suffix}`);
  if (existsSync(directPath)) {
    return directPath;
  }

  const target = `${contractName}${suffix}`;
  const prefixed = `_${contractName}${suffix}`;
  const absoluteDir = resolve(folder);
  const files = readdirSync(absoluteDir);
  const matches = files.filter((f) => f === target || f.endsWith(prefixed));
  if (matches.length === 1) return resolve(absoluteDir, matches[0]);

  if (matches.length === 0) {
    throw new Error(`No file matching "*${target}" found in ${absoluteDir}`);
  }
  const exact = matches.find((f) => f === target);
  if (exact) return resolve(absoluteDir, exact);
  throw new Error(
    `Multiple files match "${target}" in ${absoluteDir}: ${matches.join(", ")}. Pass a path that uniquely identifies the contract.`,
  );
}

async function hashFileFast(filePath: string): Promise<string> {
  const hash = createHash("md5");
  const stream = createReadStream(filePath);

  for await (const chunk of stream as AsyncIterable<Buffer>) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}
