import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Returns a Vite (or similar) resolve.alias map so Node built-ins used by the toolkit
 * are resolved to these browser shims. Use in vite.config:
 *   import { getNodeShimAliases } from "starknet-dev-toolkit/browser-shims/alias";
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
