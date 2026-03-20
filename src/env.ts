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

/**
 * Returns current env from process.env / process.argv. In browser, getEnvDefines()
 * injects --allow-rpc-url-env into process.argv so the same check works in both environments.
 */
export function getEnv(): ToolkitEnv {
  if (typeof process !== "undefined" && process.env) {
    return {
      nodeUrl: process.env.RPC_URL || devnetBaseUrl,
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
