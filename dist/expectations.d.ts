import type { InvokeFunctionResponse } from "starknet";
export declare function expectRevertWithErrorMessage(errorMessage: string, execute: Promise<{
    transaction_hash: string;
}>): Promise<void>;
export declare function expectExecutionRevert(errorMessage: string, execute: Promise<InvokeFunctionResponse>): Promise<void>;
//# sourceMappingURL=expectations.d.ts.map