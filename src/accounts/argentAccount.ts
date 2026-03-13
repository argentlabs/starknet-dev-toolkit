import type { AccountOptions, EstimateFeeBulk, Invocations, Provider, UniversalDetails } from "starknet";
import { Account } from "starknet";
import { ArgentSigner } from "../signers/signers.js";

export const ARGENT_ACCOUNT_CLASS_HASH_0_5_0 = "0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2";

export class ArgentAccount extends Account {
  constructor(options: AccountOptions) {
    super(options);
  }

  override async estimateFeeBulk(invocations: Invocations, details?: UniversalDetails): Promise<EstimateFeeBulk> {
    details = details ?? {};
    details.skipValidate = details.skipValidate ?? false;

    if (this.signer instanceof ArgentSigner) {
      const { owner, guardian } = this.signer;
      const estimateSigner = new ArgentSigner(owner.estimateSigner, guardian?.estimateSigner);
      const estimateAccount = new Account({
        provider: this as Provider,
        address: this.address,
        signer: estimateSigner,
        cairoVersion: this.cairoVersion,
        transactionVersion: this.transactionVersion,
      });
      return await estimateAccount.estimateFeeBulk(invocations, details);
    } else {
      return await super.estimateFeeBulk(invocations, details);
    }
  }
}
