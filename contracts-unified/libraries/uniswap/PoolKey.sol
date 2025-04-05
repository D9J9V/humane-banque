// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {Currency} from "./CurrencyLibrary.sol";

/// @notice Represents the pool key used to fetch or create a pool
struct PoolKey {
    // The contract that deployed the pool, which receives pool fees
    address poolDeployer;
    // The address of a hook contract for this pool
    address hooks;
    // The two tokens in the pool
    Currency currency0;
    Currency currency1;
    // The pool fee, in hundredths of a bip
    uint24 fee;
    // Ticks can only be initialized after they are multiples of this value
    int24 tickSpacing;
}