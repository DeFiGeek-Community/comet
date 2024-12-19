import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';

interface Vars {};

export default migration('1734610706_scrvusd-pricefeed', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const configuration = [
      '0xEEf0C605546958c1f899b6fB336C20671f9cD49F', // CRVUSD/USD priceFeed
      '0x0655977FEb2f289A4aB78af67BAB0d17aAb84367', // scrvUSD vault
      8,                                            // decimals
      'scrvUSD/USD priceFeed'                        // description
    ];
    const ScrvusdPriceFeed = await deploymentManager.deploy(
      'scrvUSD:priceFeed',
      'pricefeeds/YearnVaultPriceFeed.sol',
      configuration
    );

    const args: VerifyArgs = {
      via: 'artifacts',
      address: ScrvusdPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  }
});
