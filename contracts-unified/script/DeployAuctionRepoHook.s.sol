// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {HookMiner} from "../test/forge/utils/HookMiner.sol";
import {AuctionRepoHook} from "../contracts/AuctionRepoHook.sol";

contract DeployAuctionRepoHook is Script {
    using CurrencyLibrary for Currency;
    
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        address worldIDAddress = vm.envAddress("WORLD_ID_ADDRESS");
        address quoteTokenAddress = vm.envAddress("QUOTE_TOKEN_ADDRESS");
        address ownerAddress = vm.envAddress("OWNER_ADDRESS");
        
        // If not provided, use default addresses (useful for local testing)
        if (poolManagerAddress == address(0)) poolManagerAddress = 0x8888888888888888888888888888888888888888;
        if (worldIDAddress == address(0)) worldIDAddress = 0x9999999999999999999999999999999999999999;
        if (quoteTokenAddress == address(0)) quoteTokenAddress = 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;
        if (ownerAddress == address(0)) ownerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying AuctionRepoHook with config:");
        console.log("  Pool Manager:", poolManagerAddress);
        console.log("  WorldID:", worldIDAddress);
        console.log("  Quote Token:", quoteTokenAddress);
        console.log("  Owner:", ownerAddress);
        
        // Hook flags - only afterInitialize is used
        uint160 flags = uint160(Hooks.AFTER_INITIALIZE_FLAG);
        
        // Compute hook address with correct flags
        bytes memory constructorArgs = abi.encode(
            poolManagerAddress,
            worldIDAddress,
            quoteTokenAddress,
            ownerAddress
        );
        
        bytes32 salt = bytes32(uint256(0));
        
        // In production, find salt using HookMiner.find to create address with correct flags:
        // salt = HookMiner.find(CREATE2_DEPLOYER, flags, type(AuctionRepoHook).creationCode, constructorArgs);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy hook with the salt
        AuctionRepoHook hook = new AuctionRepoHook{salt: salt}(
            IPoolManager(poolManagerAddress),
            worldIDAddress,
            quoteTokenAddress,
            ownerAddress
        );
        
        console.log("AuctionRepoHook deployed to:", address(hook));
        
        // If this is a test environment, you could automatically set up a market and collateral
        if (block.chainid == 31337) { // Anvil/Hardhat local chain ID
            console.log("Setting up test configuration...");
            
            // Set up a market with 90-day maturity
            uint256 maturityTimestamp = block.timestamp + 90 days;
            hook.addMarket(maturityTimestamp);
            console.log("Created market with maturity:", maturityTimestamp);
            
            // Allow a mock collateral token (would need to be set for real scenario)
            // hook.setCollateralAllowed(mockCollateralToken, true);
        }
        
        vm.stopBroadcast();
    }
}