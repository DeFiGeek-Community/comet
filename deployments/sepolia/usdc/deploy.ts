import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, exp, wait, makeToken, deployCometSimple } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  const trace = deploymentManager.tracer();
  const signer = await deploymentManager.getSigner();
  
  const fauceteer = await deploymentManager.existing('fauceteer', '0x69b44447847B6d7bEd4019CC2e6Ac8e5B98a7A3d', 'sepolia');
  const txjp = await deploymentManager.existing('TXJP', '0xdca6BcCecd7C25C654DFD80EcF7c63731B12Df5e', 'sepolia');
  const wstETH = await deploymentManager.existing('wstETH', '0x5CdEfe1204cd7b64af74Ef8147a39fe912010A8B', 'sepolia');
  const usdc = await deploymentManager.existing('USDC', '0x09D52d76F4e9683186C00786574f8c20Ad3f18Ca', 'sepolia');
  const crvusd = await deploymentManager.existing('crvUSD', '0x7BF9f68A3179b17279F2BC4BCFe323DA27fdeEb8', 'sepolia');

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
