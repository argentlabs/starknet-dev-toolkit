import { RpcProvider } from "starknet";
import { WithContracts } from "./contracts.js";
import { WithDevnet, devnetBaseUrl } from "./devnet.js";
import { getEnv } from "./env.js";
import { WithReceipts } from "./receipts.js";
import { TokenManager } from "./tokens.js";
export class Manager extends WithReceipts(WithContracts(WithDevnet(RpcProvider))) {
    tokens;
    constructor(options) {
        super(options);
        this.tokens = new TokenManager(this);
    }
    async getCurrentTimestamp() {
        return (await this.getBlock("latest")).timestamp;
    }
}
async function getManager() {
    const env = getEnv();
    if (env.nodeUrl !== devnetBaseUrl && !env.allowRpcUrlEnv) {
        console.log("When using a custom RPC URL, you must set allowRpcUrlEnv: true or pass --allow-rpc-url-env");
        if (typeof process !== "undefined" && process.exit) {
            process.exit(1);
        }
    }
    const instance = await RpcProvider.create.call(Manager, { nodeUrl: env.nodeUrl });
    console.log("Provider:", instance.channel.nodeUrl);
    void instance.channel.getSpecVersion().then((v) => console.log("RPC version:", v));
    return instance;
}
export const manager = (await getManager());
//# sourceMappingURL=manager.js.map