// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// --- Interfaces ---
import {IPoolManager} from "@uniswap/v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/types/PoolKey.sol";
import {Hooks} from "@uniswap/v4-core/libraries/Hooks.sol";
import {Currency} from "@uniswap/v4-core/types/Currency.sol";
import {BaseHook} from "./BaseHook.sol";

// Placeholder for World ID Interface
interface IWorldID {
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external view;
}

// OpenZeppelin Imports
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionRepoHook - Simplified for deployment testing
 * @notice A minimal version of the Uniswap V4 Hook for lending/borrowing
 */
contract AuctionRepoHook is BaseHook, Ownable {
    // --- State Variables ---
    IWorldID public immutable worldIdRouter;
    address public immutable quoteToken; // e.g., USDC

    // Allowed collateral tokens
    mapping(address => bool) public isCollateralAllowed;

    // PoolKey for the Uniswap V4 pool
    PoolKey public poolKey;

    // --- Events ---
    event PoolKeySet(PoolKey key);
    event MarketAdded(uint256 maturityTimestamp);
    event CollateralAllowed(address indexed token, bool allowed);

    // --- Constructor ---
    constructor(
        IPoolManager _poolManager,
        IWorldID _worldIdRouter,
        address _quoteToken,
        address _initialOwner
    ) BaseHook(_poolManager) Ownable(_initialOwner) {
        require(_quoteToken != address(0), "Quote token cannot be zero address");
        worldIdRouter = _worldIdRouter;
        quoteToken = _quoteToken;
    }

    // --- Uniswap V4 Hook Overrides ---
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true, // Store PoolKey for context
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function afterInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96, int24 tick) external override returns (bytes4) {
        require(address(key.hooks) == address(this), "Invalid hook address in key");
        require(address(poolKey.hooks) == address(0), "PoolKey already set");
        
        // Optional: Validate quote token presence if needed
        require(
            Currency.unwrap(key.currency0) == quoteToken || 
            Currency.unwrap(key.currency1) == quoteToken,
            "Pool must include quote token"
        );
        
        poolKey = key;
        emit PoolKeySet(key);
        
        return this.afterInitialize.selector;
    }

    // --- Admin Functions ---
    function addMarket(uint256 maturityTimestamp) external onlyOwner {
        require(maturityTimestamp > block.timestamp, "Maturity must be in the future");
        
        emit MarketAdded(maturityTimestamp);
    }
    
    function setCollateralAllowed(address token, bool allowed) external onlyOwner {
        require(token != address(0), "Invalid token address");
        isCollateralAllowed[token] = allowed;
        emit CollateralAllowed(token, allowed);
    }
}