import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';

interface Vars {};

export default migration('1698234103_wsteth-pricefeed', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const configuration = [
      '0x4F67e4d9BD67eFa28236013288737D39AeF48e79', // wstETH/ETH priceFeed
      '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', // ETH/USD priceFeed
      8,                                            // decimals
      'wstETH/USD priceFeed'                        // description
    ];
    const wstETHPriceFeed = await deploymentManager.deploy(
      'wstETH:priceFeed',
      'pricefeeds/MultiplicativePriceFeed.sol',
      configuration
    );

    const args: VerifyArgs = {
      via: 'artifacts',
      address: wstETHPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
