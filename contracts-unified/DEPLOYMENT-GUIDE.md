# Humane Banque Deployment Guide

This guide provides instructions for testing and deploying the Humane Banque smart contracts.

## Important Notes on Uniswap V4 Hook Deployment

Uniswap V4 hooks require a specific deployment process:

1. Hook addresses **must** have specific bit flags in their last 2 bytes that match their permissions
2. This is achieved using the CREATE2 deployment method with a mined salt
3. Testing **must be done on Anvil** (local development environment) before production deployment
4. Real-world deployment requires a precise process to ensure correct flag encoding

## Local Testing with Anvil

To test the entire system locally:

```bash
# Start anvil in one terminal
anvil

# In another terminal, deploy the contracts
cd contracts-unified
forge script script/Anvil.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv
```

This script will:
1. Deploy a mock Uniswap V4 PoolManager
2. Deploy mock tokens (USDC, WLD)
3. Deploy a mock WorldID verifier
4. Deploy the AuctionRepoHook with proper flags
5. Set up markets with 30, 90, and 180-day terms
6. Create a pool with the hook
7. Mint test tokens for interacting with the contracts

After deployment, you'll get a summary of all contract addresses that you can use to update your `.env` file for testing.

## Production Deployment Process

For production deployment to World Chain:

### Prerequisites
- The WorldID verifier contract address
- A working Uniswap V4 PoolManager contract on World Chain
- USDC and WLD token contracts on World Chain

### Deployment Steps

1. Set up your `.env` file with the necessary addresses:
```
PRIVATE_KEY=...
POOL_MANAGER_ADDRESS=0xb1860d529182ac3bc1f51fa2abd56662b7d13f33
WORLD_ID_ADDRESS=0x17B354dD2595411ff79041f930e491A4Df39A274
QUOTE_TOKEN_ADDRESS=0x79a02482a880bce3f13e09da970dc34db4cd24d1
TOKEN0_ADDRESS=0x79a02482a880bce3f13e09da970dc34db4cd24d1
TOKEN1_ADDRESS=0x2cFc85d8E48F8EAB294be644d9E25C3030863003
ETH_RPC_URL=https://worldchain.drpc.org
```

2. Deploy the hook with correct flags using our custom script:
```bash
forge script script/DeployWorldChain.s.sol --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
```

3. After deployment, update your `.env` with the deployed hook address:
```
HOOK_ADDRESS="0x..."
```

4. Create the pool:
```bash
forge script script/CreatePoolWorldChain.s.sol --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
```

5. Run these scripts sequentially - first deploy the hook, update your .env, then create the pool

5. Update your frontend config with the new contract addresses

## Important Considerations

### Hook Mining Process
For Uniswap V4 hooks to work properly, the address of the hook contract must have specific bit flags that match the hook's permissions. This is done through a process called "hook mining":

1. The HookMiner utility finds a salt value for CREATE2 deployment
2. The salt ensures the deployed contract's address will have the correct flags
3. This is why you can't simply deploy using a normal deployment process

### Testing vs. Production
- Always test on Anvil first to ensure your hook works correctly
- World Chain deployment requires real ETH for gas fees
- Make sure your environment variables are set correctly before deploying

## Troubleshooting

If you encounter issues during deployment:

1. Verify your solc version matches the Uniswap V4 requirements (0.8.20 to 0.8.26)
2. Check that you're using the correct flag for your hook (AuctionRepoHook uses `AFTER_INITIALIZE_FLAG`)
3. Ensure contract addresses in your `.env` file are correct
4. If the hook flag verification fails, check the HookMiner implementation

For more information, refer to the [Uniswap V4 documentation](https://docs.uniswap.org/contracts/v4/overview).