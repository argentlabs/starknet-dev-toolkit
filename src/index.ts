import { should, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { config } from "starknet";

use(chaiAsPromised);
should();
// We are spammed with
// [2025-09-24T11:52:53.679Z] ERROR: Insufficient transaction data: found 3 V3 transactions with tips in 3 blocks (block range: 555-557). Required: 10 transactions. Consider reducing minTxsNecessary or increasing maxBlocks.
// config.update({ logLevel: "ERROR" });
config.update({ logLevel: "FATAL" });

export * from "./accounts.js";
export * from "./contracts.js";
export * from "./contractTypes.js";
export * from "./devnet.js";
export * from "./events.js";
export * from "./expectations.js";
export * from "./files.js";
export * from "./gas.js";
export * from "./manager.js";
export * from "./multisig.js";
export * from "./openZeppelinAccount.js";
export * from "./outsideExecution.js";
export * from "./random.js";
export * from "./receipts.js";
export * from "./recovery.js";
export * from "./session/argentServices.js";
export * from "./session/session.js";
export * from "./session/sessionServices.js";
export * from "./signers/legacy.js";
export * from "./signers/secp256.js";
export * from "./signers/signers.js";
export * from "./signers/webauthn.js";
export * from "./tokens.js";
export * from "./transactions.js";
export * from "./types.js";
export * from "./udc.js";
export * from "./upgrade.js";
