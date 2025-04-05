require("@nomicfoundation/hardhat-toolbox");
const path = require("path");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./artifacts/cache",
    artifacts: "./artifacts",
    root: __dirname
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    worldchain: {
      url: process.env.ETH_RPC_URL || "https://worldchain.drpc.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 480,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // apiKey: process.env.ETHERSCAN_API_KEY,
  },
  // Aliases for solidity source locations
  paths: {
    sources: "./",
    artifacts: "./artifacts",
    cache: "./cache",
  }
};