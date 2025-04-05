// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Import our local test version
import {AuctionRepoHook} from "./AuctionRepoHookTest.sol";
import {MockWorldID} from "./mocks/MockWorldID.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {TickMath} from "./utils/TickMath.sol";
import {HookMiner} from "./utils/HookMiner.sol";

contract AuctionRepoHookTest is Test {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    
    // Constants
    uint256 constant YEAR_IN_SECONDS = 365 days;
    uint256 constant BPS_DENOMINATOR = 10000;
    uint256 constant INITIAL_LTV = 7000; // 70%
    uint256 constant LIQUIDATION_THRESHOLD = 8500; // 85%
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // 1:1 price
    
    // Contract under test
    AuctionRepoHook public hook;
    
    // Pool management
    IPoolManager public manager;
    PoolKey public poolKey;
    PoolId public poolId;
    
    // Test tokens
    MockERC20 public token0; // Quote token
    MockERC20 public token1; // Collateral token
    
    // Test accounts
    address public owner;
    address public lender;
    address public borrower;
    
    // WorldID mock and data
    MockWorldID public worldId;
    address constant MOCK_SIGNAL = address(0xdead);
    uint256 constant MOCK_ROOT = 1;
    uint256 constant LENDER_NULLIFIER = 12345;
    uint256 constant BORROWER_NULLIFIER = 67890;
    uint256[8] MOCK_PROOF = [uint256(1), 2, 3, 4, 5, 6, 7, 8];
    
    // Market data
    uint256 public maturityTimestamp;
    
    function setUp() public {
        // Setup accounts
        owner = address(this);
        lender = makeAddr("lender");
        borrower = makeAddr("borrower");
        
        // Create tokens
        token0 = new MockERC20("Quote Token", "QUOT", 6);
        token1 = new MockERC20("Collateral Token", "COLL", 18);
        
        // Create currencies
        Currency currency0 = Currency.wrap(address(token0));
        Currency currency1 = Currency.wrap(address(token1));
        
        // Ensure token0 < token1 (required by Uniswap)
        if (address(token0) > address(token1)) {
            (token0, token1) = (token1, token0);
            (currency0, currency1) = (currency1, currency0);
        }
        
        // Create WorldID mock
        worldId = new MockWorldID();
        
        // Create mock poolManager
        manager = MockPoolManager(makeAddr("poolManager"));
        
        // Deploy the hook
        hook = new AuctionRepoHook(manager, worldId, address(token0), owner);
        
        // Create pool key
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Initialize pool (mock)
        vm.mockCall(
            address(manager),
            abi.encodeWithSelector(IPoolManager.initialize.selector),
            abi.encode(bytes4(0))
        );
        
        // Call afterInitialize to set up the hook
        hook.afterInitialize(poolKey, SQRT_PRICE_1_1, 0, new bytes(0));
        
        // Create market
        maturityTimestamp = block.timestamp + 90 days;
        hook.addMarket(maturityTimestamp);
        
        // Allow collateral token
        hook.setCollateralAllowed(address(token1), true);
        
        // Mint tokens to test accounts
        token0.mint(lender, 1000 ether);
        token1.mint(borrower, 100 ether);
        
        // Approve tokens
        vm.prank(lender);
        token0.approve(address(hook), type(uint256).max);
        
        vm.prank(borrower);
        token1.approve(address(hook), type(uint256).max);
    }
    
    // Helper for mocks
    function MockPoolManager(address addr) internal returns (IPoolManager) {
        // Create a simple interface that can be mocked
        return IPoolManager(addr);
    }
    
    // Tests
    
    function testInitialization() public {
        // Test that the hook was initialized correctly
        assertEq(address(hook.worldIdRouter()), address(worldId));
        assertEq(hook.quoteToken(), address(token0));
        assertEq(hook.owner(), owner);
        assertEq(hook.initialLTV(), INITIAL_LTV);
        assertEq(hook.liquidationThreshold(), LIQUIDATION_THRESHOLD);
        
        // Test that the pool key was set
        PoolKey memory storedKey = hook.poolKey();
        assertEq(address(storedKey.hooks), address(hook));
        assertEq(Currency.unwrap(storedKey.currency0), Currency.unwrap(poolKey.currency0));
        assertEq(Currency.unwrap(storedKey.currency1), Currency.unwrap(poolKey.currency1));
    }
    
    function testSubmitLendOffer() public {
        uint256 offerAmount = 100 ether;
        uint256 minRateBPS = 500; // 5%
        
        // Submit a lend offer
        vm.prank(lender);
        hook.submitLendOffer(
            offerAmount,
            minRateBPS,
            maturityTimestamp,
            MOCK_SIGNAL,
            MOCK_ROOT,
            LENDER_NULLIFIER,
            MOCK_PROOF
        );
        
        // Check the offer was created
        (uint256 offerId,,,,,,,) = hook.lendOffers(1);
        assertEq(offerId, 1);
        
        // Check token transfer
        assertEq(token0.balanceOf(address(hook)), offerAmount);
    }
    
    function testSubmitBorrowRequest() public {
        uint256 collateralAmount = 10 ether;
        uint256 requestAmount = 500 ether; // 50% LTV (assuming 1 token1 = 100 token0)
        uint256 maxRateBPS = 1000; // 10%
        
        // Submit a borrow request
        vm.prank(borrower);
        hook.submitBorrowRequest(
            address(token1),
            collateralAmount,
            requestAmount,
            maxRateBPS,
            maturityTimestamp,
            MOCK_SIGNAL,
            MOCK_ROOT,
            BORROWER_NULLIFIER,
            MOCK_PROOF
        );
        
        // Check the request was created
        (uint256 requestId,,,,,,,,) = hook.borrowRequests(1);
        assertEq(requestId, 1);
        
        // Check token transfer
        assertEq(token1.balanceOf(address(hook)), collateralAmount);
    }
    
    function testAuctionMechanism() public {
        // First create a lend offer
        uint256 offerAmount = 1000 ether;
        uint256 minRateBPS = 500; // 5%
        
        vm.prank(lender);
        hook.submitLendOffer(
            offerAmount,
            minRateBPS,
            maturityTimestamp,
            MOCK_SIGNAL,
            MOCK_ROOT,
            LENDER_NULLIFIER,
            MOCK_PROOF
        );
        
        // Then create a borrow request
        uint256 collateralAmount = 10 ether;
        uint256 requestAmount = 700 ether;
        uint256 maxRateBPS = 1000; // 10%
        
        vm.prank(borrower);
        hook.submitBorrowRequest(
            address(token1),
            collateralAmount,
            requestAmount,
            maxRateBPS,
            maturityTimestamp,
            MOCK_SIGNAL,
            MOCK_ROOT,
            BORROWER_NULLIFIER,
            MOCK_PROOF
        );
        
        // Advance time to allow auction
        vm.warp(block.timestamp + 2 hours);
        
        // Run the auction
        hook.runAuction(maturityTimestamp);
        
        // Check that a loan was created
        (uint256 loanId,,,,,,,,,,,) = hook.loans(1);
        assertEq(loanId, 1);
        
        // Check the market clearing rate
        (,uint256 lastClearingRateBPS,,,,,,) = hook.markets(maturityTimestamp);
        assertEq(lastClearingRateBPS, minRateBPS);
    }
    
    function testLoanLifecycle() public {
        // First set up a loan through auction
        testAuctionMechanism();
        
        // Get loan data
        (uint256 loanId, address lender_, address borrower_, address collateralToken, uint256 collateralAmount, uint256 quoteAmount, uint256 rateBPS, uint256 startTimestamp, uint256 maturity,,, uint8 status) = hook.loans(1);
        
        // Check the loan is pending
        assertEq(status, 0); // Pending
        assertEq(lender_, lender);
        assertEq(borrower_, borrower);
        assertEq(collateralToken, address(token1));
        assertEq(startTimestamp, 0);
        
        // Borrower claims the loan
        vm.prank(borrower);
        hook.claimLoan(loanId);
        
        // Check loan status updated
        (,,,,,, uint256 startTimestamp2,,,,, uint8 status2) = hook.loans(1);
        assertEq(status2, 1); // Active
        assertGt(startTimestamp2, 0);
        
        // Check quote tokens transferred to borrower
        assertEq(token0.balanceOf(borrower), quoteAmount);
        
        // Advance time 30 days
        vm.warp(block.timestamp + 30 days);
        
        // Mint tokens for repayment
        token0.mint(borrower, 1000 ether);
        
        // Borrower repays the loan
        vm.startPrank(borrower);
        token0.approve(address(hook), type(uint256).max);
        hook.repayLoan(loanId);
        vm.stopPrank();
        
        // Check loan status
        (,,,,,,,,,,, uint8 status3) = hook.loans(1);
        assertEq(status3, 2); // Repaid
        
        // Check collateral returned
        assertEq(token1.balanceOf(borrower), collateralAmount);
        
        // Calculate expected repayment with interest
        uint256 timeElapsed = 30 days;
        uint256 interestAmount = quoteAmount * rateBPS * timeElapsed / (YEAR_IN_SECONDS * BPS_DENOMINATOR);
        uint256 repaymentAmount = quoteAmount + interestAmount;
        
        // Check lender received payment (approximately)
        uint256 lenderBalance = token0.balanceOf(lender);
        assertApproxEqRel(lenderBalance, repaymentAmount, 0.01e18); // 1% tolerance
    }
    
    function testLiquidation() public {
        // Create and claim a loan
        testAuctionMechanism();
        
        vm.prank(borrower);
        hook.claimLoan(1);
        
        // Get loan data before changing LTV params
        (,,,, uint256 collateralAmount,,,,,,,) = hook.loans(1);
        
        // Change LTV params to make the position undercollateralized
        hook.setLTVParams(100, 200); // Low liquidation threshold
        
        // Advance time
        vm.warp(block.timestamp + 1 days);
        
        // Liquidate the position
        hook.liquidatePosition(1);
        
        // Check loan status
        (,,,,,,,,,,, uint8 status) = hook.loans(1);
        assertEq(status, 4); // Liquidated
    }
    
    function testBlacklistManagement() public {
        // Add a user to blacklist
        hook.ownerAddToBlacklist(123456);
        
        // Check user is blacklisted
        assertTrue(hook.isNullifierBlacklisted(123456));
        
        // Try to use a blacklisted nullifier
        vm.startPrank(lender);
        vm.expectRevert("User is blacklisted");
        hook.submitLendOffer(
            100 ether,
            500,
            maturityTimestamp,
            MOCK_SIGNAL,
            MOCK_ROOT,
            123456, // Blacklisted
            MOCK_PROOF
        );
        vm.stopPrank();
        
        // Remove user from blacklist
        hook.ownerRemoveFromBlacklist(123456);
        
        // Check user is no longer blacklisted
        assertFalse(hook.isNullifierBlacklisted(123456));
    }
    
    function testHookPermissions() public {
        // Get hook permissions
        Hooks.Permissions memory permissions = hook.getHookPermissions();
        
        // Only afterInitialize should be true
        assertTrue(permissions.afterInitialize);
        assertFalse(permissions.beforeInitialize);
        assertFalse(permissions.beforeSwap);
        assertFalse(permissions.afterSwap);
        assertFalse(permissions.beforeModifyPosition);
        assertFalse(permissions.afterModifyPosition);
        assertFalse(permissions.beforeDonate);
        assertFalse(permissions.afterDonate);
    }
}