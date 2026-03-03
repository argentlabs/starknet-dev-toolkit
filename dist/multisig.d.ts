import type { GetTransactionReceiptResponse } from "starknet";
import { Account } from "starknet";
import type { ArgentMultisigContract } from "./contractTypes.js";
import type { LegacyMultisigKeyPair } from "./signers/legacy.js";
import { LegacyMultisigSigner } from "./signers/legacy.js";
import type { KeyPair } from "./signers/signers.js";
interface MultisigWallet {
    account: Account;
    accountContract: ArgentMultisigContract;
    keys: KeyPair[];
    threshold: bigint;
    receipt: GetTransactionReceiptResponse;
}
type DeployMultisigParams = {
    threshold: number;
    signersLength?: number;
    keys?: KeyPair[];
    classHash?: string;
    salt?: string;
    fundingAmount?: number | bigint;
    selfDeploy?: boolean;
    selfDeploymentIndexes?: number[];
};
export declare function deployMultisig(params: DeployMultisigParams): Promise<MultisigWallet>;
export declare function deployMultisig1_3(params?: Omit<DeployMultisigParams, "threshold" | "signersLength">): Promise<MultisigWallet>;
export declare function deployMultisig1_1(params?: Omit<DeployMultisigParams, "threshold" | "signersLength">): Promise<MultisigWallet>;
interface LegacyMultisigWallet {
    account: Account;
    accountContract: ArgentMultisigContract;
    keys: LegacyMultisigKeyPair[];
    deploySigner: LegacyMultisigSigner;
}
export declare function deployLegacyMultisig(classHash: string, threshold?: number): Promise<LegacyMultisigWallet>;
export {};
//# sourceMappingURL=multisig.d.ts.map