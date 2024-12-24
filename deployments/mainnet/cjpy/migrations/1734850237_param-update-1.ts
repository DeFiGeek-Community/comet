import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';
import { DeploySpec, deployKompuSimple } from '../../../../src/deploy';

interface Vars {};

export default migration('1734850237_param-update-1', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const deploySpec: DeploySpec = {
      all: false,
      update: true,
    };
    const deployed = await deployKompuSimple(deploymentManager, deploySpec);
    
    await deploymentManager.verifyContracts(async (address, args) => {
      if (args.via === 'buildfile') {
        const { contract: _, ...rest } = args;
        console.log(`[${address}:`, rest);
      } else {
        console.log(`[${address}:`, args);
      }
      return true;
    });
    console.log(deployed);

    // const args: VerifyArgs = {
    //   via: 'artifacts',
    //   address: cometImpl.address,
    //   constructorArguments: [config]
    // };

    // await deploymentManager.verifyContract(args);
  }
});
