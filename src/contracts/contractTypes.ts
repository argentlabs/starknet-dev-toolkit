import type {
  BigNumberish,
  CairoCustomEnum,
  CairoOption,
  Call,
  Calldata,
  Contract,
  EstimateFeeResponseOverhead,
  InvokeFunctionResponse,
  RawCalldata,
  Uint256,
} from "starknet";

type EmptyCairoStruct = Record<string, never>;

/**
 * Transforms contract methods into populateTransaction helpers that return Call objects.
 *
 * - Filters to only include function properties (excludes non-function fields)
 * - Preserves the original parameter types of each method
 * - Changes the return type from the original (e.g. Promise<...>) to Call
 *
 * Example: { transfer: (to: string, amount: bigint) => Promise<Response> }
 *       -> { transfer: (to: string, amount: bigint) => Call }
 */
type PopulateTransactionFor<Methods> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [MethodName in keyof Methods as Methods[MethodName] extends (...args: any[]) => unknown
    ? MethodName
    : never]: Methods[MethodName] extends (...args: infer Args) => unknown ? (...args: Args) => Call : never;
};
type EstimateFeeFor<Methods> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [MethodName in keyof Methods as Methods[MethodName] extends (...args: any[]) => unknown
    ? MethodName
    : never]: Methods[MethodName] extends (...args: infer Args) => unknown
    ? (...args: Args) => Promise<EstimateFeeResponseOverhead>
    : never;
};

interface TypedContractBase<Methods> extends Contract {
  populateTransaction: PopulateTransactionFor<Methods>;
  estimateFee: EstimateFeeFor<Methods>;
}
export type ContractWithPopulate<Methods> = TypedContractBase<Methods> & Methods;

export type MockDappContract = ContractWithPopulate<{
  get_number: (accountAddress: string) => Promise<bigint>;
  set_number: (value: BigNumberish) => Promise<InvokeFunctionResponse>;
  increase_number: (value: BigNumberish) => Promise<InvokeFunctionResponse>;
  double_number: () => Promise<InvokeFunctionResponse>;
}>;

export type Erc20Contract = ContractWithPopulate<{
  balance_of: (accountAddress: string) => Promise<bigint>;
  approve: (spender: string, amount: BigNumberish | Uint256) => Promise<InvokeFunctionResponse>;
  transfer: (recipient: string, amount: BigNumberish | Uint256) => Promise<InvokeFunctionResponse>;
}>;

export type ProxyWithImplementationContract = ContractWithPopulate<{
  implementation: () => Promise<{ address: string }>;
}>;

export type UpgradeableStorageContract = ContractWithPopulate<{
  storage_write: (key: BigNumberish, value: BigNumberish) => Promise<InvokeFunctionResponse>;
  upgrade: (classHash: BigNumberish) => Promise<InvokeFunctionResponse>;
}>;

export type AccountEscapeState = {
  ready_at: bigint;
  escape_type: bigint;
  new_signer: CairoOption<{ stored_value: bigint }>;
};

type ArgentBaseAccountMethods = {
  __validate__: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
  get_outside_execution_message_hash_rev_0: (outsideExecution: unknown) => Promise<BigNumberish>;
  is_valid_outside_execution_nonce: (nonce: BigNumberish) => Promise<boolean>;
  is_valid_signature: (hash: BigNumberish, signature: BigNumberish[]) => Promise<bigint>;
  get_name: () => Promise<bigint>;
  get_version: () => Promise<{ major: bigint; minor: bigint; patch: bigint }>;
};

export type ArgentAccountContract = ContractWithPopulate<
  ArgentBaseAccountMethods & {
    change_owners: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    change_guardians: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    change_owner: (payload: RawCalldata | CairoOption<bigint> | BigNumberish) => Promise<InvokeFunctionResponse>;
    revoke_session: (sessionHash: string) => Promise<InvokeFunctionResponse>;
    is_session_revoked: (sessionHash: string) => Promise<boolean>;
    is_session_authorization_cached: {
      (sessionHash: string): Promise<boolean>;
      (sessionHash: string, ownerGuid: bigint, guardianGuid: bigint): Promise<boolean>;
    };
    get_escape: () => Promise<AccountEscapeState>;
    get_escape_and_status: () => Promise<[AccountEscapeState, CairoCustomEnum]>;
    trigger_escape_owner: (
      payload: BigNumberish | RawCalldata | CairoOption<bigint>,
    ) => Promise<InvokeFunctionResponse>;
    trigger_escape_guardian: (
      payload: BigNumberish | RawCalldata | CairoOption<bigint>,
    ) => Promise<InvokeFunctionResponse>;
    escape_owner: () => Promise<InvokeFunctionResponse>;
    escape_guardian: () => Promise<InvokeFunctionResponse>;
    cancel_escape: () => Promise<InvokeFunctionResponse>;
    set_escape_security_period: (seconds: number | bigint) => Promise<InvokeFunctionResponse>;
    get_last_guardian_trigger_escape_attempt: () => Promise<bigint>;
    get_last_owner_trigger_escape_attempt: () => Promise<bigint>;
    get_last_guardian_escape_attempt: () => Promise<bigint>;
    get_last_owner_escape_attempt: () => Promise<bigint>;
    get_guardian: () => Promise<bigint>;
    get_guardian_guid: () => Promise<CairoOption<bigint>>;
    get_owner: () => Promise<bigint>;
    get_owners_guids: () => Promise<bigint[]>;
    get_guardians_guids: () => Promise<bigint[]>;
    is_owner_guid: (guid: bigint) => Promise<boolean>;
  }
>;

export type MultisigEscapeStatus = CairoCustomEnum & {
  variant: {
    None?: EmptyCairoStruct; // no escape triggered or it was canceled
    NotReady?: EmptyCairoStruct;
    Ready?: EmptyCairoStruct;
    Expired?: EmptyCairoStruct;
  };
};

export type MultisigEscapeState = {
  ready_at: bigint;
  call_hash: bigint;
};

export type MultisigEscapeResponse = {
  "0": MultisigEscapeState;
  "1": MultisigEscapeStatus;
};

export type ArgentMultisigContract = ContractWithPopulate<
  ArgentBaseAccountMethods & {
    get_threshold: () => Promise<bigint>;
    is_signer_guid: (guid: bigint) => Promise<boolean>;
    get_signer_guids: () => Promise<bigint[]>;
    is_signer: (signer: BigNumberish | Calldata) => Promise<boolean>;
    add_signers: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    replace_signer: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    remove_signers: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    toggle_escape: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    trigger_escape: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    execute_escape: (calldata: RawCalldata) => Promise<InvokeFunctionResponse>;
    change_threshold: (newThreshold: bigint) => Promise<InvokeFunctionResponse>;
    get_escape: () => Promise<MultisigEscapeResponse>;
  }
>;
