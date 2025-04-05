// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";

contract CreatePoolWorldChain is Script {
    using CurrencyLibrary for Currency;
    
    // Constants for pool initialization
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // 1:1 price
    uint24 constant POOL_FEE = 3000; // 0.3%
    int24 constant TICK_SPACING = 60;
    
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
        
        console.log("Creating pool with account:", deployer);
        
        // Get addresses from environment
        address poolManagerAddr = vm.envAddress("POOL_MANAGER_ADDRESS");
        address hookAddr = 0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000; // Hardcoded hook address from deployment
        address token0Addr = vm.envAddress("TOKEN0_ADDRESS");
        address token1Addr = vm.envAddress("TOKEN1_ADDRESS");
        
        console.log("Using addresses:");
        console.log("Pool Manager:", poolManagerAddr);
        console.log("Hook:", hookAddr);
        console.log("Token0 (USDC):", token0Addr);
        console.log("Token1 (WLD):", token1Addr);
        
        // Ensure currencies are in the correct order (address(currency0) < address(currency1))
        address currency0;
        address currency1;
        
        if (uint160(token0Addr) < uint160(token1Addr)) {
            currency0 = token0Addr;
            currency1 = token1Addr;
        } else {
            currency0 = token1Addr;
            currency1 = token0Addr;
            console.log("Swapped token order to satisfy Uniswap V4 requirements");
        }
        
        // Create pool key structure
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(hookAddr)
        });
        
        // Get pool manager
        IPoolManager poolManager = IPoolManager(poolManagerAddr);
        
        // Initialize the pool
        console.log("Initializing pool with 1:1 price...");
        poolManager.initialize(poolKey, SQRT_PRICE_1_1);
        console.log("Pool initialized successfully!");
        
        console.log("Pool creation complete!");
        console.log("You can now interact with the pool and hook at:");
        console.log("Hook address:", hookAddr);
        
        vm.stopBroadcast();
    }
}