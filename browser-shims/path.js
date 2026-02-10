// Browser shim for Node path
import { createShim } from "./shim.js";
export const sep = "/";
const path = Object.assign(createShim("path"), { sep });
export default path;
export const { resolve, dirname } = path;
