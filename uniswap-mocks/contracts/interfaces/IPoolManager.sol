// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import {PoolKey} from "../libraries/PoolKey.sol";
import {BalanceDelta} from "../types/BalanceDelta.sol";

/// @notice Minimal interface for the Uniswap v4 Pool Manager for our testing purposes
interface IPoolManager {
    /// @notice Parameters for a modify position operation
    struct ModifyPositionParams {
        // The lower bound tick of the position
        int24 tickLower;
        // The upper bound tick of the position
        int24 tickUpper;
        // The amount to add, or the amount to withdraw if negative
        int256 liquidityDelta;
    }

    /// @notice Parameters for a swap operation
    struct SwapParams {
        bool zeroForOne;
        int256 amountSpecified;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Executes a swap against a pool
    function swap(
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata data
    ) external returns (BalanceDelta);

    /// @notice Mock function for oracle data - not in the real interface
    function getOracleData(PoolKey calldata key, uint32 twapInterval) external view returns (bytes memory);
}