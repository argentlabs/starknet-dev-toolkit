// Browser shim for Node crypto
import { createShim } from "./shim.js";
const crypto = createShim("crypto");
export default crypto;
export const { createHash, createReadStream } = crypto;
