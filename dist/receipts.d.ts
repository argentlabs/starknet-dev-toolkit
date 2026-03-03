import type { GetTransactionReceiptResponse, RpcProvider, TransactionReceipt } from "starknet";
import type { Constructor } from "./types.js";
type WaitForTxOptions = Parameters<RpcProvider["waitForTransaction"]>[1];
export interface ReceiptsMixin {
    waitForTx(execute: Promise<{
        transaction_hash: string;
    }> | {
        transaction_hash: string;
    } | string, options?: WaitForTxOptions): Promise<GetTransactionReceiptResponse>;
    ensureSuccess(execute: Promise<{
        transaction_hash: string;
    }> | {
        transaction_hash: string;
    }): Promise<TransactionReceipt>;
    ensureAccepted(execute: Promise<{
        transaction_hash: string;
    }> | {
        transaction_hash: string;
    }): Promise<TransactionReceipt>;
}
export declare function WithReceipts<T extends Constructor<RpcProvider>>(Base: T): Constructor<InstanceType<T> & ReceiptsMixin>;
export {};
//# sourceMappingURL=receipts.d.ts.map