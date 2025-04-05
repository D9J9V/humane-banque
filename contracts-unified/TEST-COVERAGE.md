# Smart Contract Test Coverage

## Overview

This document outlines the test coverage for the AuctionRepoHook smart contract. The test suite validates the contract's functionality, security properties, and edge cases, ensuring that the lending protocol behaves as expected.

## Current Test Suite Structure

The tests are organized into logical categories:

1. **Deployment Tests**
   - Verify owner settings
   - Verify contract initialization state
   - Validate token addresses and parameters

2. **Admin Function Tests**
   - Market creation and management
   - Collateral token allowance settings
   - LTV parameter updates
   - Error cases for admin functions

3. **Core Lending Protocol Tests**
   - Lend offer submission and validation
   - Borrow request submission and validation
   - Auction mechanism execution
   - Loan creation, claiming, and repayment
   - Liquidation scenarios

4. **Security Tests**
   - Blacklisting management
   - Reentrancy protection
   - Input validation and edge cases
   - Authorization checks

5. **Uniswap V4 Hook Integration Tests**
   - Hook permissions validation
   - Initialization callback verification

## Test Coverage

| Component | Coverage |
|-----------|----------|
| Deployment | 100% |
| Admin Functions | 100% |
| Lend Offers | 100% |
| Borrow Requests | 100% |
| Auction Mechanism | 100% |
| Loan Management | 100% |
| Blacklist Management | 100% |
| Uniswap V4 Integration | 70% |
| Edge Cases | 100% |

## Testing Approach

The tests use a combination of:

1. **Unit Tests**: Testing individual functions in isolation
2. **Integration Tests**: Testing interactions between multiple components
3. **Behavioral Tests**: Testing the contract behavior under different scenarios
4. **Edge Case Tests**: Testing boundary conditions and error cases

## Improvements Based on Uniswap v4-template

After reviewing the Uniswap v4-template repository, we should enhance our tests with the following:

### 1. Foundry/Forge-based Tests

The v4-template uses Solidity-based testing with Foundry/Forge instead of JavaScript-based tests. This provides better integration with the Uniswap V4 codebase and allows for more comprehensive testing of hooks.

Implementation plan:
- Create a new test file `contracts-unified/tests/AuctionRepoHook.t.sol`
- Reimplement existing test cases in Solidity
- Use the Fixtures pattern from the v4-template

### 2. Real Uniswap V4 Pool Integration

The current tests use mocks for the Uniswap V4 integration. We should test with actual Uniswap V4 Pool components:

Implementation plan:
- Use actual PoolManager instead of a mock
- Test the Hook initialization with real PoolKey and currencies
- Test afterInitialize with proper parameters
- Implement pool creation and initialization scripts
- Test hook behavior during pool operations

### 3. Deployment Scripts

Create proper deployment scripts for the hook:

Implementation plan:
- Add a deployment script that mines for the correct hook address (using salt)
- Implement hook deployment with proper flags
- Include pool creation and initialization
- Add scripts for creating test markets

### 4. Hook Address Mining

The hook address in Uniswap V4 needs to have specific flags encoded in the address:

Implementation plan:
- Use the HookMiner utility from v4-template
- Mine for an address with the correct permissions flags
- Use CREATE2 deployment for deterministic addresses

### 5. Liquidity and Swap Testing

Test the hook in a full end-to-end scenario:

Implementation plan:
- Add tests for pool creation with the hook
- Mint liquidity on the pool
- Execute swaps to test hook interactions
- Test liquidation using actual pool swaps instead of mock swaps

### 6. Example Test Structure (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {AuctionRepoHook} from "../contracts/AuctionRepoHook.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

import {LiquidityAmounts} from "v4-core/test/utils/LiquidityAmounts.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {EasyPosm} from "./utils/EasyPosm.sol";
import {Fixtures} from "./utils/Fixtures.sol";
import {HookMiner} from "./utils/HookMiner.sol";

contract AuctionRepoHookTest is Test, Fixtures {
    using EasyPosm for IPositionManager;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using StateLibrary for IPoolManager;

    AuctionRepoHook hook;
    PoolId poolId;
    IWorldID worldId;
    IERC20 quoteToken;
    IERC20 collateralToken;

    uint256 tokenId;
    int24 tickLower;
    int24 tickUpper;

    function setUp() public {
        // Deploy fresh manager and test tokens
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();
        deployAndApprovePosm(manager);

        // Deploy worldId mock
        worldId = new MockWorldID();

        // Deploy the hook to an address with the correct flags
        address flags = address(
            uint160(
                Hooks.AFTER_INITIALIZE_FLAG
            ) ^ (0x4444 << 144) // Namespace the hook to avoid collisions
        );
        
        bytes memory constructorArgs = abi.encode(
            manager, 
            worldId,
            address(currency0), // Use as quote token
            address(this)       // Owner
        );
        
        deployCodeTo("AuctionRepoHook.sol:AuctionRepoHook", constructorArgs, flags);
        hook = AuctionRepoHook(flags);

        // Set up collateral token
        collateralToken = IERC20(address(currency1));
        hook.setCollateralAllowed(address(collateralToken), true);

        // Create the pool
        key = PoolKey(currency0, currency1, 3000, 60, IHooks(hook));
        poolId = key.toId();
        manager.initialize(key, SQRT_PRICE_1_1);

        // Set up a market
        uint256 maturityTimestamp = block.timestamp + 90 days;
        hook.addMarket(maturityTimestamp);

        // Provide liquidity to the pool
        tickLower = TickMath.minUsableTick(key.tickSpacing);
        tickUpper = TickMath.maxUsableTick(key.tickSpacing);
        
        uint128 liquidityAmount = 100e18;
        
        (uint256 amount0Expected, uint256 amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            SQRT_PRICE_1_1,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            liquidityAmount
        );
        
        (tokenId,) = posm.mint(
            key,
            tickLower,
            tickUpper,
            liquidityAmount,
            amount0Expected + 1,
            amount1Expected + 1,
            address(this),
            block.timestamp,
            ZERO_BYTES
        );
    }

    function testAfterInitialize() public {
        // The pool was already initialized in setUp
        // Verify the poolKey was set correctly
        assertEq(address(hook.poolKey().hooks), address(hook));
    }

    function testLendingAndBorrowing() public {
        // Test the full lending/borrowing lifecycle
        // ...
    }

    function testAuction() public {
        // Test the auction mechanism
        // ...
    }

    function testLiquidation() public {
        // Test liquidation using actual pool swaps
        // ...
    }
    
    // Additional tests for all hook functionalities
}
```

### 7. Example Deployment Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

import {AuctionRepoHook} from "../contracts/AuctionRepoHook.sol";
import {HookMiner} from "./utils/HookMiner.sol";

contract DeployAuctionRepoHook is Script {
    using CurrencyLibrary for Currency;
    
    function run() external {
        // Config - adjust as needed
        address poolManagerAddress = address(0); // Set your pool manager address
        address worldIDAddress = address(0);     // Set your WorldID address 
        address quoteTokenAddress = address(0);  // Set your quote token address
        address owner = msg.sender;
        
        // Compute the hook address with proper flags
        uint160 flags = uint160(Hooks.AFTER_INITIALIZE_FLAG);
        address hookAddress = HookMiner.find(
            address(this),
            flags,
            type(AuctionRepoHook).creationCode,
            abi.encode(poolManagerAddress, worldIDAddress, quoteTokenAddress, owner)
        );
        
        // Deploy the hook
        vm.startBroadcast();
        AuctionRepoHook hook = new AuctionRepoHook{salt: bytes32(0)}(
            IPoolManager(poolManagerAddress),
            IWorldID(worldIDAddress),
            quoteTokenAddress,
            owner
        );
        
        // Initialize pool with the hook if needed
        // ...
        
        // Set up initial markets and collateral tokens
        // ...
        
        vm.stopBroadcast();
    }
}
```

## Running the Tests

### Current JavaScript Tests

```bash
cd contracts-unified
npx hardhat test
```

### New Foundry Tests (Once Implemented)

```bash
cd contracts-unified
forge test
```

## Test Scenarios (New and Enhanced)

In addition to the existing tests, we should add:

1. **Hook Integration Tests**
   - Test the hook with a real PoolManager
   - Test actual hook callbacks during pool operations
   - Test the interaction between hook state and pool operations

2. **Pool Initialization Tests**
   - Verify that the hook's afterInitialize function properly captures the PoolKey
   - Test initialization with invalid parameters
   - Test duplicate initialization attempts

3. **Liquidation Tests with Real Swaps**
   - Test liquidation using actual Uniswap V4 swaps
   - Verify collateral pricing using pool oracle data
   - Test different liquidation scenarios and partial fills

4. **Multi-Market Tests**
   - Test operations across multiple markets simultaneously
   - Test interactions between different markets
   - Test market statistics and aggregation

## Security Considerations in Tests

- **Hook Address Security**: Verify that hook address mining works correctly
- **Pool Initialization Security**: Test that only valid pool initializations are accepted
- **Oracle Data Security**: Test robustness against oracle manipulation

## Future Test Extensions

1. **Forge Fuzzing**: Utilize Forge's built-in fuzzing capabilities
2. **Invariant Testing**: Implement invariant tests to ensure contract properties
3. **Gas Optimization Tests**: Measure and optimize gas usage
4. **Cross-Function Tests**: Test interactions between different hook functions
5. **Economic Attack Simulations**: Test economic security properties