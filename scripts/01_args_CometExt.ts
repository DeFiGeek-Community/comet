// config.js
const ethers = require('ethers');

// structの定義
const config = 
[
  {
    name32: ethers.utils.formatBytes32String("Compound USDC"),
    symbol32: ethers.utils.formatBytes32String("cUSDCv3"),
  }
]

module.exports = config;