import type { ArraySignatureType, BigNumberish, Uint256 } from "starknet";
import { CairoCustomEnum } from "starknet";
import { KeyPair, SignerType } from "./signers.js";
export declare const normalizeTransactionHash: (transactionHash: string) => string;
export declare const toCharArray: (value: string) => BigNumberish[];
interface WebauthnSignature {
    client_data_json_outro: BigNumberish[];
    flags: number;
    sign_count: number;
    ec_signature: {
        r: Uint256;
        s: Uint256;
        y_parity: boolean;
    };
}
export declare class WebauthnOwner extends KeyPair {
    rpId: string;
    origin: string;
    pk: Uint8Array;
    rpIdHash: Uint256;
    constructor(pk?: string, rpId?: string, origin?: string);
    get publicKey(): Uint8Array;
    get guid(): bigint;
    get storedValue(): bigint;
    get signerType(): SignerType;
    get signer(): CairoCustomEnum;
    get estimateSigner(): KeyPair;
    signRaw(messageHash: string): Promise<ArraySignatureType>;
    signHash(transactionHash: string): WebauthnSignature;
    getClientData(challenge: string): object;
}
export declare class EstimateWebauthnOwner extends WebauthnOwner {
    private _publicKey;
    rpId: string;
    origin: string;
    constructor(_publicKey: Uint8Array, rpId?: string, origin?: string);
    get publicKey(): Uint8Array;
}
type LegacyWebauthnSignature = {
    cross_origin: boolean;
} & WebauthnSignature & {
    sha256_implementation: CairoCustomEnum;
};
export declare class LegacyWebauthnOwner extends WebauthnOwner {
    crossOrigin: boolean;
    getPrivateKey(): string;
    getClientData(challenge: string): object;
    get estimateSigner(): KeyPair;
    signHash(transactionHash: string): LegacyWebauthnSignature;
}
export declare class EstimateLegacyWebauthnOwner extends EstimateWebauthnOwner {
    signRaw(_messageHash: string): Promise<ArraySignatureType>;
}
export declare const randomWebauthnOwner: () => WebauthnOwner;
export declare const randomWebauthnLegacyOwner: () => LegacyWebauthnOwner;
export {};
//# sourceMappingURL=webauthn.d.ts.map