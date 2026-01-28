import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';
import { makePriceFeed, makeToken } from '../../../../src/deploy';

interface Vars {};

export default migration('1697342719_faucet-tokens', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const fauceteer = await deploymentManager.deploy('fauceteer', 'test/Fauceteer.sol', []);
    const txjp = await makeToken(deploymentManager, 210000, 'TXJP', 8, 'TXJP');
    const wstETH = await makeToken(deploymentManager, 10000000, 'wstETH', 18, 'wstETH');
    const usdc = await makeToken(deploymentManager, 10000000, 'USDC', 6, 'USDC');
    const crvusd = await makeToken(deploymentManager, 10000000, 'crvUSD', 18, 'crvUSD');
    const txjpPriceFeed = await makePriceFeed(deploymentManager, 'TXJP:priceFeed', 80, 8);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
