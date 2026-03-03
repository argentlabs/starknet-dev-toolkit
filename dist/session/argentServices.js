import { typedData } from "starknet";
import { manager } from "../manager.js";
import { getTypedData } from "../outsideExecution.js";
import { calculateTransactionHash } from "../transactions.js";
export class ArgentX {
    account;
    backendService;
    constructor(account, backendService) {
        this.account = account;
        this.backendService = backendService;
    }
    async getOffchainSignature(typedData) {
        return (await this.account.signMessage(typedData));
    }
}
export class BackendService {
    backendKey;
    // TODO We might want to update this to support KeyPair instead of StarknetKeyPair?
    // Or that backend becomes: "export class BackendService extends KeyPair {", can also extends RawSigner ?
    constructor(backendKey) {
        this.backendKey = backendKey;
    }
    async signTxAndSession(calls, transactionDetail, sessionTokenToSign, cacheOwnerGuid) {
        // verify session param correct
        // extremely simplified version of the backend verification
        // backend must check, timestamps fees, used tokens nfts...
        const allowedMethods = sessionTokenToSign.allowedMethods;
        if (!calls.every((call) => {
            return allowedMethods.some((method) => method["Contract Address"] === call.contractAddress && method.selector === call.entrypoint);
        })) {
            throw new Error("Call not allowed by backend");
        }
        const transactionHash = calculateTransactionHash(transactionDetail, calls);
        const sessionWithTxHash = await sessionTokenToSign.hashWithTransaction(transactionHash, transactionDetail.walletAddress, cacheOwnerGuid);
        const signature = await this.backendKey.signRaw(sessionWithTxHash);
        return [BigInt(signature[2]), BigInt(signature[3])];
    }
    async signOutsideTxAndSession(_calls, sessionTokenToSign, accountAddress, outsideExecution, revision, cacheOwnerGuid) {
        // TODO backend must verify, timestamps fees, used tokens nfts...
        const currentTypedData = getTypedData(outsideExecution, await manager.getChainId(), revision);
        const messageHash = typedData.getMessageHash(currentTypedData, accountAddress);
        const sessionWithTxHash = await sessionTokenToSign.hashWithTransaction(messageHash, accountAddress, cacheOwnerGuid);
        const signature = await this.backendKey.signRaw(sessionWithTxHash);
        return [BigInt(signature[2]), BigInt(signature[3])];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getBackendKey(_accountAddress) {
        return this.backendKey.publicKey;
    }
}
//# sourceMappingURL=argentServices.js.map