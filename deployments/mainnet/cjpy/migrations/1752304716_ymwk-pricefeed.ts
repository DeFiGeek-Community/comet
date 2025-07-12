import { VerifyArgs } from "../../../../plugins/deployment_manager";
import { DeploymentManager } from "../../../../plugins/deployment_manager/DeploymentManager";
import { migration } from "../../../../plugins/deployment_manager/Migration";

interface Vars {}

export default migration("1752304716_ymwk-pricefeed", {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (
    deploymentManager: DeploymentManager,
    govDeploymentManager: DeploymentManager,
    vars: Vars
  ) => {
    const configuration = [
      "0x06Ac09Ca29369E2483533EB68dfe0A4d4143543d", // CJPY/TXJP/YMWK pool
      "0x15Dac05C93e1c5F31a29547340997BA9f6ec4F87", // YMWK(underlying) address
      "0x09EA945Df2C7701f701Fc5Ac074BA49450b9c88a", // CJPY/USD priceFeed
      8, // decimals
      "YMWK/USD priceFeed", // description
    ];
    const YmwkPriceFeed = await deploymentManager.deploy(
      "YMWK:priceFeed",
      "pricefeeds/CurveTricryptoChainlinkPriceFeed.sol",
      configuration
    );

    const args: VerifyArgs = {
      via: "artifacts",
      address: YmwkPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
