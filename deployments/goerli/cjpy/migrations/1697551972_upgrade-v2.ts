import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';
import { getKompuConfiguration } from '../../../../src/deploy/NetworkConfiguration';

interface Vars {};

export default migration('1697551972_upgrade-v2', {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (deploymentManager: DeploymentManager, govDeploymentManager: DeploymentManager, vars: Vars) => {
    const {
      name,
      symbol,
      governor, // NB: generally 'timelock' alias, not 'governor'
      pauseGuardian,
      baseToken,
      baseTokenPriceFeed,
      supplyKink,
      supplyPerYearInterestRateSlopeLow,
      supplyPerYearInterestRateSlopeHigh,
      supplyPerYearInterestRateBase,
      borrowKink,
      borrowPerYearInterestRateSlopeLow,
      borrowPerYearInterestRateSlopeHigh,
      borrowPerYearInterestRateBase,
      storeFrontPriceFactor,
      trackingIndexScale,
      rewardKink,
      baseTrackingRewardSpeed,
      baseMinForRewards,
      baseBorrowMin,
      targetReserves,
      assetConfigs,
      rewardTokenAddress
    } = await getKompuConfiguration(deploymentManager, {});

    const cometExt = await deploymentManager.existing('comet:implementation:implementation', '0x4543Bf38a44e2814f156bb4C7f37AfC4538F6cB5', 'goerli');
    const configuration = {
      governor,
      pauseGuardian,
      baseToken,
      baseTokenPriceFeed,
      extensionDelegate: cometExt.address,
      supplyKink,
      supplyPerYearInterestRateSlopeLow,
      supplyPerYearInterestRateSlopeHigh,
      supplyPerYearInterestRateBase,
      borrowKink,
      borrowPerYearInterestRateSlopeLow,
      borrowPerYearInterestRateSlopeHigh,
      borrowPerYearInterestRateBase,
      storeFrontPriceFactor,
      trackingIndexScale,
      rewardKink,
      baseTrackingRewardSpeed,
      baseMinForRewards,
      baseBorrowMin,
      targetReserves,
      assetConfigs,
    };

    const tmpCometImpl = await deploymentManager.deploy(
      'comet:implementation',
      'Kompu.sol',
      [configuration],
      true,
    );

    const args: VerifyArgs = {
      via: 'artifacts',
      address: tmpCometImpl.address,
      constructorArguments: [configuration],
    };
    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
