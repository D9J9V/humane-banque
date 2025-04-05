// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PoolKey} from "@uniswap/v4-core/contracts/libraries/PoolKey.sol";

/**
 * @title IAuctionRepoHook
 * @notice Interface for the AuctionRepoHook contract
 */
interface IAuctionRepoHook {
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

    // --- Admin Functions ---
    function addMarket(uint256 maturityTimestamp) external;
    function setCollateralAllowed(address token, bool allowed) external;
    function setLTVParams(uint256 _initialLTV, uint256 _liquidationThreshold) external;
    function ownerAddToBlacklist(uint256 nullifierHash) external;
    function ownerRemoveFromBlacklist(uint256 nullifierHash) external;

    // --- Core Protocol Functions ---
    function submitLendOffer(
        uint256 quoteAmount,
        uint256 minRateBPS,
        uint256 maturityTimestamp,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external;
    
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
    ) external;
    
    function runAuction(uint256 maturityTimestamp) external;
    function claimLoan(uint256 loanId) external;
    function repayLoan(uint256 loanId) external;
    function liquidatePosition(uint256 loanId) external;

    // --- View Functions ---
    function quoteToken() external view returns (address);
    function worldIdRouter() external view returns (address);
    function isNullifierBlacklisted(uint256 nullifierHash) external view returns (bool);
    function isCollateralAllowed(address token) external view returns (bool);
    function markets(uint256 maturityTimestamp) external view returns (MarketData memory);
    function activeMarkets(uint256 index) external view returns (uint256);
    function lendOffers(uint256 offerId) external view returns (LendOffer memory);
    function borrowRequests(uint256 requestId) external view returns (BorrowRequest memory);
    function loans(uint256 loanId) external view returns (Loan memory);
    function initialLTV() external view returns (uint256);
    function liquidationThreshold() external view returns (uint256);
    function poolKey() external view returns (PoolKey memory);
}