import { ethers } from "hardhat";

async function main() {
  const TransparentUpgradeableProxy = await ethers.getContractFactory("contracts/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy");

  console.log("Deploying TransparentUpgradeableProxy...");

  const proxy = await TransparentUpgradeableProxy.deploy(
    "0xbD6286・・・", // logic contract address
    "0xdA60D9・・・", // admin (CometProxyAdmin ➜ safe)
    "0x" // data (デプロイ時に初期化データを送信する場合に使用)
  );

  await proxy.deployed();

  console.log("TransparentUpgradeableProxy deployed to:", proxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });