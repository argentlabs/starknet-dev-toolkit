import type { ArraySignatureType, Call, InvocationsSignerDetails } from "starknet";
import { TypedDataRevision } from "starknet";
import { ArgentAccount } from "../accounts.js";
import type { StarknetKeyPair } from "../signers/signers.js";
import type { BackendService } from "./argentServices.js";
import type { AllowedMethod } from "./session.js";
import { Session, SessionToken } from "./session.js";
export declare class DappService {
    private argentBackend;
    sessionKey: StarknetKeyPair;
    constructor(argentBackend: BackendService, sessionKey?: StarknetKeyPair);
    createSessionRequest(allowed_methods: AllowedMethod[], expires_at: bigint, isLegacyAccount?: boolean): Session;
    getAccountWithSessionSigner(account: ArgentAccount, completedSession: Session, authorizationSignature: ArraySignatureType, cacheOwnerGuid?: bigint, isLegacyAccount?: boolean): ArgentAccount;
    getSessionToken({ calls, account, completedSession, authorizationSignature, cacheOwnerGuid, isLegacyAccount, transactionDetail: providedTransactionDetail, }: {
        calls: Call[];
        account: ArgentAccount;
        completedSession: Session;
        authorizationSignature?: ArraySignatureType;
        cacheOwnerGuid?: bigint;
        isLegacyAccount?: boolean;
        transactionDetail?: InvocationsSignerDetails;
    }): Promise<SessionToken>;
    getOutsideExecutionCall(completedSession: Session, authorizationSignature: ArraySignatureType, calls: Call[], revision: TypedDataRevision, accountAddress: string, caller?: string, execute_after?: number, execute_before?: number, nonce?: bigint, cacheOwnerGuid?: undefined, isLegacyAccount?: boolean): Promise<Call>;
    private generateSessionSignatures;
    private signTxAndSession;
    private getStarknetSignatureType;
}
//# sourceMappingURL=sessionServices.d.ts.map