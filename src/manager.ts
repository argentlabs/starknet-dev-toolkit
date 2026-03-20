import type { ProviderInterface, RpcProviderOptions } from "starknet";
import { RpcProvider } from "starknet";
import { WithContracts } from "./contracts.js";
import { WithDevnet, devnetBaseUrl } from "./devnet.js";
import { WithReceipts } from "./receipts.js";
import { TokenManager } from "./tokens.js";

export class Manager extends WithReceipts(WithContracts(WithDevnet(RpcProvider))) {
  tokens: TokenManager;

  constructor(options: RpcProviderOptions) {
    super(options);
    this.tokens = new TokenManager(this);
  }

  async getCurrentTimestamp(): Promise<number> {
    return (await this.getBlock("latest")).timestamp;
  }
}

async function getManager(): Promise<Manager> {
  const nodeUrl = process.env.RPC_URL || devnetBaseUrl;
  const allowRpcUrlEnv = process.argv?.includes?.("--allow-rpc-url-env") ?? false;
  if (nodeUrl !== devnetBaseUrl && !allowRpcUrlEnv) {
    console.log("When using a custom RPC URL, you must pass --allow-rpc-url-env");
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }
  }
  const instance: Manager = await (RpcProvider.create as (opts: { nodeUrl: string }) => Promise<Manager>).call(
    Manager,
    { nodeUrl },
  );
  console.log("Provider:", instance.channel.nodeUrl);
  void instance.channel.getSpecVersion().then((v: string) => console.log("RPC version:", v));
  return instance;
}

export const manager: Manager & ProviderInterface = (await getManager()) as Manager & ProviderInterface;
