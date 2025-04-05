# Humane Banque Contracts

This directory contains all Solidity contracts and related files for the Humane Banque project.

## Deployment Status

**Successfully Deployed to World Chain!**

1. **Smart Contract Deployment Success**:
   - AuctionRepoHook deployed to: `0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000`
   - Pool created and initialized

2. **Contract Configuration**:
   - Quote Token (USDC): `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
   - World ID Router: `0x17B354dD2595411ff79041f930e491A4Df39A278`
   - Contract Owner: `0x2f131a86C5CB54685f0E940B920c54E152a44B02`

3. **Pool Information**:
   - Pool Manager: `0xb1860D529182ac3BC1F51Fa2ABd56662b7D13f33`
   - WLD Token: `0x2cFc85d8E48F8EAB294be644d9E25C3030863003`

To view deployment details, run:
```
forge script script/DemoDeployment.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public -vvvv
```

## Directory Structure

- `contracts/` - Core smart contracts 
- `interfaces/` - Contract interfaces
  - `uniswap/` - Uniswap V4 interfaces
- `libraries/` - Helper libraries
  - `uniswap/` - Uniswap V4 libraries
- `mocks/` - Mock contracts for testing
- `types/` - Type definitions
  - `uniswap/` - Uniswap V4 types
- `tests/` - Test files
- `scripts/` - Deployment and utility scripts
- `artifacts/` - Compiled contract artifacts

## Development

1. Install dependencies: `pnpm install`
2. Compile contracts: `npx hardhat compile` or `forge build`
3. Run tests: `npx hardhat test` or `forge test`
4. Deploy: Follow instructions in DEPLOYMENT-GUIDE.md