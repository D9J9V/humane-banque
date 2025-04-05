// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

// Mocked peripheral contracts
contract PoolRouter {
    IPoolManager immutable manager;
    
    constructor(IPoolManager _manager) {
        manager = _manager;
    }
    
    function swap(
        PoolKey memory key,
        IPoolManager.SwapParams memory params,
        bytes memory hookData
    ) external returns (bytes memory) {
        // Just return mock data
        return abi.encode(int128(0), int128(0));
    }
}

contract PositionManager {
    IPoolManager immutable manager;
    
    constructor(IPoolManager _manager, uint256, address) {
        manager = _manager;
    }
}

interface IPositionManager {
    function mint(bytes memory data, uint256 deadline) external returns (bytes memory result);
}

contract Permit2 {
    function approve(address token, address spender, uint160 amount, uint48 expiration) external {}
}

contract Fixtures is Test {
    // Constants
    uint160 public constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // 1:1 price
    bytes internal constant ZERO_BYTES = new bytes(0);
    uint256 internal constant MAX_SLIPPAGE_REMOVE_LIQUIDITY = type(uint256).max;
    
    // Contract instances
    IPoolManager public manager;
    PoolRouter public router;
    PositionManager public posm;
    MockERC20 public token0;
    MockERC20 public token1;
    Currency public currency0;
    Currency public currency1;
    Permit2 public permit2;
    
    // Pool key
    PoolKey public key;

    /**
     * @notice Deploy a fresh pool manager and supporting contracts
     */
    function deployFreshManagerAndRouters() public {
        // Deploy PoolManager
        manager = new PoolManager(500000);
        
        // Deploy PoolRouter
        router = new PoolRouter(manager);
        
        // Deploy Permit2
        permit2 = Permit2(payable(address(new Permit2())));
        
        // Deploy PositionManager
        posm = new PositionManager(manager, 0, address(permit2));
    }
    
    /**
     * @notice Deploy and mint tokens for testing
     */
    function deployMintAndApprove2Currencies() public {
        // Deploy tokens
        token0 = new MockERC20("Token0", "TKN0", 18);
        token1 = new MockERC20("Token1", "TKN1", 18);
        
        // Ensure token0 address is less than token1 address (required by Uniswap)
        if (address(token0) > address(token1)) {
            (token0, token1) = (token1, token0);
        }
        
        // Convert to Currency type
        currency0 = Currency.wrap(address(token0));
        currency1 = Currency.wrap(address(token1));
        
        // Mint tokens to the test contract
        token0.mint(address(this), 1000000 ether);
        token1.mint(address(this), 1000000 ether);
        
        // Approve tokens for the manager and router
        token0.approve(address(manager), type(uint256).max);
        token1.approve(address(manager), type(uint256).max);
        token0.approve(address(router), type(uint256).max);
        token1.approve(address(router), type(uint256).max);
        token0.approve(address(permit2), type(uint256).max);
        token1.approve(address(permit2), type(uint256).max);
    }
    
    /**
     * @notice Deploy and approve tokens for the position manager
     */
    function deployAndApprovePosm(IPoolManager _manager) public {
        // Deploy PositionManager if not already deployed
        if (address(posm) == address(0)) {
            permit2 = Permit2(payable(address(new Permit2())));
            posm = new PositionManager(_manager, 0, address(permit2));
        }
        
        // Approve tokens for the position manager
        token0.approve(address(posm), type(uint256).max);
        token1.approve(address(posm), type(uint256).max);
        
        // Setup Permit2 approvals
        permit2.approve(address(token0), address(posm), type(uint160).max, uint48(block.timestamp + 1 days));
        permit2.approve(address(token1), address(posm), type(uint160).max, uint48(block.timestamp + 1 days));
    }
    
    /**
     * @notice Helper for deploying a contract to a specific address
     */
    function deployCodeTo(string memory what, bytes memory args, address where) public {
        bytes memory creationCode = abi.encodePacked(vm.getCode(what), args);
        
        vm.etch(where, creationCode);
        
        // Call the constructor
        (bool success, bytes memory runtimeBytecode) = where.call("");
        require(success, "Failed to deploy to target address");
        
        vm.etch(where, runtimeBytecode);
    }
    
    /**
     * @notice Helper to execute a swap on the pool
     */
    function swap(
        PoolKey memory _key,
        bool zeroForOne,
        int256 amountSpecified,
        bytes memory hookData
    ) internal returns (int128 amount0Delta, int128 amount1Delta) {
        // Execute the swap through the router
        bytes memory result = router.swap(
            _key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? uint160(1) + 1 : uint160(type(uint160).max) - 1
            }),
            hookData
        );
        
        (amount0Delta, amount1Delta) = abi.decode(result, (int128, int128));
        return (amount0Delta, amount1Delta);
    }
}