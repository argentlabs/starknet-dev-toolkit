import { use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { config } from "starknet";

use(chaiAsPromised);

// We are spammed with
// [2025-09-24T11:52:53.679Z] ERROR: Insufficient transaction data: found 3 V3 transactions with tips in 3 blocks (block range: 555-557). Required: 10 transactions. Consider reducing minTxsNecessary or increasing maxBlocks.
// config.update({ logLevel: "ERROR" });
config.update({ logLevel: "FATAL" });

export * from "./accounts/accounts.js";
export * from "./accounts/argentAccount.js";
export * from "./accounts/multisig.js";
export * from "./accounts/openZeppelinAccount.js";
export * from "./accounts/outsideExecution.js";
export * from "./accounts/recovery.js";
export * from "./accounts/upgrade.js";
export * from "./contracts/contractsDeclare.js";
export * from "./contracts/contractTypes.js";
export * from "./contracts/loadContract.js";
export * from "./contracts/udc.js";
export * from "./devnet/devnet.js";
export * from "./env.js";
export * from "./manager.js";
export * from "./provider/gas.js";
export * from "./provider/receipts.js";
export * from "./provider/tokens.js";
export * from "./provider/transactions.js";
export * from "./session/argentServices.js";
export * from "./session/session.js";
export * from "./session/sessionServices.js";
export * from "./signers/legacy.js";
export * from "./signers/secp256.js";
export * from "./signers/signers.js";
export * from "./signers/webauthn.js";
export * from "./testing/events.js";
export * from "./testing/expectations.js";
export * from "./types.js";
export * from "./utils/files.js";
export * from "./utils/random.js";
