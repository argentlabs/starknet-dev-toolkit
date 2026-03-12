import { assert, expect } from "chai";
import type { InvokeFunctionResponse } from "starknet";
import { shortString } from "starknet";
import { manager } from "./manager.js";

export async function expectRevertWithErrorMessage(
  errorMessage: string,
  execute: Promise<{ transaction_hash: string }>,
) {
  try {
    await manager.waitForTx(execute);
  } catch (e) {
    const errorStr = String(e);
    if (!errorStr.includes(shortString.encodeShortString(errorMessage))) {
      const match = errorStr.match(/\[([^\]]+)]/);
      if (match && match.length > 1) {
        console.log(e);
        assert.fail(`"${errorMessage}" not detected, instead got: "${shortString.decodeShortString(match[1])}"`);
      } else {
        assert.fail(`No error detected in: ${errorStr}`);
      }
    }
    return;
  }
  assert.fail("No error detected");
}

export async function expectExecutionRevert(errorMessage: string, execute: Promise<InvokeFunctionResponse>) {
  try {
    const receipt = await manager.waitForTx(execute);
    expect(receipt.isSuccess()).to.equal(true);
  } catch (e) {
    const errorStr = String(e);
    expect(errorStr).to.contain(shortString.encodeShortString(errorMessage));
    return;
  }
  assert.fail("No error detected");
}
