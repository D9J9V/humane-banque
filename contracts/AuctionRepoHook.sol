// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- Interfaces ---
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/contracts/libraries/PoolKey.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/contracts/libraries/CurrencyLibrary.sol";
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
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title AuctionRepoHook
 * @notice Uniswap V4 Hook implementing a fixed-term lending and borrowing protocol with auction-based rate discovery
 * and human verification via World ID, functioning like a repo market.
 * @dev Implements core lending/borrowing with auction rate discovery, collateral management, and human verification.
 */
contract AuctionRepoHook is BaseHook, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_RATE_BPS = 5000; // 50% max annual rate
    uint256 public constant MIN_AUCTION_INTERVAL = 1 hours;
    uint256 public constant TWAP_INTERVAL = 1800; // 30 minutes
    
    // LTV settings (as percentages)
    uint256 public initialLTV = 7000; // 70% - initial loan to value ratio
    uint256 public liquidationThreshold = 8500; // 85% - liquidation threshold

    // --- Enums and Structs ---
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }

    struct LendOffer {
        uint256 offerId;
        address lender;
        uint256 quoteAmount;
        uint256 minRateBPS;
        uint256 maturityTimestamp;
        uint256 lenderNullifier;
        bool matched;
    }

    struct BorrowRequest {
        uint256 requestId;
        address borrower;
        address collateralToken;
        uint256 collateralAmount;
        uint256 quoteAmountRequested;
        uint256 maxRateBPS;
        uint256 maturityTimestamp;
        uint256 borrowerNullifier;
        bool matched;
    }

    struct Loan {
        uint256 loanId;
        address lender;
        address borrower;
        address collateralToken;
        uint256 collateralAmount;
        uint256 quoteAmount;
        uint256 rateBPS;
        uint256 startTimestamp;
        uint256 maturityTimestamp;
        uint256 lenderNullifier;
        uint256 borrowerNullifier;
        LoanStatus status;
    }

    struct MarketData {
        uint256 lastAuctionTimestamp;
        uint256 lastClearingRateBPS;
        uint256 totalOfferedAmount;
        uint256 totalRequestedAmount;
        uint256 activeLoanCount;
        uint256 totalLoanVolume;
        uint256 defaultCount;
    }

    // --- State Variables ---
    IWorldID public immutable worldIdRouter;
    address public immutable quoteToken; // e.g., USDC

    // Blacklist mapping: nullifier hash => blacklisted status
    mapping(uint256 => bool) public isNullifierBlacklisted;

    // Allowed collateral tokens
    mapping(address => bool) public isCollateralAllowed;

    // PoolKey for the Uniswap V4 pool
    PoolKey public poolKey;

    // Maturity timestamp => market data
    mapping(uint256 => MarketData) public markets;
    // Array of active market maturities
    uint256[] public activeMarkets;

    // Offer & request tracking
    mapping(uint256 => LendOffer) public lendOffers;
    uint256 public nextOfferId = 1;
    
    mapping(uint256 => BorrowRequest) public borrowRequests;
    uint256 public nextRequestId = 1;

    // Loan tracking
    mapping(uint256 => Loan) public loans;
    uint256 public nextLoanId = 1;

    // --- Events ---
    event PoolKeySet(PoolKey key);
    event MarketAdded(uint256 maturityTimestamp);
    event CollateralAllowed(address indexed token, bool allowed);
    event LTVUpdated(uint256 initialLTV, uint256 liquidationThreshold);
    
    event LendOfferSubmitted(
        uint256 indexed offerId,
        address indexed lender,
        uint256 quoteAmount,
        uint256 minRateBPS,
        uint256 maturityTimestamp,
        uint256 lenderNullifier
    );
    
    event BorrowRequestSubmitted(
        uint256 indexed requestId,
        address indexed borrower,
        address collateralToken,
        uint256 collateralAmount,
        uint256 quoteAmountRequested,
        uint256 maxRateBPS,
        uint256 maturityTimestamp,
        uint256 borrowerNullifier
    );
    
    event AuctionExecuted(
        uint256 maturityTimestamp,
        uint256 clearingRateBPS,
        uint256 matchedVolume,
        uint256 matchedRequestCount,
        uint256 matchedOfferCount
    );
    
    event LoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed borrower,
        uint256 quoteAmount,
        uint256 rateBPS,
        uint256 maturityTimestamp
    );
    
    event LoanClaimed(uint256 indexed loanId, uint256 startTimestamp);
    event LoanRepaid(uint256 indexed loanId, uint256 repaymentAmount);
    event LoanLiquidated(uint256 indexed loanId, uint256 collateralSold, uint256 quoteReceived);
    event DefaulterBlacklisted(uint256 indexed nullifierHash);
    event UserUnblacklisted(uint256 indexed nullifierHash);

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
            beforeModifyPosition: false,
            afterModifyPosition: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false
        });
    }

    function afterInitialize(PoolKey calldata key, uint160, int24, bytes calldata) external override returns (bytes4) {
        require(key.hooks == address(this), "Invalid hook address in key");
        require(poolKey.hooks == address(0), "PoolKey already set");
        
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
        require(markets[maturityTimestamp].lastAuctionTimestamp == 0, "Market already exists");
        
        markets[maturityTimestamp] = MarketData({
            lastAuctionTimestamp: block.timestamp,
            lastClearingRateBPS: 0,
            totalOfferedAmount: 0,
            totalRequestedAmount: 0,
            activeLoanCount: 0,
            totalLoanVolume: 0,
            defaultCount: 0
        });
        
        activeMarkets.push(maturityTimestamp);
        emit MarketAdded(maturityTimestamp);
    }
    
    function setCollateralAllowed(address token, bool allowed) external onlyOwner {
        require(token != address(0), "Invalid token address");
        isCollateralAllowed[token] = allowed;
        emit CollateralAllowed(token, allowed);
    }
    
    function setLTVParams(uint256 _initialLTV, uint256 _liquidationThreshold) external onlyOwner {
        require(_initialLTV < _liquidationThreshold, "Initial LTV must be less than liquidation threshold");
        require(_liquidationThreshold <= BPS_DENOMINATOR, "Liquidation threshold cannot exceed 100%");
        
        initialLTV = _initialLTV;
        liquidationThreshold = _liquidationThreshold;
        emit LTVUpdated(_initialLTV, _liquidationThreshold);
    }

    // --- Internal Verification Logic ---
    /**
     * @dev Verifies World ID proof and checks if the nullifier is blacklisted.
     * @return The verified nullifier hash if successful.
     */
    function _verifyProofAndCheckBlacklist(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal view returns (uint256) {
        // Check blacklist first
        require(!isNullifierBlacklisted[nullifierHash], "User is blacklisted");
        
        // Verify World ID proof
        try worldIdRouter.verifyProof(signal, root, nullifierHash, proof) {
            // Proof is valid
        } catch {
            revert("Invalid World ID proof");
        }
        
        return nullifierHash;
    }

    // --- Core Protocol Functions ---
    
    /**
     * @notice Submit an offer to lend quote tokens for a specific term.
     * @param quoteAmount Amount of quote tokens to lend
     * @param minRateBPS Minimum annual interest rate in BPS (e.g., 500 = 5%)
     * @param maturityTimestamp Desired maturity date
     * @param signal Signal for World ID verification (typically lender's address)
     * @param root World ID Merkle root
     * @param nullifierHash World ID nullifier hash
     * @param proof World ID ZK proof
     */
    function submitLendOffer(
        uint256 quoteAmount,
        uint256 minRateBPS,
        uint256 maturityTimestamp,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external nonReentrant {
        // Input validation
        require(quoteAmount > 0, "Amount must be positive");
        require(minRateBPS <= MAX_RATE_BPS, "Rate exceeds maximum");
        require(
            markets[maturityTimestamp].lastAuctionTimestamp > 0,
            "Market does not exist"
        );
        require(
            maturityTimestamp > block.timestamp,
            "Maturity must be in the future"
        );
        
        // Verify World ID proof
        uint256 lenderNullifier = _verifyProofAndCheckBlacklist(
            signal,
            root,
            nullifierHash,
            proof
        );
        
        // Transfer quote tokens from lender to hook
        IERC20(quoteToken).safeTransferFrom(msg.sender, address(this), quoteAmount);
        
        // Create offer
        uint256 offerId = nextOfferId++;
        lendOffers[offerId] = LendOffer({
            offerId: offerId,
            lender: msg.sender,
            quoteAmount: quoteAmount,
            minRateBPS: minRateBPS,
            maturityTimestamp: maturityTimestamp,
            lenderNullifier: lenderNullifier,
            matched: false
        });
        
        // Update market data
        markets[maturityTimestamp].totalOfferedAmount += quoteAmount;
        
        emit LendOfferSubmitted(
            offerId,
            msg.sender,
            quoteAmount,
            minRateBPS,
            maturityTimestamp,
            lenderNullifier
        );
    }
    
    /**
     * @notice Submit a request to borrow quote tokens with collateral.
     * @param collateralToken Address of the collateral token
     * @param collateralAmount Amount of collateral to deposit
     * @param quoteAmountRequested Amount of quote tokens requested
     * @param maxRateBPS Maximum annual interest rate willing to pay in BPS
     * @param maturityTimestamp Desired maturity date
     * @param signal Signal for World ID verification
     * @param root World ID Merkle root
     * @param nullifierHash World ID nullifier hash
     * @param proof World ID ZK proof
     */
    function submitBorrowRequest(
        address collateralToken,
        uint256 collateralAmount,
        uint256 quoteAmountRequested,
        uint256 maxRateBPS,
        uint256 maturityTimestamp,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external nonReentrant {
        // Input validation
        require(isCollateralAllowed[collateralToken], "Collateral not allowed");
        require(collateralAmount > 0, "Collateral amount must be positive");
        require(quoteAmountRequested > 0, "Requested amount must be positive");
        require(maxRateBPS <= MAX_RATE_BPS, "Rate exceeds maximum");
        require(
            markets[maturityTimestamp].lastAuctionTimestamp > 0,
            "Market does not exist"
        );
        require(
            maturityTimestamp > block.timestamp,
            "Maturity must be in the future"
        );
        
        // Verify World ID proof
        uint256 borrowerNullifier = _verifyProofAndCheckBlacklist(
            signal,
            root,
            nullifierHash,
            proof
        );
        
        // Check if the collateral value is sufficient for the requested loan
        uint256 collateralValueUSD = _getCollateralValueUSD(collateralToken, collateralAmount);
        uint256 maxLoanAmount = collateralValueUSD * initialLTV / BPS_DENOMINATOR;
        require(
            quoteAmountRequested <= maxLoanAmount,
            "Insufficient collateral for requested loan"
        );
        
        // Transfer collateral from borrower to hook
        IERC20(collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);
        
        // Create request
        uint256 requestId = nextRequestId++;
        borrowRequests[requestId] = BorrowRequest({
            requestId: requestId,
            borrower: msg.sender,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            quoteAmountRequested: quoteAmountRequested,
            maxRateBPS: maxRateBPS,
            maturityTimestamp: maturityTimestamp,
            borrowerNullifier: borrowerNullifier,
            matched: false
        });
        
        // Update market data
        markets[maturityTimestamp].totalRequestedAmount += quoteAmountRequested;
        
        emit BorrowRequestSubmitted(
            requestId,
            msg.sender,
            collateralToken,
            collateralAmount,
            quoteAmountRequested,
            maxRateBPS,
            maturityTimestamp,
            borrowerNullifier
        );
    }
    
    /**
     * @notice Execute the auction for a specific maturity market.
     * @param maturityTimestamp The maturity date for which to run the auction
     */
    function runAuction(uint256 maturityTimestamp) external onlyOwner {
        // Check auction conditions
        MarketData storage market = markets[maturityTimestamp];
        require(market.lastAuctionTimestamp > 0, "Market does not exist");
        require(
            block.timestamp >= market.lastAuctionTimestamp + MIN_AUCTION_INTERVAL,
            "Auction interval not elapsed"
        );
        require(maturityTimestamp > block.timestamp, "Market maturity passed");
        
        // Collect pending offers and requests
        (
            uint256[] memory offerIds, 
            uint256[] memory requestIds
        ) = _collectPendingOrdersForAuction(maturityTimestamp);
        
        require(offerIds.length > 0 && requestIds.length > 0, "No orders to match");
        
        // Sort offers by minRate (ascending) and requests by maxRate (descending)
        _sortOffersAndRequests(offerIds, requestIds);
        
        // Determine clearing rate and match orders
        (
            uint256 clearingRateBPS, 
            uint256 matchedVolume, 
            uint256 matchCount
        ) = _executeAuctionMatching(maturityTimestamp, offerIds, requestIds);
        
        // Update market data
        market.lastAuctionTimestamp = block.timestamp;
        market.lastClearingRateBPS = clearingRateBPS;
        
        emit AuctionExecuted(
            maturityTimestamp,
            clearingRateBPS,
            matchedVolume,
            matchCount,
            offerIds.length
        );
    }
    
    /**
     * @notice Claim a loan after it was matched in an auction.
     * @param loanId The ID of the loan to claim
     */
    function claimLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        
        require(loan.loanId != 0, "Loan does not exist");
        require(loan.borrower == msg.sender, "Only borrower can claim");
        require(loan.status == LoanStatus.Pending, "Loan not in pending status");
        
        // Transfer quote tokens to borrower
        IERC20(quoteToken).safeTransfer(loan.borrower, loan.quoteAmount);
        
        // Update loan status
        loan.status = LoanStatus.Active;
        loan.startTimestamp = block.timestamp;
        
        // Update market stats
        markets[loan.maturityTimestamp].activeLoanCount++;
        markets[loan.maturityTimestamp].totalLoanVolume += loan.quoteAmount;
        
        emit LoanClaimed(loanId, block.timestamp);
    }
    
    /**
     * @notice Repay a loan before or at maturity.
     * @param loanId The ID of the loan to repay
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        
        require(loan.loanId != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp <= loan.maturityTimestamp, "Loan past maturity");
        
        // Calculate repayment amount with interest
        uint256 timeElapsed = block.timestamp - loan.startTimestamp;
        uint256 interestAmount = loan.quoteAmount * loan.rateBPS * timeElapsed / (YEAR_IN_SECONDS * BPS_DENOMINATOR);
        uint256 repaymentAmount = loan.quoteAmount + interestAmount;
        
        // Transfer repayment from borrower to hook
        IERC20(quoteToken).safeTransferFrom(msg.sender, address(this), repaymentAmount);
        
        // Transfer repayment to lender
        IERC20(quoteToken).safeTransfer(loan.lender, repaymentAmount);
        
        // Return collateral to borrower
        IERC20(loan.collateralToken).safeTransfer(loan.borrower, loan.collateralAmount);
        
        // Update loan status
        loan.status = LoanStatus.Repaid;
        
        // Update market stats
        markets[loan.maturityTimestamp].activeLoanCount--;
        
        emit LoanRepaid(loanId, repaymentAmount);
    }
    
    /**
     * @notice Liquidate a loan if it's undercollateralized or past maturity.
     * @param loanId The ID of the loan to liquidate
     */
    function liquidatePosition(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        
        require(loan.loanId != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        bool isPastMaturity = block.timestamp > loan.maturityTimestamp;
        bool isUndercollateralized = false;
        
        if (!isPastMaturity) {
            // Check if loan is undercollateralized
            uint256 collateralValueUSD = _getCollateralValueUSD(loan.collateralToken, loan.collateralAmount);
            uint256 loanValueWithInterest = _calculateCurrentDebt(loan);
            uint256 currentLTV = loanValueWithInterest * BPS_DENOMINATOR / collateralValueUSD;
            
            isUndercollateralized = currentLTV > liquidationThreshold;
            require(isUndercollateralized, "Loan not eligible for liquidation");
        }
        
        // Calculate repayment amount with interest
        uint256 totalDebt = _calculateCurrentDebt(loan);
        
        // Liquidate collateral through Uniswap V4 pool
        (uint256 collateralSold, uint256 quoteReceived) = _liquidateCollateral(
            loan.collateralToken,
            loan.collateralAmount,
            totalDebt
        );
        
        // Distribute proceeds
        if (quoteReceived >= totalDebt) {
            // Full repayment to lender
            IERC20(quoteToken).safeTransfer(loan.lender, totalDebt);
            
            // Return any excess to borrower (if any)
            uint256 excess = quoteReceived - totalDebt;
            if (excess > 0) {
                IERC20(quoteToken).safeTransfer(loan.borrower, excess);
            }
            
            // Return any unused collateral to borrower (if any)
            uint256 remainingCollateral = loan.collateralAmount - collateralSold;
            if (remainingCollateral > 0) {
                IERC20(loan.collateralToken).safeTransfer(loan.borrower, remainingCollateral);
            }
        } else {
            // Partial repayment to lender (shortfall case)
            IERC20(quoteToken).safeTransfer(loan.lender, quoteReceived);
            // All collateral is sold in this case
        }
        
        // Update loan status
        loan.status = LoanStatus.Liquidated;
        
        // Update market stats
        markets[loan.maturityTimestamp].activeLoanCount--;
        
        // Blacklist borrower if default at maturity
        if (isPastMaturity) {
            _blacklistBorrower(loan.borrowerNullifier);
            markets[loan.maturityTimestamp].defaultCount++;
        }
        
        emit LoanLiquidated(loanId, collateralSold, quoteReceived);
    }
    
    // --- Blacklist Management ---
    
    /**
     * @notice Add a nullifier to the blacklist (admin function).
     */
    function ownerAddToBlacklist(uint256 nullifierHash) external onlyOwner {
        _blacklistBorrower(nullifierHash);
    }
    
    /**
     * @notice Remove a nullifier from the blacklist (admin function).
     */
    function ownerRemoveFromBlacklist(uint256 nullifierHash) external onlyOwner {
        require(nullifierHash != 0, "Invalid nullifier");
        require(isNullifierBlacklisted[nullifierHash], "Not blacklisted");
        
        isNullifierBlacklisted[nullifierHash] = false;
        emit UserUnblacklisted(nullifierHash);
    }
    
    // --- Internal Helper Functions ---
    
    /**
     * @dev Get the USD value of collateral using the Uniswap V4 TWAP.
     */
    function _getCollateralValueUSD(address collateralToken, uint256 amount) internal view returns (uint256) {
        // This is a placeholder - actual implementation would use Uniswap V4 TWAP
        // For simplicity in this example, we're returning a hardcoded value
        // In a real implementation, you would:
        // - Query the TWAP for collateralToken/quoteToken pair
        // - Calculate the USD value of the collateral
        
        // Using direct pool call for oracle data:
        // bytes memory oracleData = poolManager.getOracleData(poolKey, TWAP_INTERVAL);
        // Process the oracleData to get the price...
        
        // For now, assume 1 collateral = 100 USD
        return amount * 100;
    }
    
    /**
     * @dev Collect all pending (unmatched) offers and requests for a specific maturity.
     */
    function _collectPendingOrdersForAuction(uint256 maturityTimestamp) 
        internal 
        view 
        returns (uint256[] memory offerIds, uint256[] memory requestIds) 
    {
        // Count pending offers and requests
        uint256 pendingOfferCount = 0;
        uint256 pendingRequestCount = 0;
        
        for (uint256 i = 1; i < nextOfferId; i++) {
            LendOffer storage offer = lendOffers[i];
            if (!offer.matched && offer.maturityTimestamp == maturityTimestamp) {
                pendingOfferCount++;
            }
        }
        
        for (uint256 i = 1; i < nextRequestId; i++) {
            BorrowRequest storage request = borrowRequests[i];
            if (!request.matched && request.maturityTimestamp == maturityTimestamp) {
                pendingRequestCount++;
            }
        }
        
        // Allocate arrays
        offerIds = new uint256[](pendingOfferCount);
        requestIds = new uint256[](pendingRequestCount);
        
        // Fill arrays
        uint256 offerIndex = 0;
        uint256 requestIndex = 0;
        
        for (uint256 i = 1; i < nextOfferId; i++) {
            LendOffer storage offer = lendOffers[i];
            if (!offer.matched && offer.maturityTimestamp == maturityTimestamp) {
                offerIds[offerIndex++] = i;
            }
        }
        
        for (uint256 i = 1; i < nextRequestId; i++) {
            BorrowRequest storage request = borrowRequests[i];
            if (!request.matched && request.maturityTimestamp == maturityTimestamp) {
                requestIds[requestIndex++] = i;
            }
        }
        
        return (offerIds, requestIds);
    }
    
    /**
     * @dev Sort offers by minRate (ascending) and requests by maxRate (descending).
     */
    function _sortOffersAndRequests(
        uint256[] memory offerIds,
        uint256[] memory requestIds
    ) internal view {
        // Sort offers by minRate (ascending)
        for (uint256 i = 0; i < offerIds.length; i++) {
            for (uint256 j = i + 1; j < offerIds.length; j++) {
                if (lendOffers[offerIds[i]].minRateBPS > lendOffers[offerIds[j]].minRateBPS) {
                    (offerIds[i], offerIds[j]) = (offerIds[j], offerIds[i]);
                }
            }
        }
        
        // Sort requests by maxRate (descending)
        for (uint256 i = 0; i < requestIds.length; i++) {
            for (uint256 j = i + 1; j < requestIds.length; j++) {
                if (borrowRequests[requestIds[i]].maxRateBPS < borrowRequests[requestIds[j]].maxRateBPS) {
                    (requestIds[i], requestIds[j]) = (requestIds[j], requestIds[i]);
                }
            }
        }
    }
    
    /**
     * @dev Execute the auction matching algorithm and create loans.
     */
    function _executeAuctionMatching(
        uint256 maturityTimestamp,
        uint256[] memory offerIds,
        uint256[] memory requestIds
    ) internal returns (uint256 clearingRate, uint256 matchedVolume, uint256 matchCount) {
        // Determine the clearing rate (the rate where maximum volume is matched)
        uint256 bestClearingRate = 0;
        uint256 bestMatchedVolume = 0;
        
        // Try each potential clearing rate (from offers and requests)
        for (uint256 i = 0; i < offerIds.length; i++) {
            uint256 potentialClearingRate = lendOffers[offerIds[i]].minRateBPS;
            
            // Calculate matchable volume at this rate
            uint256 offerVolume = 0;
            uint256 requestVolume = 0;
            
            for (uint256 j = 0; j <= i; j++) {
                offerVolume += lendOffers[offerIds[j]].quoteAmount;
            }
            
            for (uint256 j = 0; j < requestIds.length; j++) {
                if (borrowRequests[requestIds[j]].maxRateBPS >= potentialClearingRate) {
                    requestVolume += borrowRequests[requestIds[j]].quoteAmountRequested;
                } else {
                    break; // Requests are sorted by maxRate descending
                }
            }
            
            // The matched volume is the minimum of offer and request volumes
            uint256 matchableVolume = Math.min(offerVolume, requestVolume);
            
            // If this clearing rate produces a higher matched volume, update the best
            if (matchableVolume > bestMatchedVolume) {
                bestMatchedVolume = matchableVolume;
                bestClearingRate = potentialClearingRate;
            }
        }
        
        // Now create loans using the best clearing rate
        if (bestMatchedVolume > 0) {
            matchedVolume = bestMatchedVolume;
            clearingRate = bestClearingRate;
            matchCount = _createLoans(maturityTimestamp, offerIds, requestIds, clearingRate, matchedVolume);
        }
        
        return (clearingRate, matchedVolume, matchCount);
    }
    
    /**
     * @dev Create loans based on auction matching.
     */
    function _createLoans(
        uint256 maturityTimestamp,
        uint256[] memory offerIds,
        uint256[] memory requestIds,
        uint256 clearingRate,
        uint256 totalVolumeToMatch
    ) internal returns (uint256 matchCount) {
        uint256 remainingVolumeToMatch = totalVolumeToMatch;
        uint256 offerIndex = 0;
        uint256 requestIndex = 0;
        
        uint256 currentOfferRemaining = 0;
        uint256 currentRequestRemaining = 0;
        
        while (remainingVolumeToMatch > 0 && offerIndex < offerIds.length && requestIndex < requestIds.length) {
            // Skip offers with minRate > clearingRate
            while (offerIndex < offerIds.length && lendOffers[offerIds[offerIndex]].minRateBPS > clearingRate) {
                offerIndex++;
            }
            if (offerIndex >= offerIds.length) break;
            
            // Skip requests with maxRate < clearingRate
            while (requestIndex < requestIds.length && borrowRequests[requestIds[requestIndex]].maxRateBPS < clearingRate) {
                requestIndex++;
            }
            if (requestIndex >= requestIds.length) break;
            
            // Get current offer and request
            LendOffer storage offer = lendOffers[offerIds[offerIndex]];
            BorrowRequest storage request = borrowRequests[requestIds[requestIndex]];
            
            // If we need to load a new offer or request
            if (currentOfferRemaining == 0) {
                currentOfferRemaining = offer.quoteAmount;
            }
            if (currentRequestRemaining == 0) {
                currentRequestRemaining = request.quoteAmountRequested;
            }
            
            // Calculate the match amount for this pair
            uint256 matchAmount = Math.min(
                Math.min(currentOfferRemaining, currentRequestRemaining),
                remainingVolumeToMatch
            );
            
            if (matchAmount > 0) {
                // Create a loan
                uint256 loanId = nextLoanId++;
                loans[loanId] = Loan({
                    loanId: loanId,
                    lender: offer.lender,
                    borrower: request.borrower,
                    collateralToken: request.collateralToken,
                    // Prorate collateral based on matched amount
                    collateralAmount: request.collateralAmount * matchAmount / request.quoteAmountRequested,
                    quoteAmount: matchAmount,
                    rateBPS: clearingRate,
                    startTimestamp: 0, // Will be set when claimed
                    maturityTimestamp: maturityTimestamp,
                    lenderNullifier: offer.lenderNullifier,
                    borrowerNullifier: request.borrowerNullifier,
                    status: LoanStatus.Pending
                });
                
                // Update counters
                currentOfferRemaining -= matchAmount;
                currentRequestRemaining -= matchAmount;
                remainingVolumeToMatch -= matchAmount;
                matchCount++;
                
                emit LoanCreated(
                    loanId,
                    offer.lender,
                    request.borrower,
                    matchAmount,
                    clearingRate,
                    maturityTimestamp
                );
                
                // Mark as matched if fully utilized
                if (currentOfferRemaining == 0) {
                    offer.matched = true;
                    offerIndex++;
                }
                
                if (currentRequestRemaining == 0) {
                    request.matched = true;
                    requestIndex++;
                }
            }
        }
        
        return matchCount;
    }
    
    /**
     * @dev Calculate the current debt of a loan including accrued interest.
     */
    function _calculateCurrentDebt(Loan storage loan) internal view returns (uint256) {
        if (loan.startTimestamp == 0 || loan.status != LoanStatus.Active) {
            return 0;
        }
        
        uint256 timeElapsed = Math.min(
            block.timestamp - loan.startTimestamp,
            loan.maturityTimestamp - loan.startTimestamp
        );
        
        uint256 interestAmount = loan.quoteAmount * loan.rateBPS * timeElapsed / (YEAR_IN_SECONDS * BPS_DENOMINATOR);
        return loan.quoteAmount + interestAmount;
    }
    
    /**
     * @dev Liquidate collateral through Uniswap V4 pool.
     * @return collateralSold Amount of collateral sold
     * @return quoteReceived Amount of quote tokens received
     */
    function _liquidateCollateral(
        address collateralToken,
        uint256 collateralAmount,
        uint256 debtAmount
    ) internal returns (uint256 collateralSold, uint256 quoteReceived) {
        // This is a placeholder implementation of liquidation
        // In a real implementation, you would:
        // 1. Approve the poolManager to use the collateral
        // 2. Call poolManager.swap() with the appropriate parameters
        // 3. Handle the resulting balances
        
        // For now, simulate liquidation with a fixed rate
        collateralSold = collateralAmount;
        quoteReceived = _getCollateralValueUSD(collateralToken, collateralAmount);
        
        // In reality, this would be implemented using a Uniswap V4 swap
        return (collateralSold, quoteReceived);
    }
    
    /**
     * @dev Blacklist a borrower's nullifier hash.
     */
    function _blacklistBorrower(uint256 nullifierHash) internal {
        require(nullifierHash != 0, "Invalid nullifier");
        if (!isNullifierBlacklisted[nullifierHash]) {
            isNullifierBlacklisted[nullifierHash] = true;
            emit DefaulterBlacklisted(nullifierHash);
        }
    }
}