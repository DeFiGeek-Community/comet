import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, exp, wait, makeToken, deployCometSimple } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  const trace = deploymentManager.tracer();
  const signer = await deploymentManager.getSigner();
  
  const fauceteer = await deploymentManager.existing('fauceteer', '0x7E0b95BC64d50DA1aC4897E76f0D42C88Dd7bdF4', 'goerli');
  const cjpy = await deploymentManager.existing('CJPY', '0x24611d7080f8510ff147e952C76F3482D77f40D4', 'goerli');
  const txjp = await deploymentManager.existing('TXJP', '0x1a184d94F06987e495Dd868f33D438E63cFF3F67', 'goerli');
  const wstETH = await deploymentManager.existing('wstETH', '0x2794382CF3c5194F9Beb22B8c9e508E3dd4014A5', 'goerli');
  const usdc = await deploymentManager.existing('USDC', '0xb2d619fd3AAf88345f6c4fcbE56fE2e44Bdf9Fd4', 'goerli');
  const crvusd = await deploymentManager.existing('crvUSD', '0x42C38A701f826bAaD15055FEE23F02Bd0A5631a8', 'goerli');

  // Deploy all Comet-related contracts
  const deployed = await deployCometSimple(deploymentManager, deploySpec);

  // Mint some tokens
  trace(`Attempting to mint as ${signer.address}...`);

  await Promise.all(
    [[txjp, 200000], [wstETH, 5000000], [usdc, 5000000], [crvusd, 5000000]].map(([asset, units]) => {
      return deploymentManager.idempotent(
        async () => (await asset.balanceOf(fauceteer.address)).eq(0),
        async () => {
          trace(`Minting ${units} ${await asset.symbol()} to fauceteer`);
          const amount = exp(units, await asset.decimals());
          trace(await wait(asset.connect(signer).allocateTo(fauceteer.address, amount)));
          trace(`asset.balanceOf(${signer.address}): ${await asset.balanceOf(signer.address)}`);
        }
      );
    })
  );

  return { ...deployed, fauceteer };
}
