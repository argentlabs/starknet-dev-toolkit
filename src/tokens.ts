import { Contract, num } from "starknet";
import type { Erc20Contract, ProxyWithImplementationContract } from "./contractTypes.js";
import type { Manager } from "./manager.js";

const ethAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export class TokenManager {
  private ethCache?: Erc20Contract;
  private strkCache?: Erc20Contract;

  constructor(private manager: Manager) {}

  async ethContract(): Promise<Erc20Contract> {
    if (this.ethCache) {
      return this.ethCache;
    }
    const ethProxy = await this.manager.loadContract<Contract>(ethAddress);
    if (ethProxy.abi.some((entry: { name: string }) => entry.name === "implementation")) {
      const proxy = ethProxy as ProxyWithImplementationContract;
      const { address } = await proxy.implementation();
      const { abi } = await this.manager.loadContract<Contract>(num.toHex(address));
      this.ethCache = new Contract({
        abi,
        address: ethAddress,
        providerOrAccount: ethProxy.providerOrAccount,
      }) as unknown as Erc20Contract;
    } else {
      this.ethCache = await this.manager.loadContract<Erc20Contract>(ethAddress);
    }
    return this.ethCache;
  }

  async strkContract(): Promise<Erc20Contract> {
    if (this.strkCache) {
      return this.strkCache;
    }
    this.strkCache = await this.manager.loadContract<Erc20Contract>(strkAddress);
    return this.strkCache;
  }

  async ethBalance(accountAddress: string): Promise<bigint> {
    const ethContract = await this.ethContract();
    return await ethContract.balance_of(accountAddress);
  }

  async strkBalance(accountAddress: string): Promise<bigint> {
    const strkContract = await this.strkContract();
    return await strkContract.balance_of(accountAddress);
  }
}
