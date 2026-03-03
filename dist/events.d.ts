import type { GetTransactionReceiptResponse, InvokeFunctionResponse, TransactionReceipt } from "starknet";
interface Event {
    from_address: string;
    keys?: string[];
    data?: string[];
}
interface EventWithName extends Event {
    eventName: string;
}
export declare function expectEvent(param: string | GetTransactionReceiptResponse | TransactionReceipt | (() => Promise<InvokeFunctionResponse>), event: EventWithName): Promise<void>;
export {};
//# sourceMappingURL=events.d.ts.map