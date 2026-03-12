// Browser shim for Node fs - toolkit is Node-oriented; browser apps only use account/signers/devnet/tokens.
import { createShim } from "./shim.js";
const fs = createShim("fs");
export default fs;
export const { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, createReadStream } = fs;
