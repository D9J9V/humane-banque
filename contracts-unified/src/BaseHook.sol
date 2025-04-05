// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

// Define a simpler version without inheritance for our specific needs
abstract contract BaseHook {
    IPoolManager public immutable poolManager;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    // Each contract needs to implement this
    function getHookPermissions() public pure virtual returns (Hooks.Permissions memory);

    // For simplicity in our implementation
    function afterInitialize(PoolKey calldata, uint160, int24, bytes calldata) external virtual returns (bytes4) {
        return this.afterInitialize.selector;
    }
    
    // The following are simplified stubs for our purposes
    function beforeInitialize(address, PoolKey calldata, uint160, bytes calldata) external virtual returns (bytes4) {
        return this.beforeInitialize.selector;
    }

    function beforeModifyPosition(address, PoolKey calldata, IPoolManager.ModifyPositionParams calldata, bytes calldata) external virtual returns (bytes4) {
        return this.beforeModifyPosition.selector;
    }

    function afterModifyPosition(address, PoolKey calldata, IPoolManager.ModifyPositionParams calldata, BalanceDelta, bytes calldata) external virtual returns (bytes4) {
        return this.afterModifyPosition.selector;
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata) external virtual returns (bytes4) {
        return this.beforeSwap.selector;
    }

    function afterSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata) external virtual returns (bytes4) {
        return this.afterSwap.selector;
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external virtual returns (bytes4) {
        return this.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external virtual returns (bytes4) {
        return this.afterDonate.selector;
    }
}