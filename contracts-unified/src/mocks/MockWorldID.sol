// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title MockWorldID
 * @notice A mock implementation of WorldID for testing
 */
contract MockWorldID {
    // Verification will always succeed in this mock
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external view {
        // Mock implementation - no actual verification
        // This would normally call the zkp verifier contract
        
        // The real contract would revert if verification fails
        // This mock just returns without failing
    }
}