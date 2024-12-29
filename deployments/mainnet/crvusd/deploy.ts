import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, deployCometSimple } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  const trace = deploymentManager.tracer();
  const signer = await deploymentManager.getSigner();
  
  const rewards = await deploymentManager.fromDep('rewards', 'mainnet', 'cjpy');

  // Deploy all Comet-related contracts
  const deployed = await deployCometSimple(deploymentManager, deploySpec);

  return { ...deployed };
}
