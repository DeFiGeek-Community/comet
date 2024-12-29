import configulation from "./configuration.json";
import aliases from "./aliases.json";
import hre from "hardhat";
import { exp, wait } from "../../../test/helpers";
import helpers from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";

const ethers = hre.ethers;

const clientCjpyBalance = exp(100000000,18);
const clientTxjpBalance = exp(10000,8);
const SECONDS_PER_DAY = BigNumber.from(86400);

async function watchBorrowStatus(client,comet,cometExt) {
    // check borrow balance
    const utilization = await comet.getUtilization()
    console.log("Utilization", utilization / 1e18);
    const supplyRewardSpeed = await comet.getBaseTrackingSupplySpeed(utilization);
    const borrowRewardSpeed = await comet.getBaseTrackingBorrowSpeed(utilization);
    console.log("supplyRewardSpeed",(supplyRewardSpeed));
    console.log("borrowRewardSpeed",(borrowRewardSpeed));
    console.log("supplyRewardSpeedDay",(supplyRewardSpeed).mul(SECONDS_PER_DAY));
    console.log("borrowRewardSpeedDay",(borrowRewardSpeed).mul(SECONDS_PER_DAY));
    console.log("borrow baseTrackingAccrued",await cometExt.baseTrackingAccrued(client.address));
    await time.increase(SECONDS_PER_DAY);
    await wait(comet.connect(client).accrueAccount(client.address));
    console.log("borrow baseTrackingAccrued",await cometExt.baseTrackingAccrued(client.address));
}

// utilization 50%
async function utilUnderKink(client,comet,cometExt,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance*50n/100n));

    await watchBorrowStatus(client,comet,cometExt);
}

// utilization 90%
async function utilJustKink(client,comet,cometExt,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance*35n/100n));

    await watchBorrowStatus(client,comet,cometExt);
}

// utilization 100%
async function utilOverKink(client,comet,cometExt,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance*15n/100n));

    await watchBorrowStatus(client,comet,cometExt);
}

async function main() {

    const [owner, skip, c1,c2,c3] = await ethers.getSigners();

    const comet = await ethers.getContractAt(
        "Kompu",
        aliases.comet
    );
    const cometExt = await ethers.getContractAt(
        "CometExt",
        aliases.comet
    );
    const cjpy = await ethers.getContractAt(
        "FaucetToken",
        aliases.CJPY
    );
    const txjp = await ethers.getContractAt(
        "FaucetToken",
        aliases.TXJP
    );

    await wait(cjpy.connect(owner).approve(comet.address, clientCjpyBalance * 10n));
    await wait(txjp.connect(owner).approve(comet.address, clientTxjpBalance * 10n));

    // supply basetoken by owner
    await wait(comet.connect(owner).supply(cjpy.address, clientCjpyBalance));

    await wait(txjp.connect(owner).transfer(c1.address, clientTxjpBalance));
    await utilUnderKink(c1,comet,cometExt,txjp,cjpy);
    await wait(txjp.connect(owner).transfer(c2.address, clientTxjpBalance));
    await utilJustKink(c2,comet,cometExt,txjp,cjpy);
    await wait(txjp.connect(owner).transfer(c3.address, clientTxjpBalance));
    await utilOverKink(c3,comet,cometExt,txjp,cjpy);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });