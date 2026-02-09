import { expect } from "chai";
import type { GetTransactionReceiptResponse, RpcProvider, TransactionReceipt } from "starknet";
import { TransactionExecutionStatus, TransactionFinalityStatus } from "starknet";
import type { Constructor } from "./types.js";

const successStates = [TransactionFinalityStatus.ACCEPTED_ON_L1, TransactionFinalityStatus.ACCEPTED_ON_L2];

type WaitForTxOptions = Parameters<RpcProvider["waitForTransaction"]>[1];

export interface ReceiptsMixin {
  waitForTx(
    execute: Promise<{ transaction_hash: string }> | { transaction_hash: string } | string,
    options?: WaitForTxOptions,
  ): Promise<GetTransactionReceiptResponse>;
  ensureSuccess(
    execute: Promise<{ transaction_hash: string }> | { transaction_hash: string },
  ): Promise<TransactionReceipt>;
  ensureAccepted(
    execute: Promise<{ transaction_hash: string }> | { transaction_hash: string },
  ): Promise<TransactionReceipt>;
}

export function WithReceipts<T extends Constructor<RpcProvider>>(
  Base: T,
): Constructor<InstanceType<T> & ReceiptsMixin> {
  return class extends Base {
    async waitForTx(
      execute: Promise<{ transaction_hash: string }> | { transaction_hash: string } | string,
      options: WaitForTxOptions = {} as WaitForTxOptions,
    ): Promise<GetTransactionReceiptResponse> {
      let transactionHash: string;
      if (typeof execute === "string") {
        transactionHash = execute;
      } else {
        const { transaction_hash } = await execute;
        transactionHash = transaction_hash;
      }
      return this.waitForTransaction(transactionHash, { ...options });
    }

    async ensureSuccess(
      execute: Promise<{ transaction_hash: string }> | { transaction_hash: string },
    ): Promise<TransactionReceipt> {
      // There is an annoying bug... if the tx isn't successful, the promise will never resolve (fails w timeout)
      const tx = await this.ensureAccepted(execute);
      expect(tx.execution_status, `Transaction failed: ${JSON.stringify(tx)}`).to.equal(
        TransactionExecutionStatus.SUCCEEDED,
      );
      return tx;
    }

    async ensureAccepted(
      execute: Promise<{ transaction_hash: string }> | { transaction_hash: string },
    ): Promise<TransactionReceipt> {
      const receipt = await this.waitForTx(execute, {
        successStates,
      });
      return receipt as TransactionReceipt;
    }
  } as unknown as Constructor<InstanceType<T> & ReceiptsMixin>;
}
