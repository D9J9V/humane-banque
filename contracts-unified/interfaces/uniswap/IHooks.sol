// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {PoolKey} from "../../libraries/uniswap/PoolKey.sol";
import {IPoolManager} from "./IPoolManager.sol";
import {BalanceDelta} from "../../types/uniswap/BalanceDelta.sol";

/// @notice Interface for Uniswap v4 Hook contracts
interface IHooks {
    /// @notice Called before the pool is initialized
    function beforeInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called after the pool is initialized
    function afterInitialize(
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called before a position is modified
    function beforeModifyPosition(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyPositionParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called after a position is modified
    function afterModifyPosition(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyPositionParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called before a swap is executed
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called after a swap is executed
    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called before a donation is executed
    function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external returns (bytes4);

    /// @notice Called after a donation is executed
    function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external returns (bytes4);
}