import * as utils from "@noble/curves/abstract/utils";
import { p256 as secp256r1 } from "@noble/curves/p256";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Signature as EthersSignature, Wallet } from "ethers";
import { CallData, hash, num, shortString, uint256 } from "starknet";
import { ESTIMATE_PRIVATE_KEY, KeyPair, SignerType, signerTypeToCustomEnum } from "../signers/signers.js";
export function normalizeSecpR1Signature(signature) {
    return normalizeSecpSignature(secp256r1, signature);
}
export function normalizeSecpK1Signature(signature) {
    return normalizeSecpSignature(secp256k1, signature);
}
export function normalizeSecpSignature(curve, signature) {
    let s = signature.s;
    let yParity = signature.recovery !== 0;
    if (s > curve.CURVE.n / 2n) {
        s = curve.CURVE.n - s;
        yParity = !yParity;
    }
    return { r: signature.r, s, yParity };
}
export class EthKeyPair extends KeyPair {
    pk;
    allowLowS;
    constructor(pk, allowLowS) {
        super();
        if (pk == undefined) {
            pk = Wallet.createRandom().privateKey;
        }
        if (typeof pk === "string") {
            pk = BigInt(pk);
        }
        this.pk = pk;
        this.allowLowS = allowLowS;
    }
    get address() {
        return BigInt(new Wallet("0x" + padTo32Bytes(num.toHex(this.pk))).address);
    }
    get guid() {
        return BigInt(hash.computePoseidonHash(shortString.encodeShortString("Secp256k1 Signer"), this.address));
    }
    get storedValue() {
        return this.address;
    }
    get signerType() {
        return SignerType.Secp256k1;
    }
    get signer() {
        return signerTypeToCustomEnum(this.signerType, { signer: this.address });
    }
    get estimateSigner() {
        return new EstimateEthKeyPair(this.address, this.allowLowS);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        const signature = normalizeSecpK1Signature(secp256k1.sign(padTo32Bytes(messageHash), this.pk, { lowS: this.allowLowS }));
        return CallData.compile([
            signerTypeToCustomEnum(this.signerType, {
                pubkeyHash: this.address,
                r: uint256.bnToUint256(signature.r),
                s: uint256.bnToUint256(signature.s),
                y_parity: signature.yParity,
            }),
        ]);
    }
}
export class EstimateEthKeyPair extends EthKeyPair {
    _address;
    constructor(_address, allowLowS) {
        super(ESTIMATE_PRIVATE_KEY, allowLowS);
        this._address = _address;
    }
    get address() {
        return this._address;
    }
}
export class Eip191KeyPair extends KeyPair {
    pk;
    constructor(pk) {
        super();
        this.pk = pk ? "0x" + padTo32Bytes(num.toHex(pk)) : Wallet.createRandom().privateKey;
    }
    get address() {
        return BigInt(new Wallet(this.pk).address);
    }
    get guid() {
        return BigInt(hash.computePoseidonHash(shortString.encodeShortString("Eip191 Signer"), this.address));
    }
    get storedValue() {
        return this.address;
    }
    get signerType() {
        return SignerType.Eip191;
    }
    get signer() {
        return signerTypeToCustomEnum(this.signerType, { signer: this.address });
    }
    get estimateSigner() {
        return new EstimateEip191KeyPair(this.address);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        const ethSigner = new Wallet(this.pk);
        messageHash = "0x" + padTo32Bytes(messageHash);
        const ethersSignature = EthersSignature.from(ethSigner.signMessageSync(num.hexToBytes(messageHash)));
        const signature = normalizeSecpK1Signature({
            r: BigInt(ethersSignature.r),
            s: BigInt(ethersSignature.s),
            recovery: ethersSignature.yParity ? 1 : 0,
        });
        return CallData.compile([
            signerTypeToCustomEnum(this.signerType, {
                ethAddress: this.address,
                r: uint256.bnToUint256(signature.r),
                s: uint256.bnToUint256(signature.s),
                y_parity: signature.yParity,
            }),
        ]);
    }
}
export class EstimateEip191KeyPair extends Eip191KeyPair {
    _address;
    constructor(_address) {
        super(ESTIMATE_PRIVATE_KEY);
        this._address = _address;
    }
    get address() {
        return this._address;
    }
}
export class Secp256r1KeyPair extends KeyPair {
    pk;
    allowLowS;
    constructor(pk, allowLowS) {
        super();
        this.pk = BigInt(pk ? `${pk}` : Wallet.createRandom().privateKey);
        this.allowLowS = allowLowS;
    }
    get publicKey() {
        const publicKey = secp256r1.getPublicKey(this.pk).slice(1);
        return uint256.bnToUint256("0x" + utils.bytesToHex(publicKey));
    }
    get guid() {
        return BigInt(hash.computePoseidonHashOnElements([
            shortString.encodeShortString("Secp256r1 Signer"),
            this.publicKey.low,
            this.publicKey.high,
        ]));
    }
    get storedValue() {
        return this.guid;
    }
    get signerType() {
        return SignerType.Secp256r1;
    }
    get signer() {
        return signerTypeToCustomEnum(this.signerType, { signer: this.publicKey });
    }
    get estimateSigner() {
        return new EstimateSecp256r1KeyPair(this.publicKey, this.allowLowS);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        messageHash = padTo32Bytes(messageHash);
        const signature = normalizeSecpR1Signature(secp256r1.sign(messageHash, this.pk, { lowS: this.allowLowS }));
        return CallData.compile([
            signerTypeToCustomEnum(this.signerType, {
                pubkey: this.publicKey,
                r: uint256.bnToUint256(signature.r),
                s: uint256.bnToUint256(signature.s),
                y_parity: signature.yParity,
            }),
        ]);
    }
}
export class EstimateSecp256r1KeyPair extends Secp256r1KeyPair {
    _publicKey;
    constructor(_publicKey, allowLowS) {
        super(ESTIMATE_PRIVATE_KEY, allowLowS);
        this._publicKey = _publicKey;
    }
    get publicKey() {
        return this._publicKey;
    }
}
export function padTo32Bytes(hexString) {
    if (hexString.startsWith("0x")) {
        hexString = hexString.slice(2);
    }
    if (hexString.length < 64) {
        hexString = "0".repeat(64 - hexString.length) + hexString;
    }
    return hexString;
}
export const randomEthKeyPair = () => new EthKeyPair();
export const randomEip191KeyPair = () => new Eip191KeyPair();
export const randomSecp256r1KeyPair = () => new Secp256r1KeyPair();
//# sourceMappingURL=secp256.js.map