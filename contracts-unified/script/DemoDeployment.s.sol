// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {AuctionRepoHook, IWorldID} from "../src/AuctionRepoHook.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract DemoDeployment is Script {
    // Contract addresses from our deployment
    address constant AUCTION_REPO_HOOK_ADDRESS = 0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000;
    address constant USDC_ADDRESS = 0x79A02482A880bCE3F13e09Da970dC34db4CD24d1;
    address constant WLD_ADDRESS = 0x2cFc85d8E48F8EAB294be644d9E25C3030863003;
    
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
        console.log("\n--- Humane Banque Contract Info ---");
        console.log("Hook Address:", AUCTION_REPO_HOOK_ADDRESS);
        console.log("USDC Address:", USDC_ADDRESS);
        console.log("WLD Address:", WLD_ADDRESS);
        console.log("Connected Wallet:", deployer);
        
        // Get markets
        try {
            uint256 marketCount = hook.getMarketCount();
            console.log("\nAvailable Markets:", marketCount);
            
            for (uint256 i = 0; i < marketCount; i++) {
                uint256 marketExpiry = hook.getMarketById(i);
                console.log("Market #", i, ": Expires", marketExpiry);
            }
        } catch {
            console.log("Error fetching markets");
        }
        
        // Get allowed collateral
        try {
            bool isWldAllowed = hook.isCollateralAllowed(WLD_ADDRESS);
            console.log("\nWLD Allowed as Collateral:", isWldAllowed);
        } catch {
            console.log("Error checking collateral status");
        }
        
        // Check balances
        console.log("\n--- Token Balances ---");
        try {
            uint256 usdcBalance = usdc.balanceOf(deployer);
            uint256 wldBalance = wld.balanceOf(deployer);
            
            console.log("USDC Balance:", usdcBalance);
            console.log("WLD Balance:", wldBalance);
        } catch {
            console.log("Error checking balances");
        }
        
        // Check active positions
        console.log("\n--- Active Positions ---");
        try {
            uint256 loanCount = hook.getLoanCount();
            console.log("Total Loans:", loanCount);
            
            for (uint256 i = 0; i < loanCount && i < 5; i++) {
                try {
                    (
                        address borrower,
                        address collateralToken,
                        uint256 collateralAmount,
                        uint256 loanAmount,
                        uint256 marketId,
                        bool isLiquidated
                    ) = hook.getLoan(i);
                    
                    console.log("\nLoan #", i);
                    console.log("  Borrower:", borrower);
                    console.log("  Collateral Token:", collateralToken);
                    console.log("  Collateral Amount:", collateralAmount);
                    console.log("  Loan Amount:", loanAmount);
                    console.log("  Market ID:", marketId);
                    console.log("  Status:", isLiquidated ? "Liquidated" : "Active");
                } catch {
                    console.log("  Error fetching loan #", i);
                }
            }
        } catch {
            console.log("Error checking loans");
        }
        
        console.log("\nDemo complete!");
        console.log("=================================");
        
        vm.stopBroadcast();
    }
}