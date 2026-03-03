import { readFileSync } from "fs";
import { json } from "starknet";
export function readJsonFile(path) {
    return json.parse(readFileSync(path).toString("ascii"));
}
//# sourceMappingURL=files.js.map