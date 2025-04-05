// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @title Library for hook flags and manipulation
library Hooks {
    /// @notice Return a struct with flags for all of the possible hooks
    struct Permissions {
        bool beforeInitialize;
        bool afterInitialize;
        bool beforeModifyPosition;
        bool afterModifyPosition;
        bool beforeSwap;
        bool afterSwap;
        bool beforeDonate;
        bool afterDonate;
    }
}