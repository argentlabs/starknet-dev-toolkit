import { Account, type AccountOptions, type ProviderInterface, type RpcProvider } from "starknet";
import type { Constructor } from "./types.js";
export declare const devnetBaseUrl = "http://127.0.0.1:5050";
type WaitForTxOptions = Parameters<RpcProvider["waitForTransaction"]>[1];
export interface DevnetMixin {
    readonly isDevnet: boolean;
    waitForTransaction(transactionHash: string, options?: WaitForTxOptions): ReturnType<RpcProvider["waitForTransaction"]>;
    mintEth(address: string, amount: number | bigint): Promise<void>;
    mintStrk(address: string, amount: number | bigint): Promise<void>;
    increaseTime(timeInSeconds: number | bigint): Promise<void>;
    setTime(timeInSeconds: number | bigint): Promise<void>;
    restart(): Promise<void>;
    dump(): Promise<void>;
    load(): Promise<void>;
    handleJsonRpc(method: string, params?: Record<string, unknown>): Promise<unknown>;
}
export declare function WithDevnet<T extends Constructor<RpcProvider>>(Base: T): Constructor<InstanceType<T> & DevnetMixin>;
export declare function getPredeployedDevnetAccount(provider: DevnetMixin & ProviderInterface, excludeAddress?: string, accountOptions?: Partial<AccountOptions>): Promise<Account>;
export {};
//# sourceMappingURL=devnet.d.ts.map