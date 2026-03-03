import type { ArraySignatureType, CairoCustomEnum, Call, TypedData } from "starknet";
import type { ArgentAccount } from "../accounts.js";
import type { ContractLike } from "../contracts.js";
import type { EstimateStarknetKeyPair, StarknetKeyPair } from "../signers/signers.js";
import { ArgentX, BackendService } from "./argentServices.js";
import { DappService } from "./sessionServices.js";
export declare const sessionTypes: {
    StarknetDomain: {
        name: string;
        type: string;
    }[];
    "Allowed Method": {
        name: string;
        type: string;
    }[];
    Session: ({
        name: string;
        type: string;
        contains?: undefined;
    } | {
        name: string;
        type: string;
        contains: string;
    })[];
};
export declare const ALLOWED_METHOD_HASH: string;
export interface AllowedMethod {
    "Contract Address": string;
    selector: string;
}
export declare function singleMethodAllowList(contract: string | ContractLike, selector: string): AllowedMethod[];
export interface OnChainSession {
    expires_at: bigint;
    allowed_methods_root: string;
    metadata_hash: string;
    session_key_guid: bigint;
}
export declare class SessionToken {
    session: Session;
    proofs: string[][];
    cacheOwnerGuid?: bigint;
    sessionAuthorization?: string[];
    sessionSignature: CairoCustomEnum;
    guardianSignature: CairoCustomEnum;
    private legacyMode;
    constructor({ session, cacheOwnerGuid, sessionAuthorization, sessionSignature, guardianSignature, calls, isLegacyAccount, }: {
        session: Session;
        cacheOwnerGuid?: bigint;
        sessionAuthorization?: string[];
        sessionSignature: CairoCustomEnum;
        guardianSignature: CairoCustomEnum;
        calls: Call[];
        isLegacyAccount: boolean;
    });
    compileSignature(): string[];
}
export declare class Session {
    expiresAt: bigint;
    allowedMethods: AllowedMethod[];
    metadata: string;
    sessionKeyGuid?: bigint | undefined;
    private legacyMode;
    constructor(expiresAt: bigint, allowedMethods: AllowedMethod[], metadata: string, sessionKeyGuid?: bigint | undefined, legacyMode?: boolean);
    private buildMerkleTree;
    getProofs(calls: Call[]): string[][];
    isSessionCached(accountAddress: string, cacheOwnerGuid?: bigint, cacheGuardianGuid?: bigint): Promise<boolean>;
    hashWithTransaction(transactionHash: string, accountAddress: string, cacheOwnerGuid?: bigint): Promise<string>;
    getTypedData(): Promise<TypedData>;
    private getSessionDomain;
    toOnChainSession(): OnChainSession;
}
interface SessionSetup {
    accountWithDappSigner: ArgentAccount;
    sessionHash: string;
    allowedMethods: AllowedMethod[];
    sessionRequest: Session;
    authorizationSignature: ArraySignatureType;
    backendService: BackendService;
    dappService: DappService;
    argentX: ArgentX;
}
export declare function setupSession({ guardian, account, allowedMethods, expiry, dappKey, cacheOwnerGuid, isLegacyAccount, }: {
    guardian: StarknetKeyPair | EstimateStarknetKeyPair;
    account: ArgentAccount;
    mockDappContractAddress?: string;
    allowedMethods: AllowedMethod[];
    expiry?: bigint;
    dappKey?: StarknetKeyPair;
    cacheOwnerGuid?: bigint;
    isLegacyAccount?: boolean;
}): Promise<SessionSetup>;
export {};
//# sourceMappingURL=session.d.ts.map