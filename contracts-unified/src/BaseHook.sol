// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "v4-core/types/BeforeSwapDelta.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

// Minimal version of BaseHook for testing
abstract contract BaseHook {
    IPoolManager public immutable poolManager;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    // Each contract needs to implement this
    function getHookPermissions() public pure virtual returns (Hooks.Permissions memory);

    // Only implement afterInitialize for simplicity
    function afterInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96, int24 tick) 
        external virtual returns (bytes4);
}