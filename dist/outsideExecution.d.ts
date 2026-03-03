import type { BigNumberish, Call, OutsideCall, SignerInterface } from "starknet";
import { TypedDataRevision } from "starknet";
export interface OutsideExecution {
    caller: string;
    nonce: BigNumberish;
    execute_after: BigNumberish;
    execute_before: BigNumberish;
    calls: OutsideCall[];
}
export declare function getTypedDataHash(outsideExecution: OutsideExecution, accountAddress: BigNumberish, chainId: string, revision: TypedDataRevision): string;
export declare function getTypedData(outsideExecution: OutsideExecution, chainId: string, revision: TypedDataRevision): {
    types: {
        StarknetDomain: {
            name: string;
            type: string;
        }[];
        OutsideExecution: {
            name: string;
            type: string;
        }[];
        Call: {
            name: string;
            type: string;
        }[];
    };
    primaryType: string;
    domain: {
        name: string;
        version: string;
        chainId: string;
        revision: string;
    } | {
        name: string;
        version: string;
        chainId: string;
        revision?: undefined;
    };
    message: {
        Caller: string;
        Nonce: BigNumberish;
        "Execute After": BigNumberish;
        "Execute Before": BigNumberish;
        Calls: {
            To: string;
            Selector: BigNumberish;
            Calldata: import("starknet").RawArgs;
        }[];
    };
} | {
    types: {
        StarkNetDomain: {
            name: string;
            type: string;
        }[];
        OutsideExecution: {
            name: string;
            type: string;
        }[];
        OutsideCall: {
            name: string;
            type: string;
        }[];
    };
    primaryType: string;
    domain: {
        name: string;
        version: string;
        chainId: string;
        revision: string;
    } | {
        name: string;
        version: string;
        chainId: string;
        revision?: undefined;
    };
    message: {
        calls_len: number;
        calls: {
            calldata_len: import("starknet").MultiType | import("starknet").RawArgs | import("starknet").MultiType[];
            calldata: import("starknet").RawArgs;
            to: string;
            selector: BigNumberish;
        }[];
        caller: string;
        nonce: BigNumberish;
        execute_after: BigNumberish;
        execute_before: BigNumberish;
        Caller?: undefined;
        Nonce?: undefined;
        "Execute After"?: undefined;
        "Execute Before"?: undefined;
        Calls?: undefined;
    };
};
export declare function getOutsideExecutionCall(outsideExecution: OutsideExecution, accountAddress: string, signer: SignerInterface, revision: TypedDataRevision, chainId?: string): Promise<Call>;
//# sourceMappingURL=outsideExecution.d.ts.map