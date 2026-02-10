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

let managerInstance: Manager | undefined;

function getManager(): Manager {
  if (!managerInstance) {
    const env = getEnv();
    if (env.nodeUrl !== devnetBaseUrl && !env.allowRpcUrlEnv) {
      console.log("When using a custom RPC URL, you must set allowRpcUrlEnv: true or pass --allow-rpc-url-env");
      if (typeof process !== "undefined" && process.exit) {
        process.exit(1);
      }
    }
    managerInstance = new Manager(env.nodeUrl);
    console.log("Provider:", managerInstance.channel.nodeUrl);
    void managerInstance.channel.getSpecVersion().then((v) => console.log("RPC version:", v));
  }
  return managerInstance;
}

export const manager = new Proxy({} as Manager, {
  get(_target, prop) {
    const m = getManager();
    const value = (m as unknown as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(m) : value;
  },
  has(_target, prop) {
    return prop in getManager();
  },
});
