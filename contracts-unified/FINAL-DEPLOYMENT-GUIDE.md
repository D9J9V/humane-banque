# Final Deployment Guide for Humane Banque

Due to version incompatibilities between our project (Solidity 0.8.20) and Uniswap V4 (Solidity 0.8.24+), we need to use a different deployment approach than initially planned.

## Option 1: Update Project Solidity Version

Update the entire project to use Solidity 0.8.26:

1. Modify all contract files to use `pragma solidity ^0.8.26;`
2. Update `foundry.toml` to use solc_version = "0.8.26"
3. Recompile and deploy using the forge scripts

## Option 2: Use Hardhat for Deployment

The hardhat environment might be more flexible with version management:

```bash
cd contracts-unified
npx hardhat compile
npx hardhat run scripts/deploy.js --network worldchain
# Update .env with hook address from output
npx hardhat run scripts/create-pool.js --network worldchain
```

## Option 3: Manual Deployment to World Chain

For a direct approach without version issues:

1. Navigate to the Uniswap V4 dashboard on World Chain
2. Use the official Uniswap V4 hook creation interface
3. Upload your contract through the UI
4. Configure the hook permissions and deploy

## Important: Hook Flag Requirement

Regardless of which method you choose, remember that Uniswap V4 hooks MUST have addresses with specific bit flags that match their permissions. This is typically accomplished through:

1. CREATE2 deployment
2. Salt mining to find an address with the right flags
3. Hook permission flags set in the address's lower bytes

Without these flags, the hook will not work with Uniswap V4 pools.

## Post-Deployment

After deployment:
1. Update frontend with new contract addresses
2. Test basic lending and borrowing flows
3. Monitor for any issues

## Need Further Assistance?

If you need help with deployment, consider:
1. Consulting the Uniswap V4 documentation
2. Requesting help from Uniswap/World developers
3. Using a specialized deployment service that can handle version incompatibilities