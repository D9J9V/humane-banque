// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * This script deploys the AuctionRepoHook contract and sets up initial configuration
 * It's inspired by the Uniswap v4-template deployment approach
 */
async function main() {
  console.log("Deploying AuctionRepoHook...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy mock dependencies for testing
  console.log("Deploying mock dependencies...");
  const MockPoolManager = await ethers.getContractFactory("MockPoolManager");
  const poolManager = await MockPoolManager.deploy();
  await poolManager.waitForDeployment();
  console.log("MockPoolManager deployed to:", await poolManager.getAddress());

  const MockWorldID = await ethers.getContractFactory("MockWorldID");
  const worldId = await MockWorldID.deploy();
  await worldId.waitForDeployment();
  console.log("MockWorldID deployed to:", await worldId.getAddress());

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const quoteToken = await MockERC20.deploy("Quote Token", "QUOT", 6);
  await quoteToken.waitForDeployment();
  console.log("QuoteToken deployed to:", await quoteToken.getAddress());

  const collateralToken = await MockERC20.deploy("Collateral Token", "COLL", 18);
  await collateralToken.waitForDeployment();
  console.log("CollateralToken deployed to:", await collateralToken.getAddress());

  // For production, you would replace these with actual addresses
  // const poolManagerAddress = "0x..."; 
  // const worldIdAddress = "0x...";
  // const quoteTokenAddress = "0x...";

  // Deploy AuctionRepoHook
  console.log("Deploying AuctionRepoHook...");
  const AuctionRepoHook = await ethers.getContractFactory("AuctionRepoHook");
  const hook = await AuctionRepoHook.deploy(
    await poolManager.getAddress(),
    await worldId.getAddress(),
    await quoteToken.getAddress(),
    deployer.address // owner
  );
  await hook.waitForDeployment();
  console.log("AuctionRepoHook deployed to:", await hook.getAddress());

  // Configure hook
  console.log("Configuring hook...");
  await hook.setCollateralAllowed(await collateralToken.getAddress(), true);
  console.log("Added collateral token to allowed list");

  // Create a market with 90-day maturity
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const maturityTimestamp = currentTimestamp + (90 * 24 * 60 * 60);
  await hook.addMarket(maturityTimestamp);
  console.log("Created market with maturity:", new Date(maturityTimestamp * 1000).toISOString());

  console.log("Deployment and setup complete!");
  console.log({
    hook: await hook.getAddress(),
    poolManager: await poolManager.getAddress(),
    worldId: await worldId.getAddress(),
    quoteToken: await quoteToken.getAddress(),
    collateralToken: await collateralToken.getAddress(),
    owner: deployer.address,
    market: maturityTimestamp
  });

  // For production deployment, you would initialize a Uniswap V4 pool with the hook
  // This is just the first step - in a real deployment you'd need to:
  // 1. Deploy with correct hook flags using address mining
  // 2. Create the Uniswap pool with the hook
  // 3. Add initial liquidity
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });