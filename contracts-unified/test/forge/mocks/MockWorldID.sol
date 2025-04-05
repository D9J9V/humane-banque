// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Simple mock for the WorldID interface
contract MockWorldID {
    // Track which proofs have been verified to prevent double-use
    mapping(uint256 => bool) public nullifierHashes;

    // Mock implementation for verification
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external view {
        // In a real implementation, this would verify a ZK proof
        // For testing, we just check that the nullifier hasn't been used
        require(!nullifierHashes[nullifierHash], "MockWorldID: nullifier hash has been used before");
        
        // We don't do any real verification in this mock
        // Just making sure parameters are non-zero for basic validation
        require(signal != address(0), "MockWorldID: invalid signal");
        require(root != 0, "MockWorldID: invalid root");
        require(nullifierHash != 0, "MockWorldID: invalid nullifier hash");
        require(proof[0] != 0, "MockWorldID: invalid proof");
    }
}