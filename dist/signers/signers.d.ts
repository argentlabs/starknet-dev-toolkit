import type { Call, Calldata, DeclareSignerDetails, DeployAccountSignerDetails, InvocationsSignerDetails, Signature, SignerInterface, TypedData } from "starknet";
import { CairoCustomEnum, CairoOption } from "starknet";
export declare const ESTIMATE_PRIVATE_KEY = "0x123456";
/**
 * This class allows to easily implement custom signers by overriding the `signRaw` method.
 * This is based on Starknet.js implementation of Signer, but it delegates the actual signing to an abstract function
 */
export declare abstract class RawSigner implements SignerInterface {
    abstract signRaw(messageHash: string): Promise<string[]>;
    getPubKey(): Promise<string>;
    signMessage(typedDataArgument: TypedData, accountAddress: string): Promise<Signature>;
    signTransaction(transactions: Call[], details: InvocationsSignerDetails): Promise<Signature>;
    signDeployAccountTransaction(details: DeployAccountSignerDetails): Promise<Signature>;
    signDeclareTransaction(details: DeclareSignerDetails): Promise<Signature>;
}
export declare class MultisigSigner extends RawSigner {
    keys: KeyPair[];
    constructor(keys: KeyPair[]);
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class ArgentSigner extends MultisigSigner {
    owner: KeyPair;
    guardian?: KeyPair | undefined;
    constructor(owner?: KeyPair, guardian?: KeyPair | undefined);
}
export declare abstract class KeyPair extends RawSigner {
    abstract get signer(): CairoCustomEnum;
    abstract get guid(): bigint;
    abstract get storedValue(): bigint;
    abstract get estimateSigner(): KeyPair;
    abstract get signerType(): SignerType;
    get compiledSigner(): Calldata;
    get signerAsOption(): CairoOption<{
        signer: CairoCustomEnum;
    }>;
    get compiledSignerAsOption(): Calldata;
}
export declare class StarknetKeyPair extends KeyPair {
    pk: string;
    constructor(pk?: string | bigint);
    get privateKey(): string;
    get publicKey(): bigint;
    get guid(): bigint;
    get storedValue(): bigint;
    get signerType(): SignerType;
    get signer(): CairoCustomEnum;
    get estimateSigner(): KeyPair;
    signRaw(messageHash: string): Promise<string[]>;
}
export declare class EstimateStarknetKeyPair extends StarknetKeyPair {
    readonly pubKey: bigint;
    constructor(pubKey: bigint);
    get publicKey(): bigint;
}
export declare function starknetSignatureType(signer: bigint | number | string, r: bigint | number | string, s: bigint | number | string): Calldata;
export declare function zeroStarknetSignatureType(): CairoCustomEnum;
export declare enum SignerType {
    Starknet = 0,
    Secp256k1 = 1,
    Secp256r1 = 2,
    Eip191 = 3,
    Webauthn = 4
}
/** Type for the Starknet signature variant inside a CairoCustomEnum */
export interface StarknetSignatureVariant {
    pubkey: bigint;
    r: bigint;
    s: bigint;
}
export declare function signerTypeToCustomEnum<T extends object>(signerType: SignerType, value: T): CairoCustomEnum;
export declare function sortByGuid(keys: KeyPair[]): KeyPair[];
export declare const randomStarknetKeyPair: () => StarknetKeyPair;
export declare const randomStarknetKeyPairs: (length: number) => StarknetKeyPair[];
//# sourceMappingURL=signers.d.ts.map