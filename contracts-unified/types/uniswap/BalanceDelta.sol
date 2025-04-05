// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/// @notice Represents the balance changes for a position or swap
type BalanceDelta is int256;

/// @title Library for interacting with BalanceDelta
library BalanceDeltaLibrary {
    function amount0(BalanceDelta delta) internal pure returns (int256) {
        return 0;
    }

    function amount1(BalanceDelta delta) internal pure returns (int256) {
        return 0;
    }
}

// Extension for BalanceDelta type
library BalanceDelta_Lib {
    function wrap(int256 value) internal pure returns (BalanceDelta) {
        return BalanceDelta.wrap(value);
    }
}