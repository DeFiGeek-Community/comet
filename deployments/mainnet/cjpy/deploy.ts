import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, exp, wait, makeToken, deployCometSimple } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  const trace = deploymentManager.tracer();
  const signer = await deploymentManager.getSigner();
  
  // Deploy all Comet-related contracts
  const deployed = await deployCometSimple(deploymentManager, deploySpec);

  return { ...deployed };
}
