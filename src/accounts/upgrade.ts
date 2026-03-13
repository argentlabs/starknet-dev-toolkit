import type { Call } from "starknet";
import { CallData, outsideExecution } from "starknet";

export function getUpgradeData(calls: Call[]) {
  const externalCalls = calls.map(outsideExecution.getOutsideCall);
  return CallData.compile({ externalCalls });
}

export function getUpgradeDataLegacy(calls: Call[]) {
  const upgradeData = getUpgradeData(calls);
  return CallData.compile({ upgradeData });
}
