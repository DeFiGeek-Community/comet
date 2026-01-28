import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';

interface Vars {};

export default migration('1698234124_cjpy-pricefeed', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const configuration = [
      '0xC230CA97b4E88338B87C06E9f3a252710949A060', // TXJP/ETH priceFeed
      '0x961dD84059505D59f82cE4fb87D3c09bec65301d', // TXJP(underlying) address
      '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', // ETH/USD priceFeed
      8,                                            // decimals
      'TXJP/USD priceFeed'                        // description
    ];
    const TxjpPriceFeed = await deploymentManager.deploy(
      'TXJP:priceFeed',
      'pricefeeds/UniChainlinkPriceFeed.sol',
      configuration
    );

    const args: VerifyArgs = {
      via: 'artifacts',
      address: TxjpPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
