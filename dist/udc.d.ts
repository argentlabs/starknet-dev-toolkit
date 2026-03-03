import type { RawCalldata } from "starknet";
export declare function deployContractUDC(classHash: string, salt: string, constructorCalldata: RawCalldata): Promise<{
    contractAddress: string;
    transactionHash: string;
}>;
//# sourceMappingURL=udc.d.ts.map