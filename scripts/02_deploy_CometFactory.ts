import { ethers } from "hardhat";

async function main() {
  const CometFactory = await ethers.getContractFactory("CometFactory");
  
  console.log("Now Deploy");
  
  const cometFactory = await CometFactory.deploy();

  console.log("Deploying CometFactory...");

  await cometFactory.deployed();

  console.log("CometFactory deployed to:", cometFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


// const hre = require("hardhat");

// async function main() {

//   const CometFactory = await hre.ethers.getContractFactory("CometFactory");
//   console.log("Now Deploy");
//   const cometFactory = await CometFactory.deploy();

//   console.log("Deploying CometFactory...");

//   await cometFactory.deployed();

//   console.log("CometFactory deployed to:", cometFactory.address);
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main();