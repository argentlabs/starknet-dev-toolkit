import type { RpcProvider } from "starknet";
import { generateRandomNumber } from "./random.js";
import type { Constructor } from "./types.js";

const dumpFolderPath = "./dump";
export const devnetBaseUrl = "http://127.0.0.1:5050";

type WaitForTxOptions = Parameters<RpcProvider["waitForTransaction"]>[1];

export interface DevnetMixin {
  readonly isDevnet: boolean;
  waitForTransaction(
    transactionHash: string,
    options?: WaitForTxOptions,
  ): ReturnType<RpcProvider["waitForTransaction"]>;
  mintEth(address: string, amount: number | bigint): Promise<void>;
  mintStrk(address: string, amount: number | bigint): Promise<void>;
  increaseTime(timeInSeconds: number | bigint): Promise<void>;
  setTime(timeInSeconds: number | bigint): Promise<void>;
  restart(): Promise<void>;
  dump(): Promise<void>;
  load(): Promise<void>;
  handleJsonRpc(method: string, params?: Record<string, unknown>): Promise<unknown>;
}

// TODO Could this be replace with starknet-devnet?
export function WithDevnet<T extends Constructor<RpcProvider>>(Base: T): Constructor<InstanceType<T> & DevnetMixin> {
  return class extends Base {
    get isDevnet() {
      try {
        const url = new URL(this.channel.nodeUrl);
        return url.hostname === "localhost" || url.hostname === "127.0.0.1";
      } catch {
        return false;
      }
    }

    // Polls quickly for a local network
    waitForTransaction(transactionHash: string, options: WaitForTxOptions = {} as WaitForTxOptions) {
      const retryInterval = this.isDevnet ? 100 : 1000;
      return super.waitForTransaction(transactionHash, { retryInterval, ...options });
    }

    async mintEth(address: string, amount: number | bigint) {
      await this.handleJsonRpc("devnet_mint", { address, amount: Number(amount) });
    }

    async mintStrk(address: string, amount: number | bigint) {
      await this.handleJsonRpc("devnet_mint", { address, amount: Number(amount), unit: "FRI" });
    }

    async increaseTime(timeInSeconds: number | bigint) {
      await this.handleJsonRpc("devnet_increaseTime", { time: Number(timeInSeconds) });
    }

    async setTime(timeInSeconds: number | bigint) {
      await this.handleJsonRpc("devnet_setTime", { time: Number(timeInSeconds), generate_block: true });
    }

    async restart() {
      await this.handleJsonRpc("devnet_restart");
    }

    async dump() {
      await this.handleJsonRpc("devnet_dump", { path: dumpFolderPath });
    }

    async load() {
      await this.handleJsonRpc("devnet_load", { path: dumpFolderPath });
    }

    async handleJsonRpc(method: string, params: Record<string, unknown> = {}) {
      const body = {
        jsonrpc: "2.0",
        id: Number(generateRandomNumber()),
        method,
        params,
      };

      const res = await fetch(`${this.channel.nodeUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        error?: { message: string };
        result?: unknown;
      };

      if (json.error) {
        throw new Error(`RPC Error: ${json.error.message}`);
      }

      return json.result;
    }
  } as unknown as Constructor<InstanceType<T> & DevnetMixin>;
}

type DevnetAccountPayload = {
  address: string;
  private_key: string;
};

export async function getPredeployedDevnetAccount(
  provider: DevnetMixin,
  excludeAddress?: string,
): Promise<{ address: string; privateKey: string }> {
  if (provider.isDevnet === false) {
    throw new Error("Predeployed account lookup requires devnet");
  }

  const accounts = (await provider.handleJsonRpc("devnet_getPredeployedAccounts")) as DevnetAccountPayload[];

  const excluded = excludeAddress?.toLowerCase();
  const candidate = accounts.find((account) => !excluded || account.address.toLowerCase() !== excluded);
  if (!candidate) {
    throw new Error("No predeployed devnet account available");
  }

  return { address: candidate.address, privateKey: candidate.private_key };
}
