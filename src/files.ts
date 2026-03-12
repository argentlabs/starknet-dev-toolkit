import { readFileSync } from "fs";
import { json } from "starknet";

export function readJsonFile<T>(path: string): T {
  return json.parse(readFileSync(path).toString("ascii")) as T;
}
