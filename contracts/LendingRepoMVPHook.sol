// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- Interfaces ---
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/contracts/libraries/PoolKey.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
// Assuming BaseHook is available - adjust path as needed
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

// OpenZeppelin Interfaces/Contracts
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LendingRepoMVP_Hook
 * @notice MVP hook demonstrating fixed-term P2P lending/borrowing gated by World ID.
 * @dev Shows core structured debt concept (term loan, collateral) via hooks.
 * Does NOT include auctions, interest, or liquidations for MVP simplicity.
 */
contract LendingRepoMVP_Hook is BaseHook, Ownable /*, ReentrancyGuard */ {
    // using SafeERC20 for IERC20; // Recommended

    // --- Structs ---
    enum RequestStatus {
        Pending,
        Funded,
        Cancelled
    }
    struct LoanRequest {
        uint requestId;
        address borrower;
        address collateralToken;
        uint collateralAmount;
        uint quoteAmountRequested; // e.g., USDC
        uint maturityTimestamp;
        uint256 borrowerNullifier; // Nullifier used by borrower to make request
        RequestStatus status;
    }

    enum LoanStatus {
        Active,
        Repaid,
        Defaulted
    }
    struct ActiveLoan {
        uint loanId;
        uint requestId; // Link back to the original request
        address lender;
        address borrower;
        address collateralToken;
        uint collateralAmountDeposited;
        uint quoteAmountLent; // Principal amount lent
        uint maturityTimestamp;
        uint256 borrowerNullifier; // Original nullifier of borrower
        uint256 lenderNullifier; // Nullifier used by lender to fund
        LoanStatus status;
    }

    // --- State Variables ---

    IWorldID public immutable worldIdRouter;
    address public immutable quoteToken; // e.g., USDC address

    mapping(uint256 => bool) public isNullifierBlacklisted;

    mapping(uint => LoanRequest) public loanRequests;
    uint public nextRequestId = 1;

    mapping(uint => ActiveLoan) public activeLoans;
    uint public nextLoanId = 1;

    mapping(address => bool) public isCollateralAllowed; // Owner can add allowed collaterals

    PoolKey public poolKey;

    // --- Events ---
    event PoolKeySet(PoolKey key);
    event UserBlacklisted(uint256 indexed nullifierHash);
    event UserUnblacklisted(uint256 indexed nullifierHash);
    event CollateralAllowed(address indexed token, bool allowed);
    event LoanRequested(
        uint indexed requestId,
        address indexed borrower,
        address collateralToken,
        uint collateralAmount,
        uint quoteAmount,
        uint maturityTimestamp,
        uint256 borrowerNullifier
    );
    event LoanRequestCancelled(uint indexed requestId);
    event LoanFunded(
        uint indexed loanId,
        uint indexed requestId,
        address indexed lender,
        address indexed borrower,
        uint quoteAmount,
        uint maturityTimestamp,
        uint256 lenderNullifier
    );
    event LoanRepaid(uint indexed loanId);
    event LoanDefaultDeclared(uint indexed loanId);

    // --- Constructor ---
    constructor(
        IPoolManager _poolManager,
        IWorldID _worldIdRouter,
        address _quoteToken,
        address _initialOwner
    ) BaseHook(_poolManager) Ownable(_initialOwner) {
        require(
            _quoteToken != address(0),
            "Quote token cannot be zero address"
        );
        worldIdRouter = _worldIdRouter;
        quoteToken = _quoteToken;
    }

    // --- Hook Overrides ---
    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({ // Minimal permissions
                beforeInitialize: false,
                afterInitialize: true,
                beforeModifyPosition: false,
                afterModifyPosition: false,
                beforeSwap: false,
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false
            });
    }

    function afterInitialize(PoolKey calldata key) public override {
        require(key.hooks == address(this), "Invalid hook address");
        require(poolKey.hooks == address(0), "PoolKey already set");
        require(
            key.currency0 == quoteToken ||
                key.currency1 == quoteToken ||
                isCollateralAllowed[key.currency0] ||
                isCollateralAllowed[key.currency1],
            "Pool must involve quote or allowed collateral token"
        );
        poolKey = key;
        emit PoolKeySet(key);
    }

    // --- Internal Verification Logic ---
    function _verifyProofAndCheckBlacklist()
        internal
        view
        returns (/* ... params ... */ uint256)
    {
        // ... same implementation as previous MVP ...
        // require(!isNullifierBlacklisted[nullifierHash], "LendingRepoMVP: User is blacklisted");
        // try worldIdRouter.verifyProof(...) catch { revert("LendingRepoMVP: Invalid World ID proof"); }
        // return nullifierHash;
    }

    // --- Admin Functions ---
    function ownerAllowCollateral(
        address token,
        bool allowed
    ) external onlyOwner {
        isCollateralAllowed[token] = allowed;
        emit CollateralAllowed(token, allowed);
    }

    // --- Core MVP Functions ---

    /**
     * @notice Borrower requests a fixed-term loan, locking collateral. Requires World ID.
     */
    function requestLoan(
        address collateralToken,
        uint collateralAmount,
        uint quoteAmountRequested,
        uint maturityTimestamp,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external /* nonReentrant */ {
        require(isCollateralAllowed[collateralToken], "Collateral not allowed");
        require(collateralAmount > 0, "Collateral amount must be positive");
        require(quoteAmountRequested > 0, "Requested amount must be positive");
        require(
            maturityTimestamp > block.timestamp,
            "Maturity must be in the future"
        );

        uint256 borrowerNullifier = _verifyProofAndCheckBlacklist(
            signal,
            root,
            nullifierHash,
            proof
        );

        // Transfer collateral from borrower to hook
        bool success = IERC20(collateralToken).transferFrom(
            msg.sender,
            address(this),
            collateralAmount
        );
        require(success, "Collateral transfer failed");

        uint requestId = nextRequestId++;
        loanRequests[requestId] = LoanRequest({
            requestId: requestId,
            borrower: msg.sender,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            quoteAmountRequested: quoteAmountRequested,
            maturityTimestamp: maturityTimestamp,
            borrowerNullifier: borrowerNullifier,
            status: RequestStatus.Pending
        });

        emit LoanRequested(
            requestId,
            msg.sender,
            collateralToken,
            collateralAmount,
            quoteAmountRequested,
            maturityTimestamp,
            borrowerNullifier
        );
    }

    /**
     * @notice Lender funds an existing loan request. Requires World ID.
     */
    function fundLoanRequest(
        uint requestId,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external /* nonReentrant */ {
        LoanRequest storage request = loanRequests[requestId];
        require(request.requestId != 0, "Request not found");
        require(request.status == RequestStatus.Pending, "Request not pending");

        uint256 lenderNullifier = _verifyProofAndCheckBlacklist(
            signal,
            root,
            nullifierHash,
            proof
        );

        // Transfer quote token from lender (msg.sender) to hook
        bool successLender = IERC20(quoteToken).transferFrom(
            msg.sender,
            address(this),
            request.quoteAmountRequested
        );
        require(successLender, "Lender quote token transfer failed");

        // Transfer quote token from hook to borrower
        bool successBorrower = IERC20(quoteToken).transfer(
            request.borrower,
            request.quoteAmountRequested
        );
        require(successBorrower, "Borrower quote token transfer failed");

        // Update request status
        request.status = RequestStatus.Funded;

        // Create active loan record
        uint loanId = nextLoanId++;
        activeLoans[loanId] = ActiveLoan({
            loanId: loanId,
            requestId: requestId,
            lender: msg.sender,
            borrower: request.borrower,
            collateralToken: request.collateralToken,
            collateralAmountDeposited: request.collateralAmount, // Already held by hook
            quoteAmountLent: request.quoteAmountRequested,
            maturityTimestamp: request.maturityTimestamp,
            borrowerNullifier: request.borrowerNullifier,
            lenderNullifier: lenderNullifier,
            status: LoanStatus.Active
        });

        emit LoanFunded(
            loanId,
            requestId,
            msg.sender,
            request.borrower,
            request.quoteAmountRequested,
            request.maturityTimestamp,
            lenderNullifier
        );
    }

    /**
     * @notice Borrower repays the loan principal (no interest in MVP).
     */
    function repayLoan(uint loanId) external /* nonReentrant */ {
        ActiveLoan storage loan = activeLoans[loanId];
        require(loan.loanId != 0, "Loan not found");
        require(msg.sender == loan.borrower, "Only borrower can repay");
        require(loan.status == LoanStatus.Active, "Loan not active");
        // Allow repayment up to maturity for simplicity in MVP
        require(
            block.timestamp <= loan.maturityTimestamp,
            "Repayment past maturity not allowed (use declareDefault)"
        );

        // Transfer principal from borrower back to hook
        bool successBorrower = IERC20(quoteToken).transferFrom(
            msg.sender,
            address(this),
            loan.quoteAmountLent
        );
        require(successBorrower, "Borrower repayment transfer failed");

        // Transfer principal from hook to lender
        bool successLender = IERC20(quoteToken).transfer(
            loan.lender,
            loan.quoteAmountLent
        );
        require(successLender, "Lender principal transfer failed");

        // Return collateral from hook to borrower
        bool successCollateral = IERC20(loan.collateralToken).transfer(
            loan.borrower,
            loan.collateralAmountDeposited
        );
        require(successCollateral, "Collateral return failed");

        loan.status = LoanStatus.Repaid;
        emit LoanRepaid(loanId);
    }

    /**
     * @notice Allows anyone to declare a loan defaulted if maturity passed and not repaid.
     * @dev MVP: Only blacklists borrower, does not liquidate/distribute collateral.
     */
    function declareDefault(uint loanId) external /* nonReentrant */ {
        ActiveLoan storage loan = activeLoans[loanId];
        require(loan.loanId != 0, "Loan not found");
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(
            block.timestamp > loan.maturityTimestamp,
            "Loan not past maturity"
        );

        loan.status = LoanStatus.Defaulted;

        // Blacklist the borrower
        _blacklist(loan.borrowerNullifier); // Use internal function

        emit LoanDefaultDeclared(loanId);
        // Note: In this MVP, lender loses funds and collateral remains locked.
    }

    // --- Blacklist Management ---
    function ownerAddToBlacklist(uint256 _nullifierHash) external onlyOwner {
        _blacklist(_nullifierHash);
    }

    function ownerRemoveFromBlacklist(
        uint256 _nullifierHash
    ) external onlyOwner {
        require(_nullifierHash != 0, "Invalid nullifier");
        require(isNullifierBlacklisted[_nullifierHash], "Not blacklisted"); // Check before removing
        isNullifierBlacklisted[_nullifierHash] = false;
        emit UserUnblacklisted(_nullifierHash);
    }

    function _blacklist(uint256 _nullifierHash) internal {
        require(_nullifierHash != 0, "Invalid nullifier");
        if (!isNullifierBlacklisted[_nullifierHash]) {
            // Prevent re-blacklisting/event spam
            isNullifierBlacklisted[_nullifierHash] = true;
            emit UserBlacklisted(_nullifierHash);
        }
    }

    // Add function for borrower to cancel UNfunded requests? Optional for MVP.
    // function cancelLoanRequest(uint requestId) external { ... require(msg.sender == request.borrower && request.status == Pending) ... transfer collateral back ... }
}
