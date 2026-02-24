import type { ProviderInterface } from "starknet";
import { RpcProvider } from "starknet";
import { WithContracts } from "./contracts.js";
import { WithDevnet, devnetBaseUrl } from "./devnet.js";
import { getEnv } from "./env.js";
import { WithReceipts } from "./receipts.js";
import { TokenManager } from "./tokens.js";

export class Manager extends WithReceipts(WithContracts(WithDevnet(RpcProvider))) {
  tokens: TokenManager;

  constructor(nodeUrl: string) {
    super({ nodeUrl });
    this.tokens = new TokenManager(this);
  }

  async getCurrentTimestamp(): Promise<number> {
    return (await this.getBlock("latest")).timestamp;
  }
}

function getManager(): Manager {
  const env = getEnv();
  if (env.nodeUrl !== devnetBaseUrl && !env.allowRpcUrlEnv) {
    console.log("When using a custom RPC URL, you must set allowRpcUrlEnv: true or pass --allow-rpc-url-env");
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }
  }
  const instance = new Manager(env.nodeUrl);
  console.log("Provider:", instance.channel.nodeUrl);
  void instance.channel.getSpecVersion().then((v) => console.log("RPC version:", v));
  return instance;
}

export const manager: Manager & ProviderInterface = getManager() as Manager & ProviderInterface;
