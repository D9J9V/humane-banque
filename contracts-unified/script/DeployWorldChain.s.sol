// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AuctionRepoHook, IWorldID} from "../src/AuctionRepoHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import "./utils/HookMiner.sol";

contract DeployWorldChain is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    
    function run() external {
        // Setup deployer
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // Try as hex string
            string memory pkString = vm.envString("PRIVATE_KEY");
            if (bytes(pkString)[0] != "0" || bytes(pkString)[1] != "x") {
                pkString = string.concat("0x", pkString);
            }
            deployerPrivateKey = vm.parseUint(pkString);
        }
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        
        // Get addresses from environment
        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        address worldId = vm.envAddress("WORLD_ID_ADDRESS"); 
        address quoteToken = vm.envAddress("QUOTE_TOKEN_ADDRESS");
        address wldToken = vm.envAddress("TOKEN1_ADDRESS");
        
        console.log("Using addresses from environment:");
        console.log("Pool Manager:", poolManager);
        console.log("World ID:", worldId);
        console.log("Quote Token (USDC):", quoteToken);
        console.log("Collateral Token (WLD):", wldToken);
        
        // Compute hook address with correct flags
        uint160 flags = uint160(Hooks.AFTER_INITIALIZE_FLAG);
        bytes memory creationCode = type(AuctionRepoHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            poolManager,
            IWorldID(worldId),
            quoteToken,
            deployer
        );
        
        // Mine a salt for the proper hook address
        bytes32 salt = HookMiner.find(
            CREATE2_DEPLOYER, 
            flags, 
            creationCode, 
            constructorArgs
        );
        console.log("Found salt for hook deployment:", vm.toString(salt));
        
        // Deploy hook with the mined salt
        AuctionRepoHook hook = new AuctionRepoHook{salt: salt}(
            IPoolManager(poolManager),
            IWorldID(worldId),
            quoteToken,
            deployer
        );
        
        console.log("Deployed AuctionRepoHook:", address(hook));
        
        // Verify that the flags are correct
        uint160 expectedFlags = flags;
        uint160 actualFlags = uint160(address(hook)) & 0xFFFF;
        console.log("Hook flags: expected=0x%x, actual=0x%x", expectedFlags, actualFlags);
        require(actualFlags == expectedFlags, "Hook flags don't match");
        
        // Configure the hook
        // Allow WLD as collateral
        hook.setCollateralAllowed(wldToken, true);
        console.log("WLD added as allowed collateral");
        
        // Add markets
        uint256 timestamp = block.timestamp;
        hook.addMarket(timestamp + 30 days);
        console.log("30-day market added");
        
        hook.addMarket(timestamp + 90 days);
        console.log("90-day market added");
        
        hook.addMarket(timestamp + 180 days);
        console.log("180-day market added");
        
        console.log("Deployment and setup complete!");
        console.log("Update your .env with:");
        console.log("HOOK_ADDRESS=", vm.toString(address(hook)));
        
        vm.stopBroadcast();
    }
}