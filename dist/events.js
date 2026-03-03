import { assert, expect } from "chai";
import { isEqual } from "lodash-es";
import { hash, num } from "starknet";
import { manager } from "./manager.js";
async function expectEventFromReceipt(receipt, event, eventName) {
    receipt = await manager.ensureSuccess(receipt);
    expect(event.keys?.length).to.be.greaterThan(0, "Unsupported: No keys");
    const events = receipt.events ?? [];
    const normalizedEvent = normalizeEvent(event);
    const matches = events.filter((e) => isEqual(normalizeEvent(e), normalizedEvent)).length;
    if (matches == 0) {
        assert.fail(`No matches detected in this transaction: ${eventName}`);
    }
    else if (matches > 1) {
        assert.fail(`Multiple matches detected in this transaction: ${eventName}`);
    }
}
function normalizeEvent(event) {
    return {
        from_address: event.from_address.toLowerCase(),
        keys: event.keys?.map(num.toBigInt).map(String),
        data: event.data?.map(num.toBigInt).map(String),
    };
}
function convertToEvent(eventWithName) {
    const selector = hash.getSelectorFromName(eventWithName.eventName);
    return {
        from_address: eventWithName.from_address,
        keys: [selector].concat(eventWithName.keys ?? []),
        data: eventWithName.data ?? [],
    };
}
export async function expectEvent(param, event) {
    if (typeof param === "function") {
        ({ transaction_hash: param } = await param());
    }
    if (typeof param === "string") {
        param = await manager.waitForTx(param);
    }
    const eventName = event.eventName;
    const convertedEvent = convertToEvent(event);
    await expectEventFromReceipt(param, convertedEvent, eventName);
}
//# sourceMappingURL=events.js.map