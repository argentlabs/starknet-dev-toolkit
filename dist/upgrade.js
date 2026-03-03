import { CallData, outsideExecution } from "starknet";
export function getUpgradeData(calls) {
    const externalCalls = calls.map(outsideExecution.getOutsideCall);
    return CallData.compile({ externalCalls });
}
export function getUpgradeDataLegacy(calls) {
    const upgradeData = getUpgradeData(calls);
    return CallData.compile({ upgradeData });
}
//# sourceMappingURL=upgrade.js.map