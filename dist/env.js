import { devnetBaseUrl } from "./devnet.js";
let envProvider = null;
/**
 * Override how the toolkit gets env (e.g. in web: pass a function that returns your config).
 * Call this before using manager/deployer if you are not using the Node env provider.
 */
export function setEnvProvider(provider) {
    envProvider = provider;
}
/**
 * Returns current env. Uses the provider set via setEnvProvider; otherwise in Node reads from
 * process.env / process.argv; in browser returns devnet defaults.
 */
export function getEnv() {
    if (envProvider) {
        return envProvider();
    }
    if (typeof process !== "undefined" && process.env) {
        return {
            nodeUrl: process.env.RPC_URL ?? devnetBaseUrl,
            deployerAddress: process.env.ADDRESS,
            deployerPrivateKey: process.env.PRIVATE_KEY,
            allowRpcUrlEnv: process.argv?.includes?.("--allow-rpc-url-env") ?? false,
        };
    }
    return {
        nodeUrl: devnetBaseUrl,
        allowRpcUrlEnv: false,
    };
}
//# sourceMappingURL=env.js.map