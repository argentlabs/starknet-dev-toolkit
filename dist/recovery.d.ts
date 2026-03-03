import { CairoCustomEnum } from "starknet";
import type { ArgentAccountContract } from "./contractTypes.js";
import type { KeyPair } from "./signers/signers.js";
export declare const ESCAPE_SECURITY_PERIOD: bigint;
export declare const ESCAPE_EXPIRY_PERIOD: bigint;
export declare const MAX_U64: bigint;
export declare enum EscapeStatus {
    None = 0,
    NotReady = 1,
    Ready = 2,
    Expired = 3
}
export declare const ESCAPE_TYPE_NONE: CairoCustomEnum;
export declare const ESCAPE_TYPE_GUARDIAN: CairoCustomEnum;
export declare const ESCAPE_TYPE_OWNER: CairoCustomEnum;
export declare const signOwnerAliveMessage: (accountAddress: string, newOwner: KeyPair, chainId: string, maxTimestamp: number) => Promise<import("starknet").Calldata>;
export declare function getOwnerAliveMessageHash(accountAddress: string, chainId: string, ownerGuid: bigint, signatureExpiration: number): string;
export declare function hasOngoingEscape(accountContract: ArgentAccountContract): Promise<boolean>;
export declare function getEscapeStatus(accountContract: ArgentAccountContract): Promise<EscapeStatus>;
//# sourceMappingURL=recovery.d.ts.map