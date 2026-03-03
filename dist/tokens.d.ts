import type { Erc20Contract } from "./contractTypes.js";
import type { Manager } from "./manager.js";
export declare const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export declare class TokenManager {
    private manager;
    private ethCache?;
    private strkCache?;
    constructor(manager: Manager);
    ethContract(): Promise<Erc20Contract>;
    strkContract(): Promise<Erc20Contract>;
    ethBalance(accountAddress: string): Promise<bigint>;
    strkBalance(accountAddress: string): Promise<bigint>;
}
//# sourceMappingURL=tokens.d.ts.map