// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Mock World ID Router
 * @dev A simple mock implementation of the World ID Router for testing purposes.
 */
contract MockWorldID {
    /// @notice Mock implementation that always returns successful
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external pure {
        // The real implementation would verify ZK proofs
        // For testing, we just need this to not revert
        // Do some simple validation to ensure arguments were provided
        require(signal != address(0), "MockWorldID: signal cannot be zero address");
        require(nullifierHash != 0, "MockWorldID: nullifierHash cannot be zero");
        
        // No reverts means verification is successful
    }
}