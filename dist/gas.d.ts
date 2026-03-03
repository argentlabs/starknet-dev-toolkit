import type { InvokeFunctionResponse } from "starknet";
import { type Manager } from "./manager.js";
export declare const l1GasPrice = 45000000000000n;
export declare const l2GasPrice = 8000000000n;
export declare const l1DataGasPrice = 53000000000n;
declare function profileGasUsage(transactionHash: string, manager: Manager, allowFailedTransactions?: boolean): Promise<{
    actualFee: bigint;
    l1_gas: number;
    l2_gas: number;
    l1_data_gas: number;
}>;
type Profile = Awaited<ReturnType<typeof profileGasUsage>>;
export declare function newProfiler(manager: Manager): {
    profile(name: string, transactionHash: InvokeFunctionResponse | string, { printProfile, allowFailedTransactions }?: {
        printProfile?: boolean | undefined;
        allowFailedTransactions?: boolean | undefined;
    }): Promise<void>;
    summarizeCost(profile: Profile): {
        "Actual fee": string;
        "Fee usd": number;
        "L1 gas": number;
        "L1 gas fee usd": number;
        "L2 gas": number;
        "L2 gas fee usd": number;
        "L1 data gas": number;
        "L1 data fee usd": number;
    };
    printSummary(): void;
    formatReport(): string;
    updateOrCheckReport(write?: boolean): void;
};
export {};
//# sourceMappingURL=gas.d.ts.map