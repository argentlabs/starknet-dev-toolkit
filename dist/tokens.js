import { Contract, num } from "starknet";
const ethAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export class TokenManager {
    manager;
    ethCache;
    strkCache;
    constructor(manager) {
        this.manager = manager;
    }
    async ethContract() {
        if (this.ethCache) {
            return this.ethCache;
        }
        const ethProxy = await this.manager.loadContract(ethAddress);
        if (ethProxy.abi.some((entry) => entry.name === "implementation")) {
            const proxy = ethProxy;
            const { address } = await proxy.implementation();
            const { abi } = await this.manager.loadContract(num.toHex(address));
            this.ethCache = new Contract({
                abi,
                address: ethAddress,
                providerOrAccount: ethProxy.providerOrAccount,
            });
        }
        else {
            this.ethCache = await this.manager.loadContract(ethAddress);
        }
        return this.ethCache;
    }
    async strkContract() {
        if (this.strkCache) {
            return this.strkCache;
        }
        this.strkCache = await this.manager.loadContract(strkAddress);
        return this.strkCache;
    }
    async ethBalance(accountAddress) {
        const ethContract = await this.ethContract();
        return await ethContract.balance_of(accountAddress);
    }
    async strkBalance(accountAddress) {
        const strkContract = await this.strkContract();
        return await strkContract.balance_of(accountAddress);
    }
}
//# sourceMappingURL=tokens.js.map