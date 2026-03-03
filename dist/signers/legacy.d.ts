import type { ArraySignatureType } from "starknet";
import { RawSigner } from "./signers.js";
export declare class LegacyArgentSigner extends RawSigner {
    owner: LegacyStarknetKeyPair;
    guardian?: LegacyStarknetKeyPair | undefined;
    constructor(owner?: LegacyStarknetKeyPair, guardian?: LegacyStarknetKeyPair | undefined);
    signRaw(messageHash: string): Promise<ArraySignatureType>;
}
export declare class LegacyMultisigSigner extends RawSigner {
    keys: RawSigner[];
    constructor(keys: RawSigner[]);
    signRaw(messageHash: string): Promise<string[]>;
}
export declare abstract class LegacyKeyPair extends RawSigner {
    abstract get privateKey(): string;
    abstract get publicKey(): bigint;
}
export declare class LegacyStarknetKeyPair extends LegacyKeyPair {
    pk: string;
    constructor(pk?: string | bigint);
    get privateKey(): string;
    get publicKey(): bigint;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class LegacyMultisigKeyPair extends LegacyKeyPair {
    pk: string;
    constructor(pk?: string | bigint);
    get publicKey(): bigint;
    get guid(): bigint;
    get privateKey(): string;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare const randomLegacyMultisigKeyPairs: (length: number) => LegacyMultisigKeyPair[];
//# sourceMappingURL=legacy.d.ts.map