// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {AuctionRepoHook} from "../src/AuctionRepoHook.sol";
import {BaseHook} from "../src/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import "../src/mocks/MockWorldID.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockPoolManager.sol";

contract AuctionRepoHookTest is Test {
    AuctionRepoHook public hook;
    MockPoolManager public poolManager;
    MockWorldID public worldId;
    MockERC20 public quoteToken;
    MockERC20 public collateralToken;
    
    address public owner;
    address public lender;
    address public borrower;
    
    uint256 constant YEAR_IN_SECONDS = 365 days;
    uint256 constant BPS_DENOMINATOR = 10000;
    uint256 constant INITIAL_LTV = 7000; // 70%
    uint256 constant LIQUIDATION_THRESHOLD = 8500; // 85%
    
    function setUp() public {
        owner = address(this);
        lender = makeAddr("lender");
        borrower = makeAddr("borrower");
        
        // Deploy mock contracts
        poolManager = new MockPoolManager();
        worldId = new MockWorldID();
        quoteToken = new MockERC20("Quote Token", "QUOT", 6);
        collateralToken = new MockERC20("Collateral Token", "COLL", 18);
        
        // Deploy hook
        hook = new AuctionRepoHook(
            IPoolManager(address(poolManager)),
            address(worldId),
            address(quoteToken),
            owner
        );
        
        // Configure hook
        hook.setCollateralAllowed(address(collateralToken), true);
        
        // Create a market
        uint256 maturityTimestamp = block.timestamp + 90 days;
        hook.addMarket(maturityTimestamp);
        
        // Mint tokens for testing
        quoteToken.mint(lender, 1000 ether);
        collateralToken.mint(borrower, 100 ether);
        
        // Approve tokens
        vm.prank(lender);
        quoteToken.approve(address(hook), type(uint256).max);
        
        vm.prank(borrower);
        collateralToken.approve(address(hook), type(uint256).max);
    }
    
    function testDeployment() public {
        assertEq(address(hook.poolManager()), address(poolManager));
        assertEq(address(hook.worldIdRouter()), address(worldId));
        assertEq(hook.quoteToken(), address(quoteToken));
        assertEq(hook.owner(), owner);
    }
    
    function testHookPermissions() public {
        Hooks.Permissions memory permissions = hook.getHookPermissions();
        
        assertTrue(permissions.afterInitialize);
        assertFalse(permissions.beforeInitialize);
        assertFalse(permissions.beforeSwap);
        assertFalse(permissions.afterSwap);
    }
    
    function testAddMarket() public {
        uint256 newMaturityTimestamp = block.timestamp + 180 days;
        hook.addMarket(newMaturityTimestamp);
        
        (uint256 lastAuctionTimestamp,,,,,,) = hook.markets(newMaturityTimestamp);
        assertTrue(lastAuctionTimestamp > 0);
    }
    
    // Add more tests as needed
}