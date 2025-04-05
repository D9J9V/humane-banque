# Deployment Summary for Humane Banque

## Deployment Status: COMPLETED ✅

**Successfully Deployed to World Chain!**

The contracts have been deployed with the following details:

1. **Smart Contract Deployment:**
   - AuctionRepoHook: `0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000`
   - Pool created and initialized with USDC and WLD token pair
   - World ID integration active at: `0x17B354dD2595411ff79041f930e491A4Df39A278`

2. **Token Information:**
   - USDC: `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
   - WLD: `0x2cFc85d8E48F8EAB294be644d9E25C3030863003`
   - Uniswap V4 Pool Manager: `0xb1860D529182ac3BC1F51Fa2ABd56662b7D13f33`

3. **Markets Created:**
   - 30-day term market (expires in 30 days from April 5, 2025)
   - 90-day term market (expires in 90 days from April 5, 2025)
   - 180-day term market (expires in 180 days from April 5, 2025)

## Running the Demo

To view the deployed contracts and verify their configuration:

```bash
cd contracts-unified
source ../.env
forge script script/DemoDeployment.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public -vvvv
```

To create a complete demo for presentation:

1. **Screen Recording:**
   - Record the output of the demo script showing deployed contracts
   - Navigate through the web UI showing:
     - Dashboard with market rates
     - Lending interface
     - Borrowing interface
     - Portfolio view
   - Show World ID verification flow
   - Demonstrate transaction signing

2. **Web Interface:**
   - Start the web application: `pnpm dev`
   - Navigate to http://localhost:3000
   - Ensure your .env has been updated with the deployed contract addresses

## Deployment Process (For Reference)

The deployment was completed using the following steps:

```bash
# Deploy hook with proper flag encoding
cd contracts-unified
source ../.env
forge script script/DeployWorldChain.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public --private-key $PRIVATE_KEY --broadcast -vvvv

# Updated .env with HOOK_ADDRESS from output
# Then created the pool (had to fix currency order)
forge script script/CreatePoolWorldChain.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public --private-key $PRIVATE_KEY --broadcast -vvvv
```

## Important Technical Notes

- The AuctionRepoHook was deployed with proper flag encoding (`AFTER_INITIALIZE_FLAG`) for Uniswap V4
- We used HookMiner to find the right salt value for CREATE2 deployment
- Currency order was swapped to satisfy Uniswap V4 requirements (lower address must be currency0)
- Three markets were created with different maturities (30, 90, and 180 days)
- World ID integration is active and working with real verifications

## Resources

For more details, see:
- [README.md](../README.md) - Main project documentation
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Detailed deployment instructions
- [Uniswap V4 Hook Documentation](https://docs.uniswap.org/contracts/v4/concepts/hooks)