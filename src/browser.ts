/**
 * Browser-safe entry point. Composes the same mixins as Manager but without
 * WithDeclare (which needs fs/path/crypto for contract declaration).
 * Use this from browser apps instead of the barrel "." which eagerly
 * evaluates manager.ts and accounts.ts (top-level await + Node-only code).
 */

import type { ProviderInterface } from "starknet";
import { RpcProvider } from "starknet";
import { WithCachedContractLoader } from "./contracts/loadContract.js";
import { WithDevnet } from "./devnet/devnet.js";
import { WithReceipts } from "./provider/receipts.js";
import { TokenManager } from "./provider/tokens.js";

const BrowserManagerBase = WithReceipts(WithCachedContractLoader(WithDevnet(RpcProvider)));

export class BrowserManager extends BrowserManagerBase {
  tokens: TokenManager;

  constructor(options: { nodeUrl: string }) {
    super(options);
    this.tokens = new TokenManager(this as never);
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

export { ARGENT_ACCOUNT_CLASS_HASH_0_5_0, ArgentAccount } from "./accounts/argentAccount.js";
export { WithCachedContractLoader } from "./contracts/loadContract.js";
export type { ContractLike, ContractWithClassHash, LoadContractMixin } from "./contracts/loadContract.js";
export { devnetBaseUrl, getPredeployedDevnetAccount, WithDevnet } from "./devnet/devnet.js";
export type { DevnetMixin } from "./devnet/devnet.js";
export { setEnvProvider } from "./env.js";
export type { ToolkitEnv } from "./env.js";
export { WithReceipts } from "./provider/receipts.js";
export type { ReceiptsMixin } from "./provider/receipts.js";
export { strkAddress, TokenManager } from "./provider/tokens.js";
export { normalizeSecpR1Signature } from "./signers/secp256.js";
export type { NormalizedSecpSignature } from "./signers/secp256.js";
export { ArgentSigner, KeyPair, SignerType, signerTypeToCustomEnum } from "./signers/signers.js";
export { normalizeTransactionHash, toCharArray } from "./signers/webauthn.js";
