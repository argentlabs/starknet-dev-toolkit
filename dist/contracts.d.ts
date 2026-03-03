import type { RpcProvider, UniversalDeployerContractPayload, UniversalDetails } from "starknet";
import { Contract } from "starknet";
import type { ContractWithPopulate } from "./contractTypes.js";
import type { DevnetMixin } from "./devnet.js";
import type { Constructor } from "./types.js";
export interface ContractsMixin {
    clearClassCache(): void;
    restartDevnetAndClearClassCache(): Promise<void>;
    declareLocalContract(contractName: string, wait?: boolean, folder?: string): Promise<string>;
    declareArtifactAccountContract(contractVersion: string, wait?: boolean): Promise<string>;
    declareArtifactMultisigContract(contractVersion: string, wait?: boolean): Promise<string>;
    loadContract<T extends ContractLike = Contract>(contractAddress: string, classHash?: string): Promise<ContractWithClassHash<T>>;
    declareAndDeployContract<T extends ContractLike = Contract>(contractName: string, payload?: Omit<UniversalDeployerContractPayload, "classHash"> | UniversalDeployerContractPayload[], details?: UniversalDetails): Promise<ContractWithClassHash<T>>;
}
export declare function WithContracts<T extends Constructor<RpcProvider & DevnetMixin>>(Base: T): Constructor<InstanceType<T> & ContractsMixin>;
export type ContractLike = Contract | ContractWithPopulate<unknown>;
export type ContractWithClassHash<T extends ContractLike = Contract> = T & {
    classHash: string;
};
//# sourceMappingURL=contracts.d.ts.map