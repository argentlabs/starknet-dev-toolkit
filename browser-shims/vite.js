import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Returns a Vite (or similar) resolve.alias map so Node built-ins used by the toolkit
 * are resolved to these browser shims. Use in vite.config:
 *   import { getNodeShimAliases } from "starknet-dev-toolkit/browser-shims/vite";
 *   resolve: { alias: getNodeShimAliases() }
 */
export function getNodeShimAliases() {
  return {
    fs: path.resolve(__dirname, "fs.js"),
    path: path.resolve(__dirname, "path.js"),
    crypto: path.resolve(__dirname, "crypto.js"),
    child_process: path.resolve(__dirname, "child_process.js"),
  };
}

/**
 * Returns a Vite `define` map that injects process.env and process.argv into the
 * browser bundle at compile time. Reads RPC_URL, ADDRESS, PRIVATE_KEY from the
 * Node process.env (loaded from .env by Vite/SvelteKit) and forwards CLI args.
 *
 *   import { getNodeShimAliases, getEnvDefines } from "starknet-dev-toolkit/browser-shims/vite";
 *   export default defineConfig({
 *     define: getEnvDefines(),
 *     resolve: { alias: getNodeShimAliases() },
 *   });
 */
export function getEnvDefines() {
  return {
    "process.env.RPC_URL": JSON.stringify(process.env.RPC_URL ?? ""),
    "process.env.ADDRESS": JSON.stringify(process.env.ADDRESS ?? ""),
    "process.env.PRIVATE_KEY": JSON.stringify(process.env.PRIVATE_KEY ?? ""),
    "process.argv": JSON.stringify(process.argv.slice(2)),
  };
}
