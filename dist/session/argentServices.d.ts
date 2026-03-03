import type { Account, ArraySignatureType, Call, InvocationsSignerDetails, TypedData, TypedDataRevision } from "starknet";
import type { OutsideExecution } from "../outsideExecution.js";
import type { EstimateStarknetKeyPair, StarknetKeyPair } from "../signers/signers.js";
import type { Session } from "./session.js";
export declare class ArgentX {
    account: Account;
    backendService: BackendService;
    constructor(account: Account, backendService: BackendService);
    getOffchainSignature(typedData: TypedData): Promise<ArraySignatureType>;
}
export declare class BackendService {
    private backendKey;
    constructor(backendKey: StarknetKeyPair | EstimateStarknetKeyPair);
    signTxAndSession(calls: Call[], transactionDetail: InvocationsSignerDetails, sessionTokenToSign: Session, cacheOwnerGuid?: bigint): Promise<bigint[]>;
    signOutsideTxAndSession(_calls: Call[], sessionTokenToSign: Session, accountAddress: string, outsideExecution: OutsideExecution, revision: TypedDataRevision, cacheOwnerGuid?: bigint): Promise<bigint[]>;
    getBackendKey(_accountAddress: string): bigint;
}
//# sourceMappingURL=argentServices.d.ts.map