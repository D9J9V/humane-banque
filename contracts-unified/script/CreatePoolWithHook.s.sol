// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {LiquidityAmounts} from "v4-core/test/utils/LiquidityAmounts.sol";
import {PositionManager} from "v4-periphery/src/PositionManager.sol";
import {PoolModifyPositionRouter} from "v4-periphery/src/PoolModifyPositionRouter.sol";
import {AuctionRepoHook} from "../contracts/AuctionRepoHook.sol";

contract CreatePoolWithHook is Script {
    using CurrencyLibrary for Currency;
    
    // Constants
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // 1:1 price
    
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        address hookAddress = vm.envAddress("HOOK_ADDRESS");
        address token0Address = vm.envAddress("TOKEN0_ADDRESS");
        address token1Address = vm.envAddress("TOKEN1_ADDRESS");
        address posmAddress = vm.envAddress("POSITION_MANAGER_ADDRESS");
        
        // Configuration options
        uint24 fee = 3000; // 0.3%
        int24 tickSpacing = 60;
        
        // Get Uniswap contracts
        IPoolManager poolManager = IPoolManager(poolManagerAddress);
        PositionManager posm = PositionManager(posmAddress);
        
        // Create currency objects
        Currency currency0 = Currency.wrap(token0Address);
        Currency currency1 = Currency.wrap(token1Address);
        
        // Ensure currencies are sorted
        if (currency0.unwrap() > currency1.unwrap()) {
            (currency0, currency1) = (currency1, currency0);
        }
        
        console.log("Creating pool with:");
        console.log("  Pool Manager:", poolManagerAddress);
        console.log("  Hook:", hookAddress);
        console.log("  Currency0:", currency0.unwrap());
        console.log("  Currency1:", currency1.unwrap());
        console.log("  Fee:", fee);
        console.log("  Tick Spacing:", tickSpacing);
        
        // Create pool key
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hookAddress)
        });
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Initialize the pool
        poolManager.initialize(poolKey, SQRT_PRICE_1_1, new bytes(0));
        console.log("Pool initialized with sqrt price:", SQRT_PRICE_1_1);
        
        // Add initial liquidity if requested
        bool addLiquidity = vm.envBool("ADD_LIQUIDITY");
        if (addLiquidity) {
            uint256 token0Amount = vm.envUint("TOKEN0_AMOUNT");
            uint256 token1Amount = vm.envUint("TOKEN1_AMOUNT");
            
            console.log("Adding liquidity:");
            console.log("  Token0 Amount:", token0Amount);
            console.log("  Token1 Amount:", token1Amount);
            
            // Calculate liquidity values
            int24 tickLower = TickMath.minUsableTick(tickSpacing);
            int24 tickUpper = TickMath.maxUsableTick(tickSpacing);
            
            // Add liquidity through the position manager
            bytes memory mintParams = abi.encode(
                poolKey,
                tickLower,
                tickUpper,
                token0Amount,
                token1Amount,
                0, // Min amount 0
                0, // Min amount 1
                address(this),
                new bytes(0) // Hook data
            );
            
            posm.mint(mintParams, block.timestamp + 3600);
            console.log("Liquidity added successfully");
        }
        
        vm.stopBroadcast();
    }
}