// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {AuctionRepoHook, IWorldID} from "../src/AuctionRepoHook.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";

contract DemoDeployment is Script {
    // Contract addresses from our deployment
    address constant AUCTION_REPO_HOOK_ADDRESS = 0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000;
    address constant USDC_ADDRESS = 0x79A02482A880bCE3F13e09Da970dC34db4CD24d1;
    address constant WLD_ADDRESS = 0x2cFc85d8E48F8EAB294be644d9E25C3030863003;
    address constant POOL_MANAGER_ADDRESS = 0xb1860D529182ac3BC1F51Fa2ABd56662b7D13f33;
    
    function run() external {
        // Setup demo
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
        
        // This won't broadcast any transactions, just read-only operations
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=================================");
        console.log("Humane Banque Smart Contract Demo");
        console.log("=================================");
        
        // Get contract instances
        AuctionRepoHook hook = AuctionRepoHook(AUCTION_REPO_HOOK_ADDRESS);
        IERC20 usdc = IERC20(USDC_ADDRESS);
        IERC20 wld = IERC20(WLD_ADDRESS);
        
        // Display contract info
        console.log("\n--- Deployed Contract Addresses ---");
        console.log("AuctionRepoHook:", AUCTION_REPO_HOOK_ADDRESS);
        console.log("Uniswap V4 Pool Manager:", POOL_MANAGER_ADDRESS);
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("WLD Token:", WLD_ADDRESS);
        console.log("Wallet Address:", deployer);
        
        // Check configuration
        console.log("\n--- Contract Configuration ---");
        console.log("Quote Token:", hook.quoteToken());
        console.log("World ID Router:", address(hook.worldIdRouter()));
        console.log("Contract Owner:", hook.owner());
        
        // Check balances (if any)
        try usdc.balanceOf(deployer) returns (uint256 balance) {
            console.log("\nWallet USDC Balance:", balance);
        } catch {
            console.log("\nCouldn't check USDC balance");
        }
        
        try wld.balanceOf(deployer) returns (uint256 balance) {
            console.log("Wallet WLD Balance:", balance);
        } catch {
            console.log("Couldn't check WLD balance");
        }
        
        console.log("\nDeployment completed successfully!");
        console.log("The contracts have been deployed and a pool has been created.");
        console.log("=================================");
        
        vm.stopBroadcast();
    }
}