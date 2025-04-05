// Script to create a pool with the Humane Banque AuctionRepoHook
const { ethers } = require("hardhat");
require('dotenv').config({ path: '../.env' });

async function main() {
  console.log("Creating Uniswap V4 pool with AuctionRepoHook...");

  // Load environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY environment variable");
  }

  const HOOK_ADDRESS = process.env.HOOK_ADDRESS;
  if (!HOOK_ADDRESS) {
    throw new Error("Missing HOOK_ADDRESS environment variable - deploy hook first");
  }

  const RPC_URL = process.env.ETH_RPC_URL || "https://worldchain.drpc.org";
  console.log("Using RPC URL:", RPC_URL);

  // Connect to the World Chain network
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Creating pool with account:", wallet.address);

  // Get addresses from environment variables
  const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
  const token0Address = process.env.TOKEN0_ADDRESS;
  const token1Address = process.env.TOKEN1_ADDRESS;

  console.log("Using contract addresses:");
  console.log("PoolManager:", poolManagerAddress);
  console.log("Hook:", HOOK_ADDRESS);
  console.log("Token0 (USDC):", token0Address);
  console.log("Token1 (WLD):", token1Address);

  // Load the PoolManager ABI - simplified for this script
  const poolManagerAbi = [
    "function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) calldata key, uint160 sqrtPriceX96, bytes calldata hookData) external returns (int24)"
  ];

  // Create contract instance
  const poolManager = new ethers.Contract(poolManagerAddress, poolManagerAbi, wallet);

  // Constants
  const FEE = 3000; // 0.3%
  const TICK_SPACING = 60;
  const SQRT_PRICE_1_1 = "79228162514264337593543950336"; // 1:1 price
  
  // Create pool key structure
  // Note: In a production environment, you may need to ensure the tokens are sorted
  // Here we assume they are already in the correct order
  const poolKey = {
    currency0: token0Address,
    currency1: token1Address,
    fee: FEE,
    tickSpacing: TICK_SPACING,
    hooks: HOOK_ADDRESS
  };

  console.log("Initializing pool with parameters:", JSON.stringify(poolKey, null, 2));
  console.log("SQRT Price:", SQRT_PRICE_1_1);

  try {
    // Initialize the pool
    const tx = await poolManager.initialize(
      poolKey,
      SQRT_PRICE_1_1,
      "0x" // Empty hook data
    );
    console.log("Transaction sent, waiting for confirmation...");
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Pool created successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nNext steps:");
    console.log("1. Update your frontend config with the hook address");
    console.log("2. Use the app to interact with the protocol");
  } catch (error) {
    console.error("Error creating pool:", error);
    
    // Check if tokens need to be swapped
    if (error.toString().includes("InvalidCurrencyOrder")) {
      console.log("\nError suggests tokens may be in wrong order. Try swapping token0 and token1 in your .env file.");
    }
  }
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });