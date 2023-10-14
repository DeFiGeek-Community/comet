import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { DeploySpec, exp, wait, makeToken, makePriceFeed, deployCometSimple, getConfiguration } from '../../../src/deploy';

// TODO: Support configurable assets as well?
export default async function deploy(deploymentManager: DeploymentManager, deploySpec: DeploySpec): Promise<Deployed> {
  await deploymentManager.hre.network.provider.send("hardhat_reset");
  const trace = deploymentManager.tracer();
  const signer = await deploymentManager.getSigner();
  const fauceteer = await deploymentManager.deploy('fauceteer', 'test/Fauceteer.sol', []);

  const CJPY = await makeToken(deploymentManager, 100000000, 'CJPY', 18, 'CJPY');
  const TXJP = await makeToken(deploymentManager, 10000000, 'TXJP', 8, 'TXJP');
  const wstETH = await makeToken(deploymentManager, 10000000, 'wstETH', 18, 'wstETH');
  const REWARD = await makeToken(deploymentManager, 10000000, 'REWARD', 18, 'REWARD');

  const cjpyPriceFeed = await makePriceFeed(deploymentManager, 'CJPY:priceFeed', 0.01, 8);
  const txjpPriceFeed = await makePriceFeed(deploymentManager, 'TXJP:priceFeed', 80, 8);
  const wstPriceFeed = await makePriceFeed(deploymentManager, 'wstETH:priceFeed', 2000, 8);

  const assetConfig0 = {
    asset: TXJP.address,
    priceFeed: txjpPriceFeed.address,
    decimals: (8).toString(),
    borrowCollateralFactor: (0.8e18).toString(),
    liquidateCollateralFactor: (0.9e18).toString(),
    liquidationFactor: (0.9e18).toString(),
    supplyCap: (100000e8).toString(),
  };

  const assetConfig1 = {
    asset: wstETH.address,
    priceFeed: wstPriceFeed.address,
    decimals: (18).toString(),
    borrowCollateralFactor: (0.85e18).toString(),
    liquidateCollateralFactor: (0.95e18).toString(),
    liquidationFactor: (0.95e18).toString(),
    supplyCap: exp(50000, 18).toString(),
  };

  // Deploy all Comet-related contracts
  const deployed = await deployCometSimple(deploymentManager, deploySpec, {
    baseToken: CJPY.address,
    baseTokenPriceFeed: cjpyPriceFeed.address,
    assetConfigs: [assetConfig0, assetConfig1],
  });
  const { rewards } = deployed;

  await deploymentManager.idempotent(
    async () => (await REWARD.balanceOf(rewards.address)).eq(0),
    async () => {
      trace(`Sending some REWARD to CometRewards`);
      const amount = exp(2_000_000, 18);
      trace(await wait(REWARD.connect(signer).transfer(rewards.address, amount)));
      trace(`REWARD.balanceOf(${rewards.address}): ${await REWARD.balanceOf(rewards.address)}`);
    }
  );

  // Mint some tokens
  trace(`Attempting to mint as ${signer.address}...`);

  await Promise.all(
    [[CJPY, 100000000], [TXJP, 10000000], [wstETH, 10000000]].map(([asset, units]) => {
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
