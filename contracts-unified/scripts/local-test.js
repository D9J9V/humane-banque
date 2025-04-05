// Script for local testing of the Humane Banque smart contracts
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Humane Banque contracts for local testing...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Use mocks for local testing
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  console.log("Deploying mock USDC token...");
  const quoteToken = await MockERC20.deploy("USD Coin", "USDC", 6);
  await quoteToken.waitForDeployment();
  console.log("USDC deployed at:", await quoteToken.getAddress());
  
  console.log("Deploying mock WLD token...");
  const collateralToken = await MockERC20.deploy("Worldcoin", "WLD", 18);
  await collateralToken.waitForDeployment();
  console.log("WLD deployed at:", await collateralToken.getAddress());
  
  // Deploy mock WorldID (for testing)
  console.log("Deploying mock WorldID router...");
  const MockWorldID = await ethers.getContractFactory("MockWorldID");
  const worldId = await MockWorldID.deploy();
  await worldId.waitForDeployment();
  console.log("WorldID router deployed at:", await worldId.getAddress());
  
  // Deploy mock PoolManager (for testing)
  console.log("Deploying mock Uniswap V4 PoolManager...");
  const MockPoolManager = await ethers.getContractFactory("MockPoolManager");
  const poolManager = await MockPoolManager.deploy();
  await poolManager.waitForDeployment();
  console.log("PoolManager deployed at:", await poolManager.getAddress());
  
  // Deploy AuctionRepoHook
  console.log("Deploying AuctionRepoHook...");
  const AuctionRepoHook = await ethers.getContractFactory("AuctionRepoHook");
  const auctionRepoHook = await AuctionRepoHook.deploy(
    await poolManager.getAddress(),
    await worldId.getAddress(),
    await quoteToken.getAddress(),
    deployer.address
  );
  await auctionRepoHook.waitForDeployment();
  
  console.log("AuctionRepoHook deployed at:", await auctionRepoHook.getAddress());
  
  // Setup initial market and collateral (for testing)
  console.log("Setting up initial configuration...");
  
  // Allow WLD as collateral
  await auctionRepoHook.setCollateralAllowed(await collateralToken.getAddress(), true);
  console.log("WLD added as allowed collateral");
  
  // Add market with 30-day, 90-day, and 180-day terms
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  
  await auctionRepoHook.addMarket(now + 30 * day);
  console.log("Added 30-day market");
  
  await auctionRepoHook.addMarket(now + 90 * day);
  console.log("Added 90-day market");
  
  await auctionRepoHook.addMarket(now + 180 * day);
  console.log("Added 180-day market");
  
  // Mint tokens to the deployer for testing
  await quoteToken.mint(deployer.address, ethers.parseUnits("10000", 6));
  await collateralToken.mint(deployer.address, ethers.parseUnits("1000", 18));
  console.log("Tokens minted to deployer for testing");
  
  // Output deployment information for .env file
  console.log("\n=== Deployment Summary ===");
  console.log("PoolManager:", await poolManager.getAddress());
  console.log("WorldID:", await worldId.getAddress());
  console.log("Quote Token (USDC):", await quoteToken.getAddress());
  console.log("Collateral Token (WLD):", await collateralToken.getAddress());
  console.log("AuctionRepoHook:", await auctionRepoHook.getAddress());
  
  console.log("\nEnvironment values for .env file:");
  console.log(`POOL_MANAGER_ADDRESS="${await poolManager.getAddress()}"`);
  console.log(`WORLD_ID_ADDRESS="${await worldId.getAddress()}"`);
  console.log(`QUOTE_TOKEN_ADDRESS="${await quoteToken.getAddress()}"`);
  console.log(`TOKEN0_ADDRESS="${await quoteToken.getAddress()}"`);
  console.log(`TOKEN1_ADDRESS="${await collateralToken.getAddress()}"`);
  console.log(`HOOK_ADDRESS="${await auctionRepoHook.getAddress()}"`);
  
  console.log("\nDeployment and configuration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });