import { CairoCustomEnum, CallData, shortString, typedData, TypedDataRevision } from "starknet";
export const ESCAPE_SECURITY_PERIOD = 7n * 24n * 60n * 60n; // 7 days
export const ESCAPE_EXPIRY_PERIOD = 2n * 7n * 24n * 60n * 60n; // 14 days
export const MAX_U64 = 2n ** 64n - 1n;
export var EscapeStatus;
(function (EscapeStatus) {
    EscapeStatus[EscapeStatus["None"] = 0] = "None";
    EscapeStatus[EscapeStatus["NotReady"] = 1] = "NotReady";
    EscapeStatus[EscapeStatus["Ready"] = 2] = "Ready";
    EscapeStatus[EscapeStatus["Expired"] = 3] = "Expired";
})(EscapeStatus || (EscapeStatus = {}));
export const ESCAPE_TYPE_NONE = new CairoCustomEnum({
    None: {},
    Guardian: undefined,
    Owner: undefined,
});
export const ESCAPE_TYPE_GUARDIAN = new CairoCustomEnum({
    None: undefined,
    Guardian: {},
    Owner: undefined,
});
export const ESCAPE_TYPE_OWNER = new CairoCustomEnum({
    None: undefined,
    Guardian: undefined,
    Owner: {},
});
export const signOwnerAliveMessage = async (accountAddress, newOwner, chainId, maxTimestamp) => {
    const messageHash = getOwnerAliveMessageHash(accountAddress, chainId, newOwner.guid, maxTimestamp);
    const signature = await newOwner.signRaw(messageHash);
    return CallData.compile([...signature, maxTimestamp]);
};
const types = {
    StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
    ],
    "Owner Alive": [
        { name: "Owner GUID", type: "felt" },
        { name: "Signature expiration", type: "timestamp" },
    ],
};
function getDomain(chainId) {
    return {
        name: "Owner Alive",
        version: shortString.encodeShortString("1"),
        chainId,
        revision: TypedDataRevision.ACTIVE,
    };
}
function getTypedData(myStruct, chainId) {
    return {
        types,
        primaryType: "Owner Alive",
        domain: getDomain(chainId),
        message: {
            "Owner GUID": myStruct.ownerGuid,
            "Signature expiration": myStruct.signatureExpiration,
        },
    };
}
export function getOwnerAliveMessageHash(accountAddress, chainId, ownerGuid, signatureExpiration) {
    return typedData.getMessageHash(getTypedData({ ownerGuid, signatureExpiration }, chainId), accountAddress);
}
export async function hasOngoingEscape(accountContract) {
    const escape = await accountContract.get_escape();
    return escape.escape_type != 0n && escape.ready_at != 0n && escape.new_signer.isSome();
}
export async function getEscapeStatus(accountContract) {
    const result = await accountContract.get_escape_and_status();
    return EscapeStatus[result[1].activeVariant()];
}
//# sourceMappingURL=recovery.js.map