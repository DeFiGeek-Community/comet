import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, exp, wait, makeToken, makePriceFeed, deployCometSimple } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  const trace = deploymentManager.tracer();
  const ethers = deploymentManager.hre.ethers;
  const signer = await deploymentManager.getSigner();
  const fauceteer = await deploymentManager.deploy('fauceteer', 'test/Fauceteer.sol', []);

  const CJPY = await makeToken(deploymentManager, 10000000, 'CJPY', 18, 'CJPY');
  const GOLD = await makeToken(deploymentManager, 20000000, 'GOLD', 8, 'GOLD');
  const SILVER = await makeToken(deploymentManager, 30000000, 'SILVER', 10, 'SILVER');

  const cjpyPriceFeed = await makePriceFeed(deploymentManager, 'CJPY:priceFeed', 1, 8);
  const goldPriceFeed = await makePriceFeed(deploymentManager, 'GOLD:priceFeed', 0.5, 8);
  const silverPriceFeed = await makePriceFeed(deploymentManager, 'SILVER:priceFeed', 0.05, 8);

  const assetConfig0 = {
    asset: GOLD.address,
    priceFeed: goldPriceFeed.address,
    decimals: (8).toString(),
    borrowCollateralFactor: (0.9e18).toString(),
    liquidateCollateralFactor: (0.91e18).toString(),
    liquidationFactor: (0.95e18).toString(),
    supplyCap: (1000000e8).toString(),
  };

  const assetConfig1 = {
    asset: SILVER.address,
    priceFeed: silverPriceFeed.address,
    decimals: (10).toString(),
    borrowCollateralFactor: (0.4e18).toString(),
    liquidateCollateralFactor: (0.5e18).toString(),
    liquidationFactor: (0.9e18).toString(),
    supplyCap: (500000e10).toString(),
  };

  // Deploy all Comet-related contracts
  const deployed = await deployCometSimple(deploymentManager, deploySpec, {
    baseTokenPriceFeed: cjpyPriceFeed.address,
    assetConfigs: [assetConfig0, assetConfig1],
  });
  const { rewards } = deployed;

  await deploymentManager.idempotent(
    async () => (await GOLD.balanceOf(rewards.address)).eq(0),
    async () => {
      trace(`Sending some GOLD to CometRewards`);
      const amount = exp(2_000_000, 8);
      trace(await wait(GOLD.connect(signer).transfer(rewards.address, amount)));
      trace(`GOLD.balanceOf(${rewards.address}): ${await GOLD.balanceOf(rewards.address)}`);
    }
  );

  // Mint some tokens
  trace(`Attempting to mint as ${signer.address}...`);

  await Promise.all(
    [[CJPY, 1e8], [GOLD, 2e6], [SILVER, 1e7]].map(([asset, units]) => {
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
