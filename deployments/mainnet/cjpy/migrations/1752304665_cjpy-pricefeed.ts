import { VerifyArgs } from "../../../../plugins/deployment_manager";
import { DeploymentManager } from "../../../../plugins/deployment_manager/DeploymentManager";
import { migration } from "../../../../plugins/deployment_manager/Migration";

interface Vars {}

export default migration("1752304665_cjpy-pricefeed", {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (
    deploymentManager: DeploymentManager,
    govDeploymentManager: DeploymentManager,
    vars: Vars
  ) => {
    const configuration = [
      "0xca546aE6c3B2BB9Fba2b6e5EeB0881097CecE5B0", // crvUSD/CJPY pool
      "0x1cfa5641c01406aB8AC350dEd7d735ec41298372", // CJPY(underlying) address
      "0xEEf0C605546958c1f899b6fB336C20671f9cD49F", // crvUSD/USD priceFeed
      8, // decimals
      "CJPY/USD priceFeed", // description
    ];
    const CjpyPriceFeed = await deploymentManager.deploy(
      "CJPY(onchain):priceFeed",
      "pricefeeds/CurveTwocryptoChainlinkPriceFeed.sol",
      configuration
    );

    const args: VerifyArgs = {
      via: "artifacts",
      address: CjpyPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
