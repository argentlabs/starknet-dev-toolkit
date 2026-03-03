import type { AccountOptions, AllowArray, ArraySignatureType, Call, EstimateFeeBulk, EstimateFeeResponseOverhead, Invocations, InvocationsSignerDetails, InvokeFunctionResponse, RawCalldata, TransactionReceipt, UniversalDetails } from "starknet";
import { Account } from "starknet";
import type { ArgentAccountContract } from "./contractTypes.js";
import type { LegacyKeyPair } from "./signers/legacy.js";
import { LegacyStarknetKeyPair } from "./signers/legacy.js";
import type { KeyPair } from "./signers/signers.js";
export declare class ArgentAccount extends Account {
    constructor(options: AccountOptions);
    estimateFeeBulk(invocations: Invocations, details?: UniversalDetails): Promise<EstimateFeeBulk>;
}
declare class ArgentWallet implements ArgentWallet {
    readonly account: ArgentAccount;
    readonly classHash: string;
    readonly owners: KeyPair[];
    readonly guardians: KeyPair[];
    readonly salt: string;
    readonly transactionHash: string;
    readonly accountContract: ArgentAccountContract;
    constructor(account: ArgentAccount, classHash: string, owners: KeyPair[], guardians: KeyPair[], salt: string, transactionHash: string, accountContract: ArgentAccountContract);
    get owner(): KeyPair;
    get guardian(): KeyPair | undefined;
    static create(finalParams: DeployAccountParams & {
        account: ArgentAccount;
        classHash: string;
        owners: KeyPair[];
        guardians: KeyPair[];
        salt: string;
        transactionHash: string;
    }): Promise<ArgentWallet>;
}
interface LegacyArgentWallet {
    account: ArgentAccount;
    accountContract: ArgentAccountContract;
    owner: LegacyKeyPair;
    guardian?: LegacyKeyPair;
}
export declare const deployer: Account;
export declare function deployOldAccountWithProxy(owner?: LegacyStarknetKeyPair, guardian?: LegacyStarknetKeyPair, salt?: string): Promise<LegacyArgentWallet & {
    guardian: LegacyKeyPair;
}>;
export declare function deployOldAccountWithProxyWithoutGuardian(): Promise<LegacyArgentWallet>;
type DeployAccountParams = {
    classHash?: string;
    owners?: KeyPair[];
    owner?: KeyPair;
    guardians?: KeyPair[];
    guardian?: KeyPair;
    salt?: string;
    fundingAmount?: number | bigint;
    selfDeploy?: boolean;
};
export declare function deployAccount(params?: DeployAccountParams): Promise<ArgentWallet & {
    guardian: KeyPair;
}>;
export declare function deployAccountWithoutGuardians(params?: Omit<DeployAccountParams, "guardian" | "guardians">): Promise<Omit<ArgentWallet, "guardian" | "guardians">>;
export declare function deployLegacyAccount(classHash: string): Promise<LegacyArgentWallet>;
export declare function deployLegacyAccountWithoutGuardian(classHash: string): Promise<LegacyArgentWallet>;
export declare function upgradeAccount(accountToUpgrade: Account, newClassHash: string, calldata?: RawCalldata): Promise<TransactionReceipt>;
export declare function executeWithCustomSig(account: ArgentAccount, transactions: AllowArray<Call>, signature: ArraySignatureType, transactionsDetail?: UniversalDetails): Promise<InvokeFunctionResponse>;
export declare function estimateWithCustomSig(account: ArgentAccount, transactions: AllowArray<Call>, signature: ArraySignatureType): Promise<EstimateFeeResponseOverhead>;
export declare function getSignerDetails(account: ArgentAccount, calls: Call[]): Promise<InvocationsSignerDetails>;
export declare function fundAccountWithStrk(recipient: string, amount: number | bigint): Promise<void>;
export declare function fundAccountWithStrkCall(recipient: string, amount: number | bigint): Call | undefined;
export {};
//# sourceMappingURL=accounts.d.ts.map