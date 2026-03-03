import { expect } from "chai";
import { TransactionExecutionStatus, TransactionFinalityStatus } from "starknet";
const successStates = [TransactionFinalityStatus.ACCEPTED_ON_L1, TransactionFinalityStatus.ACCEPTED_ON_L2];
export function WithReceipts(Base) {
    return class extends Base {
        async waitForTx(execute, options = {}) {
            let transactionHash;
            if (typeof execute === "string") {
                transactionHash = execute;
            }
            else {
                const { transaction_hash } = await execute;
                transactionHash = transaction_hash;
            }
            return this.waitForTransaction(transactionHash, { ...options });
        }
        async ensureSuccess(execute) {
            // There is an annoying bug... if the tx isn't successful, the promise will never resolve (fails w timeout)
            const tx = await this.ensureAccepted(execute);
            expect(tx.execution_status, `Transaction failed: ${JSON.stringify(tx)}`).to.equal(TransactionExecutionStatus.SUCCEEDED);
            return tx;
        }
        async ensureAccepted(execute) {
            const receipt = await this.waitForTx(execute, {
                successStates,
            });
            return receipt;
        }
    };
}
//# sourceMappingURL=receipts.js.map