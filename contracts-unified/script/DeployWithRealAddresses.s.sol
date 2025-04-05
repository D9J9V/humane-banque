// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "forge-std/Script.sol";
import {AuctionRepoHook} from "../src/AuctionRepoHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import "../src/mocks/MockWorldID.sol";
import "../src/mocks/MockERC20.sol";

// Addresses for Uniswap V4 periphery tools
import {HookMiner} from "./utils/HookMiner.sol";

contract DeployWithRealAddresses is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    
    // These would be replaced with the real mainnet/testnet addresses
    address constant UNISWAP_POOL_MANAGER = 0x0000000000000000000000000000000000000000; // Replace with real address
    address constant WORLD_ID_ROUTER = 0x0000000000000000000000000000000000000000; // Replace with real address
    address constant USDC = 0x0000000000000000000000000000000000000000; // Replace with real address
    address constant WLD = 0x0000000000000000000000000000000000000000; // Replace with real address
    
    function run() external {
        // Setup deployer
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        
        // For testnet, we deploy mock contracts if addresses are zero
        // In production, use the actual addresses
        address poolManager = UNISWAP_POOL_MANAGER;
        address worldId = WORLD_ID_ROUTER;
        address quoteToken = USDC;
        
        if (poolManager == address(0)) {
            // Testing mode - deploy mock contracts
            MockPoolManager mockPoolManager = new MockPoolManager();
            poolManager = address(mockPoolManager);
            console.log("Deployed MockPoolManager:", poolManager);
        }
        
        if (worldId == address(0)) {
            // Testing mode - deploy mock WorldID
            MockWorldID mockWorldId = new MockWorldID();
            worldId = address(mockWorldId);
            console.log("Deployed MockWorldID:", worldId);
        }
        
        if (quoteToken == address(0)) {
            // Testing mode - deploy mock USDC
            MockERC20 mockUSDC = new MockERC20("USD Coin", "USDC", 6);
            quoteToken = address(mockUSDC);
            console.log("Deployed MockUSDC:", quoteToken);
        }
        
        // Compute hook address with correct flags
        uint160 flags = uint160(Hooks.AFTER_INITIALIZE_FLAG);
        bytes memory creationCode = type(AuctionRepoHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            poolManager,
            worldId,
            quoteToken,
            deployer
        );
        
        address hookAddress = computeHookAddress(flags, creationCode, constructorArgs);
        console.log("Computed hook address:", hookAddress);
        
        // Deploy the hook with proper flag address
        bytes32 salt = HookMiner.find(
            CREATE2_DEPLOYER, 
            flags, 
            creationCode, 
            constructorArgs
        );

        AuctionRepoHook hook = new AuctionRepoHook{salt: salt}(
            IPoolManager(poolManager),
            worldId,
            quoteToken,
            deployer
        );
        
        console.log("Deployed AuctionRepoHook:", address(hook));
        
        // Set up the hook
        // 1. Allow WLD as collateral
        hook.setCollateralAllowed(WLD != address(0) ? WLD : address(0xdead), true);
        
        // 2. Create markets for different durations
        uint256 now = block.timestamp;
        hook.addMarket(now + 30 days);
        hook.addMarket(now + 90 days);
        hook.addMarket(now + 180 days);
        
        console.log("Setup complete!");
        
        vm.stopBroadcast();
    }
    
    function computeHookAddress(
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address) {
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);
        
        bytes memory dataToHash = abi.encodePacked(
            bytes1(0xff),
            CREATE2_DEPLOYER,
            bytes32(0), // salt
            bytecodeHash
        );
        bytes32 hash = keccak256(dataToHash);
        
        return address(uint160(uint256(hash)));
    }
}