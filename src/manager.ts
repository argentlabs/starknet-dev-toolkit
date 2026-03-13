import type { ProviderInterface, RpcProviderOptions } from "starknet";
import { RpcProvider } from "starknet";
import { WithDeclare } from "./contracts/contractsDeclare.js";
import { WithCachedContractLoader } from "./contracts/loadContract.js";
import { WithDevnet, devnetBaseUrl } from "./devnet/devnet.js";
import { getEnv } from "./env.js";
import { WithReceipts } from "./provider/receipts.js";
import { TokenManager } from "./provider/tokens.js";

const ManagerBase = WithDeclare(WithReceipts(WithCachedContractLoader(WithDevnet(RpcProvider))));

export class Manager extends ManagerBase {
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
  const env = getEnv();
  if (env.nodeUrl !== devnetBaseUrl && !env.allowRpcUrlEnv) {
    console.log("When using a custom RPC URL, you must set allowRpcUrlEnv: true or pass --allow-rpc-url-env");
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }
  }
  const instance: Manager = await (RpcProvider.create as (opts: { nodeUrl: string }) => Promise<Manager>).call(
    Manager,
    { nodeUrl: env.nodeUrl },
  );
  console.log("Provider:", instance.channel.nodeUrl);
  void instance.channel.getSpecVersion().then((v: string) => console.log("RPC version:", v));
  return instance;
}

export const manager: Manager & ProviderInterface = (await getManager()) as Manager & ProviderInterface;
