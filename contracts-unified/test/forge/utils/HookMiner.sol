// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HookMiner
/// @notice Provides a function to find a salt that will produce a hook address with specific flags
library HookMiner {
    /// @notice Computes the hook address for a given salt and initcode
    /// @param deployer The address that will deploy the hook
    /// @param salt The salt used in the CREATE2 deployment
    /// @param initcodeHash The hash of the initcode that will be used to deploy the hook
    /// @return hookAddress The address where the hook will be deployed
    function computeAddress(address deployer, bytes32 salt, bytes32 initcodeHash) internal pure returns (address hookAddress) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            deployer,
            salt,
            initcodeHash
        )))));
    }

    /// @notice Finds a salt that will produce a hook address with specific flags
    /// @param deployer The address that will deploy the hook
    /// @param flags The desired flags in the hook address
    /// @param initcode The initcode that will be used to deploy the hook
    /// @param constructorArgs The constructor arguments to pass to the hook constructor
    /// @param seedStart The starting seed for the salt search
    /// @param numIterations The number of iterations to search for a salt
    /// @return salt The salt that will produce a hook address with the specified flags
    function find(
        address deployer,
        uint160 flags,
        bytes memory initcode,
        bytes memory constructorArgs,
        uint256 seedStart,
        uint256 numIterations
    ) internal pure returns (bytes32 salt) {
        // Hash the initcode plus constructor args
        bytes32 initcodeHash = keccak256(abi.encodePacked(initcode, constructorArgs));
        
        uint256 seed = seedStart;
        address hookAddress;
        
        // Search for a salt that produces an address with the desired flags
        for (uint256 i = 0; i < numIterations; i++) {
            salt = bytes32(seed);
            hookAddress = computeAddress(deployer, salt, initcodeHash);
            
            // Check if the last 20 bits of the address match the desired flags
            if (uint160(hookAddress) & 0xFFFF == flags) {
                return salt;
            }
            
            seed++;
        }
        
        // If we get here, no salt was found
        revert("HookMiner: could not find a salt matching the desired flags");
    }

    /// @notice Simplified version of find with default parameters
    /// @param deployer The address that will deploy the hook
    /// @param flags The desired flags in the hook address
    /// @param initcode The initcode that will be used to deploy the hook
    /// @param constructorArgs The constructor arguments to pass to the hook constructor
    /// @return salt The salt that will produce a hook address with the specified flags
    function find(
        address deployer,
        uint160 flags,
        bytes memory initcode,
        bytes memory constructorArgs
    ) internal pure returns (bytes32) {
        return find(deployer, flags, initcode, constructorArgs, 0, 1000000);
    }
}