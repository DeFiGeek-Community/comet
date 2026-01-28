import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';

interface Vars {};

export default migration('1727415193_pnd-pricefeed', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const configuration = [
      '0x08bfa2Ba3c948A35AD9d9f2746A51Ffaf796A814', // uniswapPool
      '0x5FFF1443Cb859E17e9a6786f7e24c369F22FD002', // uniswapUnderlying(PND)
      '0x961dD84059505D59f82cE4fb87D3c09bec65301d', // uniswapBase(TXJP)
      '0x7354FbF446fFF15Db6C7c2B8A4a84bFc092B6485', // priceFeedChainlink(TXJP/USD)
      8,                                            // decimals
      'PND/USD priceFeed'                        // description
    ];
    const PndPriceFeed = await deploymentManager.deploy(
      'PND:priceFeed',
      'pricefeeds/UniTwapChainlinkPriceFeed.sol',
      configuration
    );

    const args: VerifyArgs = {
      via: 'artifacts',
      address: PndPriceFeed.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
