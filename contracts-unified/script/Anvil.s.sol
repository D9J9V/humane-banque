// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/mocks/MockERC20.sol";
import "../contracts/mocks/MockWorldID.sol";
import "../contracts/mocks/MockPoolManager.sol";
import "../contracts/AuctionRepoHook.sol";
import "./utils/HookMiner.sol";

contract AnvilScript is Script {
    // Constants for deployment
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // 1:1 price
    uint24 constant POOL_FEE = 3000; // 0.3% fee tier
    int24 constant TICK_SPACING = 60;
    
    // For CREATE2 deployment
    address constant CREATE2_DEPLOYER = address(0x4e59b44847b379578588920cA78FbF26c0B4956C);
    
    function run() public {
        // Use the default Anvil private key for deployment
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        // Start broadcast for deployment transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Mock Dependencies
        console.log("Deploying mock contracts...");
        
        // Deploy mock pool manager
        MockPoolManager poolManager = new MockPoolManager();
        console.log("MockPoolManager deployed at:", address(poolManager));
        
        // Deploy mock tokens
        MockERC20 quoteToken = new MockERC20("USD Coin", "USDC", 6);
        console.log("Quote Token (USDC) deployed at:", address(quoteToken));
        
        MockERC20 collateralToken = new MockERC20("Worldcoin", "WLD", 18);
        console.log("Collateral Token (WLD) deployed at:", address(collateralToken));
        
        // Deploy mock WorldID
        MockWorldID worldId = new MockWorldID();
        console.log("MockWorldID deployed at:", address(worldId));
        
        // 2. Deploy AuctionRepoHook
        console.log("Deploying AuctionRepoHook...");
        AuctionRepoHook hook = new AuctionRepoHook(
            IPoolManager(address(poolManager)),
            address(worldId),
            address(quoteToken),
            deployer
        );
        console.log("AuctionRepoHook deployed at:", address(hook));
        
        // 3. Configure the hook
        // Allow collateral token
        hook.setCollateralAllowed(address(collateralToken), true);
        console.log("Collateral token added");
        
        // Add markets
        uint256 timestamp = block.timestamp;
        hook.addMarket(timestamp + 30 days);
        console.log("30-day market added");
        
        hook.addMarket(timestamp + 90 days);
        console.log("90-day market added");
        
        hook.addMarket(timestamp + 180 days);
        console.log("180-day market added");
        
        // 4. Mint tokens for testing
        quoteToken.mint(deployer, 10000 * 10**6); // 10,000 USDC
        collateralToken.mint(deployer, 1000 * 10**18); // 1,000 WLD
        console.log("Tokens minted for testing");
        
        // 5. Output deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("PoolManager:", address(poolManager));
        console.log("WorldID:", address(worldId));
        console.log("Quote Token (USDC):", address(quoteToken));
        console.log("Collateral Token (WLD):", address(collateralToken));
        console.log("AuctionRepoHook:", address(hook));
        
        console.log("\nEnvironment values for .env file:");
        console.log("POOL_MANAGER_ADDRESS=" + vm.toString(address(poolManager)));
        console.log("WORLD_ID_ADDRESS=" + vm.toString(address(worldId)));
        console.log("QUOTE_TOKEN_ADDRESS=" + vm.toString(address(quoteToken)));
        console.log("TOKEN0_ADDRESS=" + vm.toString(address(quoteToken)));
        console.log("TOKEN1_ADDRESS=" + vm.toString(address(collateralToken)));
        console.log("HOOK_ADDRESS=" + vm.toString(address(hook)));
        
        vm.stopBroadcast();
    }
}