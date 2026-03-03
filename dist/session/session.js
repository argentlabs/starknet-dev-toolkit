import { CallData, TypedDataRevision, byteArray, hash, merkle, selector, shortString, typedData } from "starknet";
import { manager } from "../manager.js";
import { randomStarknetKeyPair } from "../signers/signers.js";
import { ArgentX, BackendService } from "./argentServices.js";
import { DappService } from "./sessionServices.js";
export const sessionTypes = {
    StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
    ],
    "Allowed Method": [
        { name: "Contract Address", type: "ContractAddress" },
        { name: "selector", type: "selector" },
    ],
    Session: [
        { name: "Expires At", type: "timestamp" },
        { name: "Allowed Methods", type: "merkletree", contains: "Allowed Method" },
        { name: "Metadata", type: "string" },
        { name: "Session Key", type: "felt" },
    ],
};
export const ALLOWED_METHOD_HASH = typedData.getTypeHash(sessionTypes, "Allowed Method", TypedDataRevision.ACTIVE);
export function singleMethodAllowList(contract, selector) {
    return [
        {
            "Contract Address": typeof contract === "string" ? contract : contract.address,
            selector,
        },
    ];
}
export class SessionToken {
    session;
    proofs;
    cacheOwnerGuid;
    sessionAuthorization;
    sessionSignature;
    guardianSignature;
    legacyMode;
    constructor({ session, cacheOwnerGuid, sessionAuthorization, sessionSignature, guardianSignature, calls, isLegacyAccount, }) {
        this.session = session;
        this.proofs = session.getProofs(calls);
        this.cacheOwnerGuid = cacheOwnerGuid;
        this.sessionAuthorization = sessionAuthorization;
        this.sessionSignature = sessionSignature;
        this.guardianSignature = guardianSignature;
        this.legacyMode = isLegacyAccount;
    }
    compileSignature() {
        const SESSION_MAGIC = shortString.encodeShortString("session-token");
        const tokenData = {
            session: this.session.toOnChainSession(),
            ...(this.legacyMode
                ? { cache_authorization: this.cacheOwnerGuid !== undefined }
                : { cache_owner_guid: this.cacheOwnerGuid ?? 0 }),
            session_authorization: this.sessionAuthorization ?? [],
            session_signature: this.sessionSignature,
            guardian_signature: this.guardianSignature,
            proofs: this.proofs,
        };
        return [SESSION_MAGIC, ...CallData.compile(tokenData)];
    }
}
export class Session {
    expiresAt;
    allowedMethods;
    metadata;
    sessionKeyGuid;
    legacyMode;
    constructor(expiresAt, allowedMethods, metadata, sessionKeyGuid, legacyMode = false) {
        this.expiresAt = expiresAt;
        this.allowedMethods = allowedMethods;
        this.metadata = metadata;
        this.sessionKeyGuid = sessionKeyGuid;
        this.legacyMode = legacyMode;
    }
    buildMerkleTree() {
        const leaves = this.allowedMethods.map((method) => hash.computePoseidonHashOnElements([
            ALLOWED_METHOD_HASH,
            method["Contract Address"],
            selector.getSelectorFromName(method.selector),
        ]));
        return new merkle.MerkleTree(leaves, hash.computePoseidonHash);
    }
    getProofs(calls) {
        const merkleTree = this.buildMerkleTree();
        return calls.map((call) => {
            const allowedIndex = this.allowedMethods.findIndex((allowedMethod) => {
                return allowedMethod["Contract Address"] == call.contractAddress && allowedMethod.selector == call.entrypoint;
            });
            return merkleTree.getProof(merkleTree.leaves[allowedIndex], merkleTree.leaves);
        });
    }
    async isSessionCached(accountAddress, cacheOwnerGuid, cacheGuardianGuid) {
        if (!cacheOwnerGuid || !cacheGuardianGuid)
            return false;
        const sessionContract = await manager.loadContract(accountAddress);
        const sessionMessageHash = typedData.getMessageHash(await this.getTypedData(), accountAddress);
        if (this.legacyMode) {
            return await sessionContract.is_session_authorization_cached(sessionMessageHash);
        }
        return await sessionContract.is_session_authorization_cached(sessionMessageHash, cacheOwnerGuid, cacheGuardianGuid);
    }
    async hashWithTransaction(transactionHash, accountAddress, cacheOwnerGuid) {
        const sessionMessageHash = typedData.getMessageHash(await this.getTypedData(), accountAddress);
        const sessionWithTxHash = hash.computePoseidonHashOnElements([
            transactionHash,
            sessionMessageHash,
            this.legacyMode ? +(cacheOwnerGuid != undefined) : (cacheOwnerGuid ?? 0),
        ]);
        return sessionWithTxHash;
    }
    async getTypedData() {
        return {
            types: sessionTypes,
            primaryType: "Session",
            domain: await this.getSessionDomain(),
            message: {
                "Expires At": this.expiresAt,
                "Allowed Methods": this.allowedMethods,
                Metadata: this.metadata,
                "Session Key": this.sessionKeyGuid,
            },
        };
    }
    async getSessionDomain() {
        // WARNING! Revision is encoded as a number in the StarkNetDomain type and not as shortstring
        // This is due to a bug in the Braavos implementation, and has been kept for compatibility
        const chainId = await manager.getChainId();
        return {
            name: "SessionAccount.session",
            version: shortString.encodeShortString("1"),
            chainId: chainId,
            revision: "1",
        };
    }
    toOnChainSession() {
        const bArray = byteArray.byteArrayFromString(this.metadata);
        const metadataHash = hash.computePoseidonHashOnElements(CallData.compile(bArray));
        return {
            expires_at: this.expiresAt,
            allowed_methods_root: this.buildMerkleTree().root.toString(),
            metadata_hash: metadataHash,
            session_key_guid: this.sessionKeyGuid ?? 0n,
        };
    }
}
export async function setupSession({ guardian, account, allowedMethods, expiry = BigInt(Date.now()) + 10000n, dappKey = randomStarknetKeyPair(), cacheOwnerGuid = undefined, isLegacyAccount = false, }) {
    const backendService = new BackendService(guardian);
    const dappService = new DappService(backendService, dappKey);
    const argentX = new ArgentX(account, backendService);
    const sessionRequest = dappService.createSessionRequest(allowedMethods, expiry, isLegacyAccount);
    const sessionTypedData = await sessionRequest.getTypedData();
    const authorizationSignature = await argentX.getOffchainSignature(sessionTypedData);
    return {
        accountWithDappSigner: dappService.getAccountWithSessionSigner(account, sessionRequest, authorizationSignature, cacheOwnerGuid, isLegacyAccount),
        sessionHash: typedData.getMessageHash(sessionTypedData, account.address),
        allowedMethods,
        sessionRequest,
        authorizationSignature,
        backendService,
        dappService,
        argentX,
    };
}
//# sourceMappingURL=session.js.map