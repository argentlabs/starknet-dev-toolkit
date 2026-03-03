import { assert, expect } from "chai";
import { shortString } from "starknet";
import { manager } from "./manager.js";
export async function expectRevertWithErrorMessage(errorMessage, execute) {
    try {
        await manager.waitForTx(execute);
    }
    catch (e) {
        const errorStr = String(e);
        if (!errorStr.includes(shortString.encodeShortString(errorMessage))) {
            const match = errorStr.match(/\[([^\]]+)]/);
            if (match && match.length > 1) {
                console.log(e);
                assert.fail(`"${errorMessage}" not detected, instead got: "${shortString.decodeShortString(match[1])}"`);
            }
            else {
                assert.fail(`No error detected in: ${errorStr}`);
            }
        }
        return;
    }
    assert.fail("No error detected");
}
export async function expectExecutionRevert(errorMessage, execute) {
    try {
        const receipt = await manager.waitForTx(execute);
        expect(receipt.isSuccess()).to.equal(true);
    }
    catch (e) {
        const errorStr = String(e);
        expect(errorStr).to.contain(shortString.encodeShortString(errorMessage));
        return;
    }
    assert.fail("No error detected");
}
//# sourceMappingURL=expectations.js.map