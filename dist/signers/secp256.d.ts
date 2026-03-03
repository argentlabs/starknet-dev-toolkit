import { p256 as secp256r1 } from "@noble/curves/p256";
import { secp256k1 } from "@noble/curves/secp256k1";
import type { CairoCustomEnum, Uint256 } from "starknet";
import { KeyPair, SignerType } from "../signers/signers.js";
export type NormalizedSecpSignature = {
    r: bigint;
    s: bigint;
    yParity: boolean;
};
export declare function normalizeSecpR1Signature(signature: {
    r: bigint;
    s: bigint;
    recovery: number;
}): NormalizedSecpSignature;
export declare function normalizeSecpK1Signature(signature: {
    r: bigint;
    s: bigint;
    recovery: number;
}): NormalizedSecpSignature;
export declare function normalizeSecpSignature(curve: typeof secp256r1 | typeof secp256k1, signature: {
    r: bigint;
    s: bigint;
    recovery: number;
}): NormalizedSecpSignature;
export declare class EthKeyPair extends KeyPair {
    pk: bigint;
    allowLowS?: boolean;
    constructor(pk?: string | bigint, allowLowS?: boolean);
    get address(): bigint;
    get guid(): bigint;
    get storedValue(): bigint;
    get signerType(): SignerType;
    get signer(): CairoCustomEnum;
    get estimateSigner(): KeyPair;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class EstimateEthKeyPair extends EthKeyPair {
    private _address;
    constructor(_address: bigint, allowLowS?: boolean);
    get address(): bigint;
}
export declare class Eip191KeyPair extends KeyPair {
    pk: string;
    constructor(pk?: string | bigint);
    get address(): bigint;
    get guid(): bigint;
    get storedValue(): bigint;
    get signerType(): SignerType;
    get signer(): CairoCustomEnum;
    get estimateSigner(): KeyPair;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class EstimateEip191KeyPair extends Eip191KeyPair {
    private _address;
    constructor(_address: bigint);
    get address(): bigint;
}
export declare class Secp256r1KeyPair extends KeyPair {
    pk: bigint;
    private allowLowS?;
    constructor(pk?: string | bigint, allowLowS?: boolean);
    get publicKey(): Uint256;
    get guid(): bigint;
    get storedValue(): bigint;
    get signerType(): SignerType;
    get signer(): CairoCustomEnum;
    get estimateSigner(): KeyPair;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class EstimateSecp256r1KeyPair extends Secp256r1KeyPair {
    private _publicKey;
    constructor(_publicKey: Uint256, allowLowS?: boolean);
    get publicKey(): Uint256;
}
export declare function padTo32Bytes(hexString: string): string;
export declare const randomEthKeyPair: () => EthKeyPair;
export declare const randomEip191KeyPair: () => Eip191KeyPair;
export declare const randomSecp256r1KeyPair: () => Secp256r1KeyPair;
//# sourceMappingURL=secp256.d.ts.map