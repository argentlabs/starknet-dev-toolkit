import { devnetBaseUrl } from "./devnet.js";

/**
 * Environment/config used by the toolkit for node URL and deployer credentials.
 * Isolated so it can be overridden in web projects (no dotenv or process.env in core).
 */
export interface ToolkitEnv {
  /** RPC node URL (e.g. devnet or a remote RPC). */
  nodeUrl: string;
  /** Deployer address (for non-devnet). Omit to use devnet predeployed account. */
  deployerAddress?: string;
  /** Deployer private key (for non-devnet). */
  deployerPrivateKey?: string;
  /** If true, allow using a custom RPC URL without passing --allow-rpc-url-env. */
  allowRpcUrlEnv?: boolean;
}

let envProvider: (() => ToolkitEnv) | null = null;

/**
 * Override how the toolkit gets env (e.g. in web: pass a function that returns your config).
 * Call this before using manager/deployer if you are not using the Node env provider.
 */
export function setEnvProvider(provider: () => ToolkitEnv) {
  envProvider = provider;
}

/**
 * Returns current env. Uses the provider set via setEnvProvider; otherwise in Node reads from
 * process.env / process.argv; in browser returns devnet defaults.
 */
export function getEnv(): ToolkitEnv {
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
