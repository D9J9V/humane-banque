# Next Steps for AuctionRepoHook Development

Based on feedback from Uniswap developers, we've created a roadmap for enhancing our hook implementation and testing to align with Uniswap v4 best practices.

## Current Implementation

- We have a working AuctionRepoHook contract that implements lending/borrowing with auction-based rate discovery.
- We have basic JS tests that validate the core functionality.
- We've set up the foundation for Forge testing to better integrate with Uniswap's testing patterns.

## Technical Roadmap

### 1. Complete Forge Testing Setup (Priority: High)

- [x] Create basic Forge test structure and files
- [x] Implement mock contracts for testing
- [x] Set up test utilities (HookMiner, etc.)
- [ ] Fix import path issues by properly installing v4-core and v4-periphery
- [ ] Get all tests passing with Forge

```bash
# To complete this step
cd contracts-unified
forge install foundry-rs/forge-std uniswap/v4-core uniswap/v4-periphery
forge test -vv
```

### 2. Hook Integration Testing (Priority: High)

- [ ] Test the hook with a real Uniswap V4 PoolManager
- [ ] Test pool initialization with the hook
- [ ] Test hook permissions and callbacks
- [ ] Validate hook state changes during pool operations

Specific tasks:
1. Ensure afterInitialize callback works properly
2. Test hook's view into pool state
3. Test pool key storage and validation

### 3. Liquidation via Uniswap Swaps (Priority: Medium)

- [ ] Implement real Uniswap V4 swap functionality in liquidation logic
- [ ] Use PoolManager.swap() in _liquidateCollateral() instead of mocking
- [ ] Test various liquidation scenarios with real pools

Key implementation details:
```solidity
function _liquidateCollateral(
    address collateralToken,
    uint256 collateralAmount,
    uint256 debtAmount
) internal returns (uint256 collateralSold, uint256 quoteReceived) {
    // 1. Approve the poolManager to use the collateral
    IERC20(collateralToken).approve(address(poolManager), collateralAmount);
    
    // 2. Create swap params
    PoolKey memory key = poolKey;
    IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
        zeroForOne: Currency.unwrap(key.currency0) == quoteToken,
        amountSpecified: -int256(debtAmount), // Negative = exact output
        sqrtPriceLimitX96: 0 // No price limit
    });
    
    // 3. Call swap
    BalanceDelta delta = poolManager.swap(key, params, new bytes(0));
    
    // 4. Calculate amounts
    collateralSold = uint256(Currency.unwrap(key.currency0) == collateralToken ? 
        delta.amount0() : delta.amount1());
    quoteReceived = debtAmount;
    
    return (collateralSold, quoteReceived);
}
```

### 4. Hook Address Mining (Priority: Medium)

- [ ] Properly implement hook address mining for deployments
- [ ] Test deployments with derived addresses
- [ ] Integrate with CI/CD pipeline for automated tests

Implementation in the deployment script:
```solidity
// Find hook address with correct flags
bytes32 salt = HookMiner.find(
    CREATE2_FACTORY_ADDRESS,
    uint160(Hooks.AFTER_INITIALIZE_FLAG),
    type(AuctionRepoHook).creationCode,
    abi.encode(poolManager, worldId, quoteToken, owner)
);

// Deploy the hook with the correct salt
AuctionRepoHook hook = new AuctionRepoHook{salt: salt}(
    poolManager,
    worldId,
    quoteToken,
    owner
);
```

### 5. End-to-End Testing (Priority: High)

- [ ] Create a comprehensive test scenario that includes:
  - Hook deployment with proper flags
  - Pool creation with the hook
  - Liquidity provision
  - Lending and borrowing operations
  - Auction execution
  - Loan lifecycle (claim, repay, liquidate)

### 6. Oracle Integration (Priority: Medium)

- [ ] Replace hardcoded collateral valuation with real Uniswap TWAP
- [ ] Implement proper price oracle using pool manager
- [ ] Test oracle data retrieval and calculation

Current placeholder to improve:
```solidity
function _getCollateralValueUSD(address collateralToken, uint256 amount) internal view returns (uint256) {
    // Instead of hardcoded values, use Uniswap V4 TWAP:
    bytes memory oracleData = poolManager.getOracleData(poolKey, TWAP_INTERVAL);
    // Process the oracleData to get the price...
    return calculateValueFromOracle(oracleData, amount);
}
```

### 7. Gas Optimization (Priority: Low)

- [ ] Measure gas usage with Foundry's gas reporting
- [ ] Optimize auction matching algorithm
- [ ] Reduce storage operations where possible

```bash
# To run gas analysis
forge test --gas-report
```

## Testing Checklist

- [ ] All Forge tests pass
- [ ] Hook permissions are correctly verified
- [ ] Pool lifecycle is tested (init, liquidity, swap)
- [ ] Auction mechanism works with real tokens
- [ ] Liquidation works with real swaps
- [ ] Oracle price feeds are properly tested
- [ ] Edge cases and failure scenarios are covered

## Deployment Considerations

- The hook address must have specific bits to match the hook permissions flags
- Deployment scripts should automate hook address mining
- Deployment should include proper initialization and setup of initial markets
- Consider using CREATE2 deployer for deterministic addresses