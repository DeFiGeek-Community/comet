import { VerifyArgs } from '../../../../plugins/deployment_manager';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';
import { DeploySpec, deployKompuSimple, getKompuConfiguration } from '../../../../src/deploy';

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

    const {tmpCometImpl, cometExt} = await deployKompuSimple(deploymentManager, deploySpec);
    
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
    } = await getKompuConfiguration(deploymentManager);

    const config = {
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

    const args: VerifyArgs = {
      via: 'artifacts',
      address: tmpCometImpl.address,
      constructorArguments: [config]
    };

    await deploymentManager.verifyContract(args);
  },

  async enacted(deploymentManager: DeploymentManager): Promise<boolean> {
    return true;
  },
});
