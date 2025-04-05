// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/// @notice Minimal type for Currency for our testing purposes
type Currency is address;

/// @title Library for Currency utilities
library CurrencyLibrary {
    /// @notice Returns the address unwrapped from Currency
    function unwrap(Currency currency) internal pure returns (address) {
        return Currency.unwrap(currency);
    }
}