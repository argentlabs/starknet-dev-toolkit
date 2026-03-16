/**
 * Browser-safe entry point. Re-exports only modules that work without Node built-ins
 * (no fs, path, crypto, child_process). Use this from browser apps instead of the
 * barrel "." which eagerly evaluates manager.ts and accounts.ts.
 */

import type {
  AccountOptions,
  EstimateFeeBulk,
  Invocations,
  Provider,
  ProviderInterface,
  UniversalDetails,
} from "starknet";
import { Account, Contract, RpcProvider } from "starknet";
import { WithDevnet } from "./devnet.js";
import { ArgentSigner } from "./signers/signers.js";
import { TokenManager } from "./tokens.js";

export class BrowserManager extends WithDevnet(RpcProvider) {
  tokens: TokenManager;

  constructor(options: { nodeUrl: string }) {
    super(options);
    this.tokens = new TokenManager(this as never);
  }

  async loadContract(contractAddress: string, classHash?: string) {
    classHash ??= await this.getClassHashAt(contractAddress);
    const { abi } = await this.getClassByHash(classHash);
    return new Contract({ abi, address: contractAddress, providerOrAccount: this, classHash });
  }

  static async create(options: { nodeUrl: string }): Promise<BrowserManager & ProviderInterface> {
    const instance: BrowserManager = await (
      RpcProvider.create as (opts: { nodeUrl: string }) => Promise<BrowserManager>
    ).call(BrowserManager, options);
    console.log("Provider:", instance.channel.nodeUrl);
    void instance.channel.getSpecVersion().then((v: string) => console.log("RPC version:", v));
    return instance as BrowserManager & ProviderInterface;
  }
}

export class ArgentAccount extends Account {
  constructor(options: AccountOptions) {
    super(options);
  }

  override async estimateFeeBulk(invocations: Invocations, details?: UniversalDetails): Promise<EstimateFeeBulk> {
    details = details ?? {};
    details.skipValidate = details.skipValidate ?? false;
    if (this.signer instanceof ArgentSigner) {
      const { owner, guardian } = this.signer;
      const estimateSigner = new ArgentSigner(owner.estimateSigner, guardian?.estimateSigner);
      const estimateAccount = new Account({
        provider: this as Provider,
        address: this.address,
        signer: estimateSigner,
        cairoVersion: this.cairoVersion,
        transactionVersion: this.transactionVersion,
      });
      return await estimateAccount.estimateFeeBulk(invocations, details);
    }
    return await super.estimateFeeBulk(invocations, details);
  }
}

export { devnetBaseUrl, getPredeployedDevnetAccount, WithDevnet } from "./devnet.js";
export type { DevnetMixin } from "./devnet.js";
export { setEnvProvider } from "./env.js";
export type { ToolkitEnv } from "./env.js";
export { normalizeSecpR1Signature } from "./signers/secp256.js";
export type { NormalizedSecpSignature } from "./signers/secp256.js";
export { ArgentSigner, KeyPair, SignerType, signerTypeToCustomEnum } from "./signers/signers.js";
export { normalizeTransactionHash, toCharArray } from "./signers/webauthn.js";
export { strkAddress, TokenManager } from "./tokens.js";
