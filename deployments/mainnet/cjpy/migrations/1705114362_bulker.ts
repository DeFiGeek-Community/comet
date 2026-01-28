import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';

interface Vars {};

export default migration('1705114362_bulker', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    // Declare existing assets as aliases
    const WETH = await deploymentManager.existing('WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    const wstETH = await deploymentManager.existing('wstETH', '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0');

    const configuration = [
      '0x0b0A167a0b6800207c89544D2eBdC98DCdD33bec',        // admin_
      WETH.address,                  // weth_
      wstETH.address                 // wsteth_
    ];

    // Deploy Bulker
    const bulker = await deploymentManager.deploy(
      'bulker',
      'bulkers/MainnetBulker.sol',
      configuration
    );

    console.log(bulker.address);

    const args: VerifyArgs = {
      via: 'artifacts',
      address: bulker.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
