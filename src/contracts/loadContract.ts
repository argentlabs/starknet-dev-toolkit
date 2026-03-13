import type { Abi, RpcProvider } from "starknet";
import { Contract } from "starknet";
import type { Constructor } from "../types.js";
import type { ContractWithPopulate } from "./contractTypes.js";

export type ContractLike = Contract | ContractWithPopulate<unknown>;

export type ContractWithClassHash<T extends ContractLike = Contract> = T & { classHash: string };

export interface LoadContractMixin {
  loadContract<T extends ContractLike>(contractAddress: string, classHash?: string): Promise<ContractWithClassHash<T>>;
}

export function WithCachedContractLoader<T extends Constructor<RpcProvider>>(
  Base: T,
): Constructor<InstanceType<T> & LoadContractMixin> {
  return class extends Base {
    protected abiCache: Record<string, Abi> = {};

    async loadContract<T extends ContractLike = Contract>(
      contractAddress: string,
      classHash?: string,
    ): Promise<ContractWithClassHash<T>> {
      classHash ??= await this.getClassHashAt(contractAddress);
      let abi = this.abiCache[classHash];
      if (!abi) {
        abi = (await this.getClassByHash(classHash)).abi;
        this.abiCache[classHash] = abi;
      }
      return new Contract({
        abi,
        address: contractAddress,
        providerOrAccount: this,
        classHash,
      }) as ContractWithClassHash<T>;
    }
  } as unknown as Constructor<InstanceType<T> & LoadContractMixin>;
}
