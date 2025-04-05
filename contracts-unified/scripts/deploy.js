// Script to deploy the Humane Banque smart contracts
const { ethers } = require("hardhat");
require('dotenv').config({ path: '../.env' });

async function main() {
  console.log("Deploying Humane Banque contracts to World Chain...");

  // Load environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY environment variable");
  }

  const RPC_URL = process.env.ETH_RPC_URL || "https://worldchain.drpc.org";
  console.log("Using RPC URL:", RPC_URL);

  // Connect to the World Chain network
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deploying with account:", wallet.address);

  // Get real addresses from environment variables
  const worldIdAddress = process.env.WORLD_ID_ADDRESS;
  const usdcAddress = process.env.QUOTE_TOKEN_ADDRESS;
  const wldAddress = process.env.TOKEN1_ADDRESS;
  const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;

  console.log("Using contract addresses:");
  console.log("USDC:", usdcAddress);
  console.log("WLD:", wldAddress);
  console.log("WorldID:", worldIdAddress);
  console.log("PoolManager:", poolManagerAddress);

  // Deploy AuctionRepoHook
  console.log("Deploying AuctionRepoHook...");
  const AuctionRepoHook = await ethers.getContractFactory("AuctionRepoHook", wallet);
  const auctionRepoHook = await AuctionRepoHook.deploy(
    poolManagerAddress,
    worldIdAddress,
    usdcAddress,
    wallet.address
  );
  await auctionRepoHook.waitForDeployment();
  
  const hookAddress = await auctionRepoHook.getAddress();
  console.log("AuctionRepoHook deployed at:", hookAddress);
  
  // Setup initial market and collateral
  console.log("Setting up initial configuration...");
  
  // Allow WLD as collateral
  const tx1 = await auctionRepoHook.setCollateralAllowed(wldAddress, true);
  await tx1.wait();
  console.log("WLD added as allowed collateral");
  
  // Add market with 30-day, 90-day, and 180-day terms
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  
  const tx2 = await auctionRepoHook.addMarket(now + 30 * day);
  await tx2.wait();
  console.log("Added 30-day market");
  
  const tx3 = await auctionRepoHook.addMarket(now + 90 * day);
  await tx3.wait();
  console.log("Added 90-day market");
  
  const tx4 = await auctionRepoHook.addMarket(now + 180 * day);
  await tx4.wait();
  console.log("Added 180-day market");
  
  console.log("Deployment and configuration complete!");
  console.log("Update your .env with:");
  console.log(`HOOK_ADDRESS="${hookAddress}"`);
  console.log("\nNext, create the pool using CreatePoolWithHook.s.sol or another method");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });