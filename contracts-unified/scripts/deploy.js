// Script to deploy the Humane Banque smart contracts
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Humane Banque contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // You can use real addresses on mainnet or testnet
  // For example on Sepolia:
  // These are placeholder addresses - use real ones for production
  const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC on Sepolia
  const wldAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";   // Placeholder for WLD - use actual
  const worldIdAddress = "0x719683F13Eeea7D84fCBa5d7d17Bf82e03E3d260"; // Placeholder - use World ID verifier address
  const poolManagerAddress = "0x64255ed21366DB9D34738bc434769319a1C75Ac0"; // Placeholder - use Uniswap V4 PoolManager
  
  // For testing on localhost, use mocks
  let quoteToken, collateralToken, worldId, poolManager;
  
  if (network.name === "localhost" || network.name === "hardhat") {
    // Use mocks for local testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
  
    console.log("Deploying mock USDC token...");
    quoteToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    await quoteToken.waitForDeployment();
    console.log("USDC deployed at:", await quoteToken.getAddress());
    
    console.log("Deploying mock WLD token...");
    collateralToken = await MockERC20.deploy("Worldcoin", "WLD", 18);
    await collateralToken.waitForDeployment();
    console.log("WLD deployed at:", await collateralToken.getAddress());
    
    // Deploy mock WorldID (for testing)
    console.log("Deploying mock WorldID router...");
    const MockWorldID = await ethers.getContractFactory("MockWorldID");
    worldId = await MockWorldID.deploy();
    await worldId.waitForDeployment();
    console.log("WorldID router deployed at:", await worldId.getAddress());
    
    // Deploy mock PoolManager (for testing)
    console.log("Deploying mock Uniswap V4 PoolManager...");
    const MockPoolManager = await ethers.getContractFactory("MockPoolManager");
    poolManager = await MockPoolManager.deploy();
    await poolManager.waitForDeployment();
    console.log("PoolManager deployed at:", await poolManager.getAddress());
  } else {
    // Use real addresses on testnet/mainnet
    console.log("Using real contract addresses:");
    console.log("USDC:", usdcAddress);
    console.log("WLD:", wldAddress);
    console.log("WorldID:", worldIdAddress);
    console.log("PoolManager:", poolManagerAddress);
    
    quoteToken = { getAddress: async () => usdcAddress };
    collateralToken = { getAddress: async () => wldAddress };
    worldId = { getAddress: async () => worldIdAddress };
    poolManager = { getAddress: async () => poolManagerAddress };
  }
  
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
  
  console.log("Deployment and configuration complete!");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });