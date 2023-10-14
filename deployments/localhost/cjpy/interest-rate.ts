import configulation from "./configuration.json";
import aliases from "./aliases.json";
import hre from "hardhat";
import { exp, wait } from "../../../test/helpers";
import helpers from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ethers = hre.ethers;

const clientCjpyBalance = exp(10000,18);
const clientTxjpBalance = exp(10000,8);
const SECONDS_PER_YEAR = 31_536_000;

async function watchBorrowStatus(client,comet) {
    // check borrow balance
    const utilization = await comet.getUtilization()
    console.log("Utilization", utilization / 1e18);
    console.log("borrowRate",await comet.getBorrowRate(utilization) * SECONDS_PER_YEAR);
    console.log("borrow balance before",await comet.borrowBalanceOf(client.address));
    await time.increase(SECONDS_PER_YEAR);
    console.log("borrow balance after",await comet.borrowBalanceOf(client.address));
}

// utilization 50%
async function utilUnderKink(client,comet,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance));

    await watchBorrowStatus(client,comet);
}

// utilization 90%
async function utilJustKink(client,comet,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance*8n/10n));

    await watchBorrowStatus(client,comet);
}

// utilization 100%
async function utilOverKink(client,comet,txjp,cjpy) {
    // borrow basetoken by client
    await wait(txjp.connect(client).approve(comet.address, clientTxjpBalance));
    await wait(comet.connect(client).supply(txjp.address, clientTxjpBalance));
    await wait(comet.connect(client).withdraw(cjpy.address, clientCjpyBalance*2n/10n));

    await watchBorrowStatus(client,comet);
}

async function main() {

    const [owner, skip, c1,c2,c3] = await ethers.getSigners();

    const comet = await ethers.getContractAt(
        "Comet",
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
    await wait(comet.connect(owner).supply(cjpy.address, clientCjpyBalance*2n));

    await wait(txjp.connect(owner).transfer(c1.address, clientTxjpBalance));
    await utilUnderKink(c1,comet,txjp,cjpy);
    await wait(txjp.connect(owner).transfer(c2.address, clientTxjpBalance));
    await utilJustKink(c2,comet,txjp,cjpy);
    await wait(txjp.connect(owner).transfer(c3.address, clientTxjpBalance));
    await utilOverKink(c3,comet,txjp,cjpy);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });