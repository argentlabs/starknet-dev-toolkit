import type { ProviderInterface, RpcProviderOptions } from "starknet";
import { RpcProvider } from "starknet";
import { TokenManager } from "./tokens.js";
declare const Manager_base: import("./types.js").Constructor<RpcProvider & import("./devnet.js").DevnetMixin & import("./contracts.js").ContractsMixin & import("./receipts.js").ReceiptsMixin>;
export declare class Manager extends Manager_base {
    tokens: TokenManager;
    constructor(options: RpcProviderOptions);
    getCurrentTimestamp(): Promise<number>;
}
export declare const manager: Manager & ProviderInterface;
export {};
//# sourceMappingURL=manager.d.ts.map