import { Account } from "starknet";
import type { ContractWithClassHash } from "./contracts.js";
import { LegacyStarknetKeyPair } from "./signers/legacy.js";
type DeployOzAccountParams = {
    owner?: LegacyStarknetKeyPair;
    salt?: string;
    fundingAmount?: number | bigint;
};
type DeployOzAccountResult = {
    account: Account;
    accountContract: ContractWithClassHash;
    deployTxHash: string;
    owner: LegacyStarknetKeyPair;
    salt: string;
};
export declare function deployOpenZeppelinAccount(params: DeployOzAccountParams): Promise<DeployOzAccountResult>;
export {};
//# sourceMappingURL=openZeppelinAccount.d.ts.map