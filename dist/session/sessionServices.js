import { CallData, TypedDataRevision, outsideExecution as outsideExecutionSnjs, typedData } from "starknet";
import { ArgentAccount, getSignerDetails } from "../accounts.js";
import { manager } from "../manager.js";
import { getTypedData } from "../outsideExecution.js";
import { RawSigner, SignerType, randomStarknetKeyPair, signerTypeToCustomEnum } from "../signers/signers.js";
import { calculateTransactionHash } from "../transactions.js";
import { Session, SessionToken } from "./session.js";
export class DappService {
    argentBackend;
    sessionKey;
    constructor(argentBackend, sessionKey = randomStarknetKeyPair()) {
        this.argentBackend = argentBackend;
        this.sessionKey = sessionKey;
    }
    createSessionRequest(allowed_methods, expires_at, isLegacyAccount = false) {
        const metadata = JSON.stringify({ metadata: "metadata", max_fee: 0 });
        return new Session(expires_at, allowed_methods, metadata, this.sessionKey.guid, isLegacyAccount);
    }
    getAccountWithSessionSigner(account, completedSession, authorizationSignature, cacheOwnerGuid = 0n, isLegacyAccount = false) {
        const sessionSigner = new SessionSigner(async (calls, transactionDetail) => {
            const sessionToken = await this.getSessionToken({
                calls,
                account,
                completedSession,
                authorizationSignature,
                cacheOwnerGuid,
                isLegacyAccount,
                transactionDetail,
            });
            return sessionToken.compileSignature();
        });
        return new ArgentAccount({
            provider: manager,
            address: account.address,
            signer: sessionSigner,
            cairoVersion: account.cairoVersion,
            transactionVersion: account.transactionVersion,
        });
    }
    async getSessionToken({ calls, account, completedSession, authorizationSignature, cacheOwnerGuid, isLegacyAccount = false, transactionDetail: providedTransactionDetail, }) {
        const transactionDetail = providedTransactionDetail ?? (await getSignerDetails(account, calls));
        const transactionHash = calculateTransactionHash(transactionDetail, calls);
        const accountAddress = transactionDetail.walletAddress;
        const { sessionSignature, guardianSignature } = await this.generateSessionSignatures({
            completedSession,
            transactionHash,
            calls,
            accountAddress,
            cacheOwnerGuid,
            transactionDetail,
        });
        const isSessionCached = await completedSession.isSessionCached(accountAddress, cacheOwnerGuid);
        return new SessionToken({
            session: completedSession,
            cacheOwnerGuid,
            sessionAuthorization: isSessionCached ? undefined : authorizationSignature,
            sessionSignature: this.getStarknetSignatureType(this.sessionKey.publicKey, sessionSignature),
            guardianSignature: this.getStarknetSignatureType(this.argentBackend.getBackendKey(accountAddress), guardianSignature),
            calls,
            isLegacyAccount,
        });
    }
    async getOutsideExecutionCall(completedSession, authorizationSignature, calls, revision, accountAddress, caller = "ANY_CALLER", execute_after = 1, execute_before = 999999999999999, nonce = randomStarknetKeyPair().publicKey, cacheOwnerGuid = undefined, isLegacyAccount = false) {
        const outsideExecution = {
            caller,
            nonce,
            execute_after,
            execute_before,
            calls: calls.map((call) => outsideExecutionSnjs.getOutsideCall(call)),
        };
        const currentTypedData = getTypedData(outsideExecution, await manager.getChainId(), revision);
        const messageHash = typedData.getMessageHash(currentTypedData, accountAddress);
        const { sessionSignature, guardianSignature } = await this.generateSessionSignatures({
            completedSession,
            transactionHash: messageHash,
            calls,
            accountAddress,
            cacheOwnerGuid,
            outsideExecution,
            revision,
        });
        const sessionToken = new SessionToken({
            session: completedSession,
            cacheOwnerGuid,
            sessionAuthorization: authorizationSignature,
            sessionSignature: this.getStarknetSignatureType(this.sessionKey.publicKey, sessionSignature),
            guardianSignature: this.getStarknetSignatureType(this.argentBackend.getBackendKey(accountAddress), guardianSignature),
            calls,
            isLegacyAccount,
        });
        const compiledSignature = sessionToken.compileSignature();
        return {
            contractAddress: accountAddress,
            entrypoint: revision == TypedDataRevision.ACTIVE ? "execute_from_outside_v2" : "execute_from_outside",
            calldata: CallData.compile({ ...outsideExecution, compiledSignature }),
        };
    }
    async generateSessionSignatures({ completedSession, transactionHash, calls, accountAddress, cacheOwnerGuid, transactionDetail, outsideExecution, revision, }) {
        let guardianSignature;
        if (outsideExecution && revision) {
            guardianSignature = await this.argentBackend.signOutsideTxAndSession(calls, completedSession, accountAddress, outsideExecution, revision, cacheOwnerGuid);
        }
        else if (transactionDetail) {
            guardianSignature = await this.argentBackend.signTxAndSession(calls, transactionDetail, completedSession, cacheOwnerGuid);
        }
        else {
            throw new Error("Invalid arguments: either outsideExecution and revision, or transactionDetail must be provided");
        }
        const sessionSignature = await this.signTxAndSession(completedSession, transactionHash, accountAddress, cacheOwnerGuid);
        return {
            sessionSignature,
            guardianSignature,
        };
    }
    async signTxAndSession(completedSession, transactionHash, accountAddress, cacheOwnerGuid) {
        const sessionWithTxHash = await completedSession.hashWithTransaction(transactionHash, accountAddress, cacheOwnerGuid);
        const signature = await this.sessionKey.signRaw(sessionWithTxHash);
        return [BigInt(signature[2]), BigInt(signature[3])];
    }
    // function needed as starknetSignatureType in signer.ts is already compiled
    getStarknetSignatureType(pubkey, signature) {
        return signerTypeToCustomEnum(SignerType.Starknet, { pubkey, r: signature[0], s: signature[1] });
    }
}
class SessionSigner extends RawSigner {
    signTransactionCallback;
    constructor(signTransactionCallback) {
        super();
        this.signTransactionCallback = signTransactionCallback;
    }
    // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
    async signRaw(_messageHash) {
        throw new Error("Method not implemented.");
    }
    async signTransaction(calls, transactionsDetail) {
        return this.signTransactionCallback(calls, transactionsDetail);
    }
}
//# sourceMappingURL=sessionServices.js.map