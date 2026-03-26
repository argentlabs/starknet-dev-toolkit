// Browser shim for Node child_process
import { createShim } from "./shim.js";
const childProcess = createShim("child_process");
export default childProcess;
export const { exec, execSync } = childProcess;
