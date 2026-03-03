import { CairoCustomEnum, CairoOption, CairoOptionVariant, CallData, ETransactionVersion, ec, encode, hash, num, shortString, stark, transaction, typedData, } from "starknet";
// this is a value that is used to mock signers for estimation
export const ESTIMATE_PRIVATE_KEY = "0x123456";
/**
 * This class allows to easily implement custom signers by overriding the `signRaw` method.
 * This is based on Starknet.js implementation of Signer, but it delegates the actual signing to an abstract function
 */
export class RawSigner {
    // eslint-disable-next-line @typescript-eslint/require-await
    async getPubKey() {
        throw new Error("This signer allows multiple public keys");
    }
    async signMessage(typedDataArgument, accountAddress) {
        const messageHash = typedData.getMessageHash(typedDataArgument, accountAddress);
        return this.signRaw(messageHash);
    }
    async signTransaction(transactions, details) {
        if (details.version !== ETransactionVersion.V3 && details.version !== ETransactionVersion.F3) {
            throw new Error("unsupported signTransaction version");
        }
        const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
        const msgHash = hash.calculateInvokeTransactionHash({
            ...details,
            senderAddress: details.walletAddress,
            compiledCalldata,
            nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
            feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
        });
        return await this.signRaw(msgHash);
    }
    async signDeployAccountTransaction(details) {
        if (details.version !== ETransactionVersion.V3 && details.version !== ETransactionVersion.F3) {
            throw new Error("unsupported signDeployAccountTransaction version");
        }
        const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
        const msgHash = hash.calculateDeployAccountTransactionHash({
            ...details,
            salt: details.addressSalt,
            compiledConstructorCalldata,
            nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
            feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
        });
        return await this.signRaw(msgHash);
    }
    async signDeclareTransaction(
    // contractClass: ContractClass,  // Should be used once class hash is present in ContractClass
    details) {
        if (details.version !== ETransactionVersion.V3 && details.version !== ETransactionVersion.F3) {
            throw new Error("unsupported signDeclareTransaction version");
        }
        const msgHash = hash.calculateDeclareTransactionHash({
            ...details,
            nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
            feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
        });
        return await this.signRaw(msgHash);
    }
}
export class MultisigSigner extends RawSigner {
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
        return [keys.length.toString(), keys.flat()].flat();
    }
}
export class ArgentSigner extends MultisigSigner {
    owner;
    guardian;
    constructor(owner = randomStarknetKeyPair(), guardian) {
        const signers = [owner];
        if (guardian) {
            signers.push(guardian);
        }
        super(signers);
        this.owner = owner;
        this.guardian = guardian;
    }
}
export class KeyPair extends RawSigner {
    get compiledSigner() {
        return CallData.compile([this.signer]);
    }
    get signerAsOption() {
        return new CairoOption(CairoOptionVariant.Some, {
            signer: this.signer,
        });
    }
    get compiledSignerAsOption() {
        return CallData.compile([this.signerAsOption]);
    }
}
export class StarknetKeyPair extends KeyPair {
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
    get guid() {
        return BigInt(hash.computePoseidonHash(shortString.encodeShortString("Starknet Signer"), this.publicKey));
    }
    get storedValue() {
        return this.publicKey;
    }
    get signerType() {
        return SignerType.Starknet;
    }
    get signer() {
        return signerTypeToCustomEnum(this.signerType, { signer: this.publicKey });
    }
    get estimateSigner() {
        return new EstimateStarknetKeyPair(this.publicKey);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async signRaw(messageHash) {
        const { r, s } = ec.starkCurve.sign(messageHash, this.pk);
        return starknetSignatureType(this.publicKey, r, s);
    }
}
export class EstimateStarknetKeyPair extends StarknetKeyPair {
    pubKey;
    constructor(pubKey) {
        super(ESTIMATE_PRIVATE_KEY);
        this.pubKey = pubKey;
    }
    get publicKey() {
        return this.pubKey;
    }
}
export function starknetSignatureType(signer, r, s) {
    return CallData.compile([signerTypeToCustomEnum(SignerType.Starknet, { signer, r, s })]);
}
export function zeroStarknetSignatureType() {
    return signerTypeToCustomEnum(SignerType.Starknet, { signer: 0 });
}
// reflects the signer type in signer_signature.cairo
// needs to be updated for the signer types
// used to convert signertype to guid
export var SignerType;
(function (SignerType) {
    SignerType[SignerType["Starknet"] = 0] = "Starknet";
    SignerType[SignerType["Secp256k1"] = 1] = "Secp256k1";
    SignerType[SignerType["Secp256r1"] = 2] = "Secp256r1";
    SignerType[SignerType["Eip191"] = 3] = "Eip191";
    SignerType[SignerType["Webauthn"] = 4] = "Webauthn";
})(SignerType || (SignerType = {}));
export function signerTypeToCustomEnum(signerType, value) {
    const signerTypeName = SignerType[signerType];
    const contents = {
        Starknet: undefined,
        Secp256k1: undefined,
        Secp256r1: undefined,
        Eip191: undefined,
        Webauthn: undefined,
    };
    contents[signerTypeName] = value;
    return new CairoCustomEnum(contents);
}
export function sortByGuid(keys) {
    return keys.sort((n1, n2) => (n1.guid < n2.guid ? -1 : 1));
}
export const randomStarknetKeyPair = () => new StarknetKeyPair();
export const randomStarknetKeyPairs = (length) => Array.from({ length }, randomStarknetKeyPair);
//# sourceMappingURL=signers.js.map