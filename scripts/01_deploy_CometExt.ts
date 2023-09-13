import { ethers } from "hardhat";

async function main() {
  const CometFactory = await ethers.getContractFactory("CometFactory");

  console.log("Deploying CometFactory...");

  const cometFactory = await CometFactory.deploy();

  await cometFactory.deployed();

  console.log("CometFactory deployed to:", cometFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });