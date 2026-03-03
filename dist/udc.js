import { defaultDeployer } from "starknet";
import { deployer } from "./accounts.js";
export async function deployContractUDC(classHash, salt, constructorCalldata) {
    const udcPayload = {
        classHash,
        salt,
        unique: false,
        constructorCalldata,
    };
    // deployContract uses the UDC
    const { addresses, calls } = defaultDeployer.buildDeployerCall(udcPayload, deployer.address);
    const { transaction_hash } = await deployer.execute(calls);
    await deployer.waitForTransaction(transaction_hash);
    return { contractAddress: addresses[0], transactionHash: transaction_hash };
}
//# sourceMappingURL=udc.js.map