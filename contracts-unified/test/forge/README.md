# AuctionRepoHook Forge Testing

This directory contains the Forge testing setup for the AuctionRepoHook contract, designed to follow Uniswap v4-template testing patterns.

## Current Implementation Status

We've set up the foundational structure for Forge testing of the AuctionRepoHook contract:

1. **Testing Environment**:
   - Created a test version of AuctionRepoHook in `AuctionRepoHookTest.sol` to handle different import paths
   - Added mock implementations (MockERC20, MockWorldID)
   - Created utility libraries (HookMiner, TickMath)
   - Implemented a complete test file in `AuctionRepoHook.t.sol`

2. **Test Coverage**:
   - Basic contract initialization and hook permissions
   - Lending/borrowing lifecycle (offers, requests, auction)
   - Loan management (claim, repay, liquidate)
   - Blacklist management

3. **Deployment Scripts**:
   - Created deployment scripts in `/scripts/` directory
   - Added hook address mining for proper hook flags

## Next Steps

To continue development:

1. **Install Foundry and Run Tests**:
   ```bash
   # Install Foundry if not already installed
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Install dependencies
   cd /Users/d9j9v/Code/humane-banque/contracts-unified
   forge install
   
   # Run tests
   forge test -vv
   ```

2. **Fix Import Issues**:
   - The current setup uses local versions of Uniswap v4 interfaces and libraries in our test files
   - To use actual v4-core/v4-periphery, properly install them with forge

3. **Enhance Test Coverage**:
   - Add integration tests with real Uniswap v4 components
   - Test poolKey initialization with different parameters
   - Add edge cases and failure scenarios
   - Test the hook's TWAP integration for liquidations

4. **Implement Hook Address Mining**:
   - Enhance the HookMiner utility for deploying hooks with correct address flags
   - Test the deployment process with proper CREATE2 deployments

## Project Structure

```
test/forge/
├── AuctionRepoHook.t.sol       # Main test file for AuctionRepoHook
├── AuctionRepoHookTest.sol     # Testing implementation of AuctionRepoHook with adjusted imports
├── mocks/
│   ├── MockERC20.sol           # Mock ERC20 token for testing
│   └── MockWorldID.sol         # Mock WorldID verifier
└── utils/
    ├── EasyPosm.sol            # Helper library for PositionManager interaction
    ├── Fixtures.sol            # Test fixtures for setting up test environment
    ├── HookMiner.sol           # Utility for mining hook addresses with correct flags
    └── TickMath.sol            # Simplified TickMath implementation for testing

script/
├── DeployAuctionRepoHook.s.sol # Script for deploying the hook
└── CreatePoolWithHook.s.sol    # Script for creating a pool with the hook
```

## Key Improvements from v4-template

Following Uniswap's v4-template approach, we need to enhance:

1. **Solid Hook Validation**: Test all hook callbacks properly
2. **Real Pool Integration**: Test with actual Uniswap V4 pool instead of mocks
3. **Hook Address Mining**: Implement proper address derivation with hook flags
4. **End-to-End Testing**: Test the full lifecycle with pool initialization, liquidity provision, and swaps

## Current Test Files

- **AuctionRepoHook.t.sol**: The main test file covering all functionality
- **AuctionRepoHookTest.sol**: Testing implementation with adjusted import paths

## Commands for Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test
forge test --match-test testAuctionMechanism -vv

# Run tests with gas reporting
forge test --gas-report
```

## Debugging Tips

1. **Import Issues**: Most issues are likely to be import-related. Check paths in remappings.txt.
2. **Fork Dependencies**: For advanced tests, consider forking from mainnet using Foundry's forking capabilities.
3. **Hook Validation**: Use proper address flags when deploying hooks.