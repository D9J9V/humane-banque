# Humane Banque Contracts

This directory contains all Solidity contracts and related files for the Humane Banque project.

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
2. Compile contracts: `npx hardhat compile`
3. Run tests: `npx hardhat test`
4. Deploy: `npx hardhat run scripts/deploy.js`