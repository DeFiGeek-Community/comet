import { VerifyArgs } from "../../../../plugins/deployment_manager";
import { DeploymentManager } from "../../../../plugins/deployment_manager/DeploymentManager";
import { migration } from "../../../../plugins/deployment_manager/Migration";
import {
  deployKompuSimple,
  DeploySpec,
  getKompuConfiguration,
} from "../../../../src/deploy";

interface Vars {}

export default migration("1766223832_param-update-2", {
  prepare: async (deploymentManager: DeploymentManager) => {
    return {};
  },

  enact: async (
    deploymentManager: DeploymentManager,
    govDeploymentManager: DeploymentManager,
    vars: Vars
  ) => {
    const JPYC = await deploymentManager.existing(
      "JPYC",
      "0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29"
    );
    const deploySpec: DeploySpec = {
      all: false,
      update: true,
    };

    const { tmpCometImpl, cometExt } = await deployKompuSimple(
      deploymentManager,
      deploySpec
    );

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
      rewardTokenAddress,
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
      via: "artifacts",
      address: tmpCometImpl.address,
      constructorArguments: [config],
    };

    await deploymentManager.verifyContract(args);
  },
});
