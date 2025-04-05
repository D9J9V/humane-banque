// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";

/**
 * @title MockPoolManager
 * @notice A simple mock PoolManager for testing
 */
contract MockPoolManager {
    // Mock function for initialize
    function initialize(PoolKey calldata key, uint160 sqrtPriceX96, bytes calldata hookData) external returns (int24 tick) {
        // Mock implementation - just return a default tick
        return 0;
    }
    
    // Add other mock functions as needed for testing
    function swap(PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        returns (BalanceDelta)
    {
        // Mock implementation - return a default BalanceDelta
        return BalanceDelta.wrap(0);
    }
    
    function modifyPosition(PoolKey calldata, IPoolManager.ModifyPositionParams calldata, bytes calldata)
        external
        returns (BalanceDelta)
    {
        // Mock implementation - return a default BalanceDelta
        return BalanceDelta.wrap(0);
    }
}