import { Account } from "starknet";
import { generateRandomNumber } from "./random.js";
const dumpFolderPath = "./dump";
export const devnetBaseUrl = "http://127.0.0.1:5050";
// TODO Could this be replace with starknet-devnet?
export function WithDevnet(Base) {
    return class extends Base {
        get isDevnet() {
            try {
                const url = new URL(this.channel.nodeUrl);
                return url.hostname === "localhost" || url.hostname === "127.0.0.1";
            }
            catch {
                return false;
            }
        }
        // Polls quickly for a local network
        waitForTransaction(transactionHash, options = {}) {
            const retryInterval = this.isDevnet ? 100 : 1000;
            return super.waitForTransaction(transactionHash, { retryInterval, ...options });
        }
        async mintEth(address, amount) {
            await this.handleJsonRpc("devnet_mint", { address, amount: Number(amount), unit: "WEI" });
        }
        async mintStrk(address, amount) {
            await this.handleJsonRpc("devnet_mint", { address, amount: Number(amount), unit: "FRI" });
        }
        async increaseTime(timeInSeconds) {
            await this.handleJsonRpc("devnet_increaseTime", { time: Number(timeInSeconds) });
        }
        async setTime(timeInSeconds) {
            await this.handleJsonRpc("devnet_setTime", { time: Number(timeInSeconds), generate_block: true });
        }
        async restart() {
            await this.handleJsonRpc("devnet_restart");
        }
        async dump() {
            await this.handleJsonRpc("devnet_dump", { path: dumpFolderPath });
        }
        async load() {
            await this.handleJsonRpc("devnet_load", { path: dumpFolderPath });
        }
        async handleJsonRpc(method, params = {}) {
            const body = {
                jsonrpc: "2.0",
                id: Number(generateRandomNumber()),
                method,
                params,
            };
            const res = await fetch(`${this.channel.nodeUrl}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = (await res.json());
            if (json.error) {
                throw new Error(`RPC Error: ${json.error.message}`);
            }
            return json.result;
        }
    };
}
export async function getPredeployedDevnetAccount(provider, excludeAddress, accountOptions) {
    if (provider.isDevnet === false) {
        throw new Error("Predeployed account lookup requires devnet");
    }
    const accounts = (await provider.handleJsonRpc("devnet_getPredeployedAccounts"));
    const excluded = excludeAddress?.toLowerCase();
    const candidate = accounts.find((account) => !excluded || account.address.toLowerCase() !== excluded);
    if (!candidate) {
        throw new Error("No predeployed devnet account available");
    }
    return new Account({
        provider,
        address: candidate.address,
        signer: candidate.private_key,
        ...accountOptions,
    });
}
//# sourceMappingURL=devnet.js.map