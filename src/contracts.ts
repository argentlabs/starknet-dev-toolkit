import { createHash } from "crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import type { Abi, DeclareContractPayload, RpcProvider, UniversalDetails } from "starknet";
import { Contract, extractContractHashes } from "starknet";
import { deployer } from "./accounts.js";
import type { ContractWithPopulate } from "./contractTypes.js";
import type { DevnetMixin } from "./devnet.js";
import { readJsonFile } from "./files.js";
import { l1DataGasPrice, l1GasPrice, l2GasPrice } from "./gas.js";
import type { Constructor } from "./types.js";

export const contractsFolder = "./target/release/argent_";
export const fixturesFolder = "./tests-integration/fixtures/argent_";
const artifactsFolder = "./deployments/artifacts";
const cacheClassHashFilepath = "./dist/classHashCache.json";
type ContractClassWithAbi = DeclareContractPayload["contract"] & { abi: Abi };
type CasmClass = DeclareContractPayload["casm"];
type CacheClassHashes = Record<string, { compiledClassHash: string | undefined; classHash: string }>;

export interface ContractsMixin {
  clearClassCache(): void;
  restartDevnetAndClearClassCache(): Promise<void>;
  declareLocalContract(contractName: string, wait?: boolean, folder?: string): Promise<string>;
  declareFixtureContract(contractName: string, wait?: boolean): Promise<string>;
  declareArtifactAccountContract(contractVersion: string, wait?: boolean): Promise<string>;
  declareArtifactMultisigContract(contractVersion: string, wait?: boolean): Promise<string>;
  loadContract<T extends ContractLike = Contract>(
    contractAddress: string,
    classHash?: string,
  ): Promise<ContractWithClassHash<T>>;
  declareAndDeployContract<T extends ContractLike = Contract>(contractName: string): Promise<ContractWithClassHash<T>>;
}

export function WithContracts<T extends Constructor<RpcProvider & DevnetMixin>>(
  Base: T,
): Constructor<InstanceType<T> & ContractsMixin> {
  return class extends Base {
    // Maps a contract name to its class hash to avoid redeclaring the same contract
    protected declaredContracts: Record<string, string> = {};
    // Holds the latest know class hashes for a given contract
    // It doesn't guarantee that the class hash is up to date, or that the contact is declared
    // They key is the fileHash of the contract class file
    protected cacheClassHashes: Record<string, { compiledClassHash: string | undefined; classHash: string }> = {};

    protected abiCache: Record<string, Abi> = {};

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

    // Could extends Account to add our specific fn but that's too early.
    async declareLocalContract(contractName: string, wait = true, folder = contractsFolder): Promise<string> {
      const cachedClass = this.declaredContracts[contractName];
      if (cachedClass) {
        return cachedClass;
      }

      const payload = getDeclareContractPayload(contractName, folder);
      let details: UniversalDetails | undefined;
      // Setting resourceBounds skips estimate
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

      // If cache isn't initialized, initialize it
      if (Object.keys(this.cacheClassHashes).length === 0) {
        if (!existsSync(cacheClassHashFilepath)) {
          mkdirSync(dirname(cacheClassHashFilepath), { recursive: true });
          writeFileSync(cacheClassHashFilepath, "{}");
        }

        this.cacheClassHashes = readJsonFile<CacheClassHashes>(cacheClassHashFilepath);
      }

      const fileHash = await hashFileFast(`${folder}${contractName}.contract_class.json`);
      // If the contract is not in the cache, extract the class hash and add it to the cache
      if (!this.cacheClassHashes[fileHash]) {
        console.log(`Updating cache for ${contractName} (${fileHash})`);
        const { compiledClassHash, classHash } = extractContractHashes(payload);
        this.cacheClassHashes[fileHash] = { compiledClassHash, classHash };
        writeFileSync(cacheClassHashFilepath, JSON.stringify(this.cacheClassHashes, null, 2));
      }

      // Populate the payload with the class hash
      // If you don't restart devnet, and provide a wrong compiledClassHash, it will work
      payload.compiledClassHash = this.cacheClassHashes[fileHash].compiledClassHash;
      payload.classHash = this.cacheClassHashes[fileHash].classHash;

      const { class_hash, transaction_hash } = await deployer.declareIfNot(payload, details);
      if (wait && transaction_hash) {
        await this.waitForTransaction(transaction_hash);
        console.log(`\t${contractName} declared`);
      }
      this.declaredContracts[contractName] = class_hash;
      this.abiCache[class_hash] = payload.contract.abi;
      return class_hash;
    }

    async declareFixtureContract(contractName: string, wait = true): Promise<string> {
      return await this.declareLocalContract(contractName, wait, fixturesFolder);
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

    async loadContract<T extends ContractLike = Contract>(
      contractAddress: string,
      classHash?: string,
    ): Promise<ContractWithClassHash<T>> {
      classHash ??= await this.getClassHashAt(contractAddress);
      let abi = this.abiCache[classHash];
      if (!abi) {
        abi = (await this.getClassAt(contractAddress)).abi;
        this.abiCache[classHash] = abi;
      }
      return new Contract({
        abi,
        address: contractAddress,
        providerOrAccount: this,
        classHash,
      }) as ContractWithClassHash<T>;
    }

    async declareAndDeployContract<T extends ContractLike = Contract>(
      contractName: string,
    ): Promise<ContractWithClassHash<T>> {
      const classHash = await this.declareLocalContract(contractName, true, contractsFolder);
      const { contract_address } = await deployer.deployContract({ classHash });

      return await this.loadContract<T>(contract_address, classHash);
    }
  } as unknown as Constructor<InstanceType<T> & ContractsMixin>;
}

export type ContractLike = Contract | ContractWithPopulate<unknown>;

export type ContractWithClassHash<T extends ContractLike = Contract> = T & { classHash: string };

export function getDeclareContractPayload(
  contractName: string,
  folder = contractsFolder,
): DeclareContractPayload & { contract: ContractClassWithAbi } {
  const contract = readJsonFile<ContractClassWithAbi>(`${folder}${contractName}.contract_class.json`);
  if (existsSync(`${folder}${contractName}.compiled_contract_class.json`)) {
    const casm = readJsonFile<CasmClass>(`${folder}${contractName}.compiled_contract_class.json`);
    return { contract, casm } as DeclareContractPayload & { contract: ContractClassWithAbi };
  }
  return { contract } as DeclareContractPayload & { contract: ContractClassWithAbi };
}

/**
 * Get all subfolders in a directory.
 * @param dirPath The directory path to search.
 * @returns An array of subfolder names.
 */
function getSubfolders(dirPath: string): string[] {
  try {
    // Resolve the directory path to an absolute path
    const absolutePath = resolve(dirPath);

    // Read all items in the directory
    const items = readdirSync(absolutePath, { withFileTypes: true });

    // Filter for directories and map to their names
    const folders = items.filter((item) => item.isDirectory()).map((folder) => folder.name);

    return folders;
  } catch (err) {
    throw new Error(`Error reading the directory at ${dirPath}`, { cause: err });
  }
}

// This has to be fast. We don't care much about collisions
async function hashFileFast(filePath: string): Promise<string> {
  const hash = createHash("md5");
  const stream = createReadStream(filePath);

  for await (const chunk of stream as AsyncIterable<Buffer>) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}
