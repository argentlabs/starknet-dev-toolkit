import { ec, encode, num } from "starknet";
import { RawSigner } from "./signers.js";
export class LegacyArgentSigner extends RawSigner {
    owner;
    guardian;
    constructor(owner = new LegacyStarknetKeyPair(), guardian) {
        super();
        this.owner = owner;
        this.guardian = guardian;
    }
    async signRaw(messageHash) {
        const signature = await this.owner.signRaw(messageHash);
        if (this.guardian) {
            const [guardianR, guardianS] = await this.guardian.signRaw(messageHash);
            signature[2] = guardianR;
            signature[3] = guardianS;
        }
        return signature;
    }
}
export class LegacyMultisigSigner extends RawSigner {
    keys;
    constructor(keys) {
        super();
        this.keys = keys;
    }
    async signRaw(messageHash) {
        const keys = [];
        for (const key of this.keys) {
            keys.push(await key.signRaw(messageHash));
        }
        return keys.flat();
    }
}
export class LegacyKeyPair extends RawSigner {
}
export class LegacyStarknetKeyPair extends LegacyKeyPair {
    pk;
    constructor(pk) {
        super();
        this.pk = pk ? num.toHex(pk) : `0x${encode.buf2hex(ec.starkCurve.utils.randomPrivateKey())}`;
    }
    get privateKey() {
        return this.pk;
    }
    get publicKey() {
        return BigInt(ec.starkCurve.getStarkKey(this.pk));
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        const { r, s } = ec.starkCurve.sign(messageHash, this.pk);
        return [r.toString(), s.toString()];
    }
}
export class LegacyMultisigKeyPair extends LegacyKeyPair {
    pk;
    constructor(pk) {
        super();
        this.pk = pk ? `${pk}` : `0x${encode.buf2hex(ec.starkCurve.utils.randomPrivateKey())}`;
    }
    get publicKey() {
        return BigInt(ec.starkCurve.getStarkKey(this.pk));
    }
    get guid() {
        return this.publicKey;
    }
    get privateKey() {
        return this.pk;
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        const { r, s } = ec.starkCurve.sign(messageHash, this.pk);
        return [this.publicKey.toString(), r.toString(), s.toString()];
    }
}
export const randomLegacyMultisigKeyPairs = (length) => Array.from({ length }, () => new LegacyMultisigKeyPair()).sort((n1, n2) => (n1.publicKey < n2.publicKey ? -1 : 1));
//# sourceMappingURL=legacy.js.map