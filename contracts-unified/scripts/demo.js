// Humane Banque Demo Script
// Run this script with: forge script scripts/demo.js

// This is a forge script that can be run to demonstrate the deployed contracts
// It prints out information about the contracts without requiring additional dependencies

// Define the contract addresses directly
const AUCTION_REPO_HOOK_ADDRESS = "0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000";
const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";

// Connect to provider
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/public');

// Create wallet from private key
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Get contract instances
const auctionRepoHook = new ethers.Contract(AUCTION_REPO_HOOK_ADDRESS, auctionRepoHookABI, wallet);
const usdc = new ethers.Contract(USDC_ADDRESS, erc20ABI, wallet);
const wld = new ethers.Contract(WLD_ADDRESS, erc20ABI, wallet);

// Demo functions
async function displayContractInfo() {
  console.log('\n--- Humane Banque Contract Info ---');
  console.log('Hook Address:', AUCTION_REPO_HOOK_ADDRESS);
  console.log('USDC Address:', USDC_ADDRESS);
  console.log('WLD Address:', WLD_ADDRESS);
  console.log('Connected Wallet:', wallet.address);

  // Get markets
  try {
    const marketCount = await auctionRepoHook.getMarketCount();
    console.log(`\nAvailable Markets: ${marketCount}`);

    for (let i = 0; i < marketCount; i++) {
      const marketExpiry = await auctionRepoHook.getMarketById(i);
      const expiryDate = new Date(Number(marketExpiry) * 1000);
      console.log(`Market #${i}: Expires ${expiryDate.toLocaleDateString()} (${expiryDate.toLocaleTimeString()})`);
    }
  } catch (error) {
    console.error('Error fetching markets:', error.message);
  }

  // Get allowed collateral
  try {
    const isWldAllowed = await auctionRepoHook.isCollateralAllowed(WLD_ADDRESS);
    console.log(`\nWLD Allowed as Collateral: ${isWldAllowed}`);
  } catch (error) {
    console.error('Error checking collateral:', error.message);
  }
}

async function checkBalances() {
  console.log('\n--- Token Balances ---');
  try {
    const usdcBalance = await usdc.balanceOf(wallet.address);
    const wldBalance = await wld.balanceOf(wallet.address);

    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`WLD Balance: ${ethers.formatUnits(wldBalance, 18)}`);
  } catch (error) {
    console.error('Error checking balances:', error.message);
  }
}

async function checkActivePositions() {
  console.log('\n--- Active Positions ---');
  try {
    const loanCount = await auctionRepoHook.getLoanCount();
    console.log(`Total Loans: ${loanCount}`);

    for (let i = 0; i < Math.min(loanCount, 5); i++) {
      try {
        const loan = await auctionRepoHook.getLoan(i);
        console.log(`\nLoan #${i}:`);
        console.log(`  Borrower: ${loan.borrower}`);
        console.log(`  Collateral: ${ethers.formatUnits(loan.collateralAmount, 18)} WLD`);
        console.log(`  Loan Amount: ${ethers.formatUnits(loan.loanAmount, 6)} USDC`);
        console.log(`  Market ID: ${loan.marketId}`);
        console.log(`  Status: ${loan.isLiquidated ? 'Liquidated' : 'Active'}`);
      } catch (error) {
        console.error(`Error fetching loan #${i}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error checking loans:', error.message);
  }
}

// Main function
async function runDemo() {
  console.log('=================================');
  console.log('Humane Banque Smart Contract Demo');
  console.log('=================================');

  await displayContractInfo();
  await checkBalances();
  await checkActivePositions();

  console.log('\nDemo complete!');
  console.log('=================================');
}

// Run the demo
runDemo().catch(error => {
  console.error('Demo failed:', error);
});