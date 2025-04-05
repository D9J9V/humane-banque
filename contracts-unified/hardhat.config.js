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
    sources: "./",
    tests: "./tests",
    cache: "./artifacts/cache",
    artifacts: "./artifacts",
    root: __dirname
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Add additional networks as needed:
    // sepolia: {
    //   url: process.env.SEPOLIA_URL || "",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  etherscan: {
    // Your API key for Etherscan
    // apiKey: process.env.ETHERSCAN_API_KEY,
  },
  // Custom resolver for Uniswap imports
  customSolcPaths: {
    "contracts/": "./contracts/",
    "@uniswap/v4-core/contracts/interfaces/": "./interfaces/uniswap/",
    "@uniswap/v4-core/contracts/libraries/": "./libraries/uniswap/",
    "@uniswap/v4-core/contracts/types/": "./types/uniswap/"
  }
};