import { concatBytes } from "@noble/curves/abstract/utils";
import { p256 as secp256r1 } from "@noble/curves/p256";
import { createHash } from "crypto";
import { CairoCustomEnum, CallData, hash, shortString, uint256 } from "starknet";
import { normalizeSecpR1Signature } from "./secp256.js";
import { ESTIMATE_PRIVATE_KEY, KeyPair, SignerType, signerTypeToCustomEnum } from "./signers.js";
const buf2hex = (buffer, prefix = true) => `${prefix ? "0x" : ""}${[...buffer].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
export const normalizeTransactionHash = (transactionHash) => transactionHash.replace(/^0x/, "").padStart(64, "0");
const buf2base64url = (buffer) => buf2base64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
const buf2base64 = (buffer) => btoa(String.fromCharCode(...buffer));
const hex2buf = (hex) => Uint8Array.from(hex
    .replace(/^0x/, "")
    .match(/.{1,2}/g)
    .map((byte) => parseInt(byte, 16)));
function numberToBytes(input) {
    const bytes = new Array(4).fill(0);
    if (input < 0 || input > 0xffffffff) {
        throw new Error("Input number must be between 0 and 2^32 - 1.");
    }
    for (let i = 3; i >= 0; i--) {
        bytes[i] = input & 0xff; // Extract the least significant byte
        input = input >> 8; // Shift right to process the next byte
    }
    return bytes;
}
export const toCharArray = (value) => CallData.compile(value.split("").map(shortString.encodeShortString));
export class WebauthnOwner extends KeyPair {
    rpId;
    origin;
    pk;
    rpIdHash;
    constructor(pk, rpId = "localhost", origin = "http://localhost:5173") {
        super();
        this.rpId = rpId;
        this.origin = origin;
        this.pk = pk ? hex2buf(normalizeTransactionHash(pk)) : secp256r1.utils.randomPrivateKey();
        this.rpIdHash = uint256.bnToUint256(buf2hex(sha256(rpId)));
    }
    get publicKey() {
        return secp256r1.getPublicKey(this.pk).slice(1);
    }
    get guid() {
        const rpIdHashAsU256 = this.rpIdHash;
        const publicKeyAsU256 = uint256.bnToUint256(buf2hex(this.publicKey));
        const originBytes = toCharArray(this.origin);
        const elements = [
            shortString.encodeShortString("Webauthn Signer"),
            originBytes.length,
            ...originBytes,
            rpIdHashAsU256.low,
            rpIdHashAsU256.high,
            publicKeyAsU256.low,
            publicKeyAsU256.high,
        ];
        return BigInt(hash.computePoseidonHashOnElements(elements));
    }
    get storedValue() {
        return this.guid;
    }
    get signerType() {
        return SignerType.Webauthn;
    }
    get signer() {
        const signer = {
            origin: toCharArray(this.origin),
            rp_id_hash: this.rpIdHash,
            pubkey: uint256.bnToUint256(buf2hex(this.publicKey)),
        };
        return signerTypeToCustomEnum(this.signerType, signer);
    }
    get estimateSigner() {
        return new EstimateWebauthnOwner(this.publicKey, this.rpId, this.origin);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        return CallData.compile([
            signerTypeToCustomEnum(this.signerType, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                webauthnSigner: this.signer.variant.Webauthn,
                webauthnSignature: this.signHash(messageHash),
            }),
        ]);
    }
    signHash(transactionHash) {
        const flags = Number("0b00000101"); // present and verified
        const signCount = 1;
        const authenticatorData = concatBytes(sha256(this.rpId), new Uint8Array([flags, ...numberToBytes(signCount)]));
        const challenge = buf2base64url(hex2buf(normalizeTransactionHash(transactionHash)));
        const clientData = JSON.stringify(this.getClientData(challenge));
        // const extraJson = "";
        const extraJson = `,"crossOrigin":false}`;
        // const extraJson = `,"crossOrigin":false,"extraField":"random data"}`;
        const clientDataJson = extraJson ? clientData.replace(/}$/, extraJson) : clientData;
        const clientDataHash = sha256(new TextEncoder().encode(clientDataJson));
        const signedHash = sha256(concatBytes(authenticatorData, clientDataHash));
        const signature = normalizeSecpR1Signature(secp256r1.sign(signedHash, this.pk));
        // console.log(`
        // let transaction_hash = ${transactionHash};
        // let pubkey = ${buf2hex(this.publicKey)};
        // let challenge = ${challenge};
        // let signer = new_webauthn_signer(:origin, :rp_id_hash, :pubkey);
        // let signature = WebauthnSignature {
        //     client_data_json_outro: ${extraJson ? `${JSON.stringify(extraJson)}.into_bytes()` : "array![]"}.span(),
        //     flags: ${flags},
        //     sign_count: ${signCount},
        //     ec_signature: Signature {
        //         r: 0x${signature.r.toString(16)},
        //         s: 0x${signature.s.toString(16)},
        //         y_parity: ${signature.yParity},
        //     },
        // };`);
        const signatureObj = {
            client_data_json_outro: CallData.compile(toCharArray(extraJson)),
            flags,
            sign_count: signCount,
            ec_signature: {
                r: uint256.bnToUint256(signature.r),
                s: uint256.bnToUint256(signature.s),
                y_parity: signature.yParity,
            },
        };
        return signatureObj;
    }
    getClientData(challenge) {
        return { type: "webauthn.get", challenge, origin: this.origin };
    }
}
export class EstimateWebauthnOwner extends WebauthnOwner {
    _publicKey;
    rpId;
    origin;
    constructor(_publicKey, rpId = "localhost", origin = "http://localhost:5173") {
        super(ESTIMATE_PRIVATE_KEY, rpId, origin);
        this._publicKey = _publicKey;
        this.rpId = rpId;
        this.origin = origin;
    }
    get publicKey() {
        return this._publicKey;
    }
}
export class LegacyWebauthnOwner extends WebauthnOwner {
    crossOrigin = false;
    getPrivateKey() {
        return buf2hex(this.pk);
    }
    getClientData(challenge) {
        return { ...super.getClientData(challenge), crossOrigin: this.crossOrigin };
    }
    get estimateSigner() {
        return new EstimateLegacyWebauthnOwner(this.publicKey, this.rpId, this.origin);
    }
    signHash(transactionHash) {
        const webauthnSignature = super.signHash(`${normalizeTransactionHash(transactionHash)}01`);
        return {
            cross_origin: this.crossOrigin,
            ...webauthnSignature,
            sha256_implementation: new CairoCustomEnum({
                Cairo0: undefined,
                Cairo1: {},
            }),
        };
    }
}
export class EstimateLegacyWebauthnOwner extends EstimateWebauthnOwner {
    // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
    async signRaw(_messageHash) {
        const webauthnSignature = {
            cross_origin: false,
            client_data_outro: CallData.compile(Array.from(new TextEncoder().encode(',"crossOrigin":false}'))),
            flags: 0b00011101,
            sign_count: 0,
            ec_signature: {
                r: uint256.bnToUint256("0xc303f24e2f6970f0cd1521c1ff6c661337e4a397a9d4b1bed732f14ddcb828cb"),
                s: uint256.bnToUint256("0x61d2ef1fa3c30486656361c783ae91316e9e78301fbf4f173057ea868487d387"),
                y_parity: false,
            },
            sha256_implementation: new CairoCustomEnum({
                Cairo0: undefined,
                Cairo1: {},
            }),
        };
        return CallData.compile([
            signerTypeToCustomEnum(SignerType.Webauthn, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                webauthnSigner: this.signer.variant.Webauthn,
                webauthnSignature,
            }),
        ]);
    }
}
function sha256(message) {
    return createHash("sha256").update(message).digest();
}
export const randomWebauthnOwner = () => new WebauthnOwner(undefined, undefined, undefined);
export const randomWebauthnLegacyOwner = () => new LegacyWebauthnOwner(undefined, undefined, undefined);
//# sourceMappingURL=webauthn.js.map