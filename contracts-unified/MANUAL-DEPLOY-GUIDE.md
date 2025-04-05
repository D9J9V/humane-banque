# Manual Deployment Guide for Uniswap V4 Hooks

Due to complexities in the Solidity version requirements for Uniswap V4, we recommend using the following manual deployment approach for production:

## Prerequisite

1. Installed foundry and solc 0.8.24
2. Have a wallet with ETH on World Chain
3. Configure `.env` with your contract addresses and private key

## Step 1: Use `anvil` to create a test fork of World Chain

```bash
# Start a local anvil instance forking from World Chain
anvil --fork-url https://worldchain.drpc.org
```

This will create a local environment that's a copy of World Chain, where you can test deployments without spending real ETH.

## Step 2: Deploy to the Anvil fork

```bash
# In a new terminal, deploy the hook to the anvil fork
cd contracts-unified
source .env
forge script script/DeployWorldChain.s.sol --fork-url http://localhost:8545 --broadcast -vvvv
```

Take note of the hook address from the output.

## Step 3: Create the pool on the Anvil fork

```bash
# Update .env with the hook address
echo "HOOK_ADDRESS=<your-hook-address>" >> .env
source .env

# Create the pool
forge script script/CreatePoolWorldChain.s.sol --fork-url http://localhost:8545 --broadcast -vvvv
```

## Step 4: Deploy to World Chain

If your test on the Anvil fork was successful, you can now deploy to World Chain:

```bash
# Deploy the hook
forge script script/DeployWorldChain.s.sol --rpc-url https://worldchain.drpc.org --private-key $PRIVATE_KEY --broadcast -vvvv

# Update .env with the real hook address
echo "HOOK_ADDRESS=<your-real-hook-address>" >> .env
source .env

# Create the pool
forge script script/CreatePoolWorldChain.s.sol --rpc-url https://worldchain.drpc.org --private-key $PRIVATE_KEY --broadcast -vvvv
```

## Alternative Deployment: Using cast

If you experience any issues with the forge script approach, you can use cast (foundry's command-line transaction tool) directly:

```bash
# Deploy hook
cd contracts-unified
source .env

# Need the bytecode and abi for direct deployment...
cast send --rpc-url https://worldchain.drpc.org --private-key $PRIVATE_KEY --create "$(cat artifacts/contracts/AuctionRepoHook.sol/AuctionRepoHook.json | jq -r .bytecode.object)" "$(cast abi-encode "constructor(address,address,address,address)" $POOL_MANAGER_ADDRESS $WORLD_ID_ADDRESS $QUOTE_TOKEN_ADDRESS $OWNER_ADDRESS)"
```

## Important Note

When deploying hooks for Uniswap V4, the hook address must have specific bit flags that match the hook's permissions. This is accomplished through CREATE2 deployment with a carefully chosen salt value. Make sure your deployment script properly implements this logic.