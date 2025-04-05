# `AuctionRepoHook`: Uniswap V4 Fixed-Term Lending Protocol - Contract Specification

**Version:** 1.0
**Date:** April 5, 2025

## 1. Overview

`AuctionRepoHook.sol` is a smart contract designed to be deployed as a Uniswap V4 Hook. It facilitates a decentralized, fixed-term, collateralized lending and borrowing market, analogous to a repurchase agreement (Repo) market in traditional finance. The protocol aims to provide predictable returns for lenders and fixed costs for borrowers by establishing interest rates through periodic, market-driven auctions. Participation is secured and made Sybil-resistant through mandatory World ID verification. The hook leverages the underlying Uniswap V4 pool for reliable price data (TWAP) and as a liquidity venue for potential collateral liquidations. It introduces an accountability layer via nullifier-based blacklisting for borrowers who default at maturity. This system is accessed by end-users through the user-friendly "Humane Banque" Mini App within World App.

## 2. Goals & Motivation

This protocol directly addresses several critical shortcomings observed in existing DeFi lending platforms:

* **Duration Mismatch Risk:** Indefinite term loans create systemic risks. We implement **fixed maturity dates** for all loans, providing certainty and stability.
* **Unsustainable Interest Rates:** Artificial yields driven by token subsidies are fragile. We establish **market-driven rates** via transparent auctions based on real supply and demand from verified humans.
* **Sybil Vulnerability:** Anonymous systems are prone to manipulation. We mandate **World ID verification** to ensure a fair, human-centric marketplace resistant to bots and Sybil attacks.
* **Lack of Accountability:** Default risk is often socialized or carries insufficient consequences. We introduce **borrower accountability** through nullifier-based blacklisting upon default, aiming to improve overall system health and potentially lower rates long-term.
* **Complexity & Opacity:** Many DeFi protocols are difficult to understand. While the underlying hook is complex, the end-user experience via the "Humane Banque" Mini App prioritizes **simplicity and clarity**.

Our goal is to create a more robust, sustainable, and trustworthy foundation for DeFi lending, drawing lessons from traditional finance while leveraging the unique capabilities of blockchain, Uniswap V4, and World ID.

## 3. Key Concepts

* **Fixed Terms:** All lending/borrowing agreements have a predetermined maturity date (e.g., 30 days, 90 days).
* **Repo Structure:** Functionally similar to a repo: a borrower effectively sells collateral with an agreement to repurchase it at maturity by repaying the principal plus interest.
* **Auction Mechanism:** Periodic auctions (e.g., daily per maturity) match lender offers and borrower requests to determine a single clearing interest rate for that period's new loans.
* **Market-Driven Rates:** The clearing rate is solely determined by auction supply and demand, not by algorithms or subsidies.
* **World ID Integration:** Mandatory proof-of-humanity using World ID nullifiers ensures unique human participants and prevents Sybil attacks.
* **Over-Collateralization:** Borrowers must lock collateral valued significantly higher than the loan amount, secured via TWAP pricing.
* **TWAP Oracle:** Utilizes the underlying Uniswap V4 pool's Time-Weighted Average Price oracle for reliable, manipulation-resistant collateral valuation and liquidation checks. (Note: This contrasts with oracleless designs like the Instadapp concept, as we believe TWAP provides sufficient security for specific price checks needed here).
* **Liquidation:** A mechanism to protect lenders by selling borrower collateral on the spot market if its value falls below a predefined threshold relative to the loan amount, or if the loan is not repaid at maturity.
* **Nullifier Blacklisting:** An internal accountability mechanism where the World ID nullifier hash of a borrower who defaults *at maturity* is recorded, preventing them from initiating new borrow requests within this protocol.

## 4. Actors

* **Lenders:** Users who supply quote tokens (e.g., USDC) to the hook via `submitLendOffer`, seeking fixed-term yield. They must be World ID verified.
* **Borrowers:** Users who lock collateral tokens (e.g., WLD, ETH) and borrow quote tokens via `submitBorrowRequest`, agreeing to a fixed rate and term. They must be World ID verified.
* **`AuctionRepoHook` (The Contract):** Acts as the facilitator, registry, escrow agent, auctioneer, and enforcer of the protocol rules.
* **Auction Runner:** An authorized address (initially Owner, potentially decentralized later) responsible for triggering the `runAuction` function periodically.
* **Liquidators:** Any external actor who calls `liquidatePosition` when a loan meets liquidation criteria (potentially incentivized by a small bonus from the liquidated collateral).
* **`PoolManager` / Uniswap V4 Pool:** Provides the underlying infrastructure, including the TWAP oracle feed and the spot market venue for liquidations. Standard LPs of this pool are *not* directly involved in the lending/borrowing risk but benefit from swap fees generated by liquidations.
* **World ID Router:** External contract used to verify World ID proofs.

## 5. Core Mechanisms / Logic Flow

### 5.1. Market & Auction Setup
* The contract manages distinct markets based on loan maturity timestamps (e.g., market for loans maturing June 4, 2025).
* Auctions for each active maturity run periodically (e.g., daily) triggered by the `Auction Runner`. `MarketData` struct tracks state.

### 5.2. Pre-Auction: Submitting Offers & Requests
* **Lenders:** Call `submitLendOffer` specifying maturity, USDC amount, and minimum acceptable annual rate. The USDC is transferred to and held by the hook.
* **Borrowers:** Call `submitBorrowRequest` specifying maturity, collateral type/amount, desired USDC amount, maximum acceptable annual rate, and provide a valid World ID proof (signal, root, nullifier, ZK proof).
    * The hook verifies the World ID proof via `worldIdRouter`.
    * It checks the provided `nullifierHash` against the `isNullifierBlacklisted` mapping. Rejects if blacklisted.
    * It verifies the collateral is allowed and checks if the requested loan amount respects the Initial LTV ratio based on the collateral's current TWAP value (`_getCollateralValueUSD`).
    * If valid, the hook transfers the collateral from the borrower to be held by the hook.
    * The request and the verified `nullifierHash` are stored.

### 5.3. Auction Execution (`runAuction`)
* Triggered periodically for a specific maturity `T`.
* Aggregates all pending valid `lendOffers` and `borrowRequests` for that maturity.
* Sorts offers by `minRate` (ascending) and requests by `maxRate` (descending).
* Determines the **clearing rate**: the single rate at which the maximum volume can be matched between lenders willing to lend at or below that rate, and borrowers willing to borrow at or above that rate. (e.g., Uniform Clearing Price auction).
* Stores the `clearingRate` in `markets[T].lastClearingRate`.
* Creates `Loan` structs for all matched offers/requests, recording the `clearingRate`, participants, amounts, collateral details, maturity, `borrowerNullifier`, etc. Status set to `Pending`.
* Unmatched offers/requests remain pending for the next auction cycle (or could be designed to expire).

### 5.4. Loan Initiation (`claimLoan`)
* After a successful auction, matched borrowers call `claimLoan` for their specific `loanId`.
* The hook verifies the caller and loan status (`Pending`).
* It transfers the `quoteAmountLent` (USDC) from its balance (funded by matched lenders' offers) to the borrower.
* Updates loan status to `Active` and records `startTimestamp`.

### 5.5. Loan Lifecycle & Repayment (`repayLoan`)
* Loans remain `Active` until maturity `T`.
* At or before `T`, the borrower calls `repayLoan`.
* Calculates total repayment: `principal + interest = quoteAmountLent * (1 + annualRate * durationSeconds / YEAR_IN_SECONDS_BPS)`.
* Borrower transfers the repayment amount (USDC) to the hook.
* Hook verifies the amount, transfers `principal + interest` to the original lender associated with the loan.
* Hook transfers the locked `collateralAmountDeposited` back to the borrower.
* Updates loan status to `Repaid`.

### 5.6. Collateral Management & Pricing (`_getCollateralValueUSD`)
* The hook periodically (or upon specific checks like liquidation attempts) needs to value the locked collateral.
* It calls the underlying pool's oracle function (via `poolManager`) using the stored `poolKey`, requesting TWAP data over a defined interval (e.g., `twapInterval = 1800` seconds).
* Calculates the time-weighted average price and thus the current value of the deposited collateral in terms of the quote token (USDC).

### 5.7. Liquidation (`liquidatePosition`)
* **Trigger Conditions:**
    1.  **Undercapitalization:** Anyone can call `liquidatePosition` if `_getCollateralValueUSD` shows the current Loan-to-Value (`loanAmount / collateralValue`) exceeds the `liquidationThreshold` (e.g., 85%).
    2.  **Default at Maturity:** If `block.timestamp >= maturityTimestamp` and the loan status is still `Active` (not `Repaid`). This triggers forced liquidation.
* **Process:**
    1.  Verify trigger conditions met. Mark loan status appropriately.
    2.  Seize the `collateralAmountDeposited`.
    3.  Calculate the amount of collateral needed to cover the `debtOwed = principal + accruedInterest + liquidationPenalty`.
    4.  Initiate a `swap` via `poolManager` on the underlying pool (WLD/USDC) to sell the calculated amount of collateral (WLD) for the quote token (USDC). *This requires the hook to have swap permissions or use a delegatecall/callback mechanism.*
    5.  Distribute the received USDC:
        * Repay the lender `principal + accruedInterest`.
        * (Optional) Pay a small bonus to the `liquidator` (caller of the function).
        * (Optional) Send any remaining USDC (if collateral value > debt + penalty) back to the borrower, or to a protocol treasury. If USDC received < debt, lender bears the small loss (mitigated by initial over-collateralization).
    6.  Update loan status (e.g., `Defaulted_RepaidByLiquidation`).

### 5.8. Blacklisting Mechanism
* If liquidation is triggered specifically because the loan reached `maturityTimestamp` and was not repaid (Condition 2 above):
    * After successful liquidation and fund distribution.
    * Retrieve the `borrowerNullifier` stored in the `Loan` struct.
    * Set `isNullifierBlacklisted[borrowerNullifier] = true`.
    * Emit `DefaulterBlacklisted` event.
* The `submitBorrowRequest` function checks this mapping using the nullifier provided in the World ID proof before accepting a new request.

## 6. Uniswap V4 Hook Interaction

* **`afterInitialize`:** Essential callback used once upon hook registration to store the `PoolKey` which identifies the specific pool instance this hook is tied to.
* **Oracle Queries:** The hook makes *direct calls* to the pool's oracle function (e.g., `poolManager.getOracleData`) from within its internal logic (`_getCollateralValueUSD`, liquidation checks) using the stored `poolKey`. It doesn't rely on `before/afterSwap` callbacks for *reading* the TWAP, but relies on the pool *updating* its internal accumulators correctly during those callbacks.
* **Liquidation Swaps:** The `liquidatePosition` function initiates a `swap` transaction via the `IPoolManager` interface, targeting the pool identified by `poolKey`. This action *will* trigger the standard `beforeSwap`/`afterSwap` callbacks on the pool itself, just like any other swap. If the hook needs to perform actions *during* its own liquidation swap (unlikely for simple liquidation), it might need swap callback permissions.

## 7. Security Considerations

* **Smart Contract Risk:** Auditing is paramount. Focus on auction logic, state transitions, arithmetic precision, access controls, and reentrancy guards.
* **World ID Security:** Relies on the security of the World ID protocol and its implementation (proof verification, nullifier uniqueness).
* **Oracle Risk (TWAP):** While TWAP is manipulation-resistant over longer periods, extreme market volatility or sandwich attacks around the *exact moment* of an oracle read could still pose minor risks. Using a sufficiently long `twapInterval` mitigates this. This is a trade-off against oracleless designs which may have different risks (e.g., reliance on internal AMM state for pricing).
* **Liquidation Risk:** Requires sufficient liquidity in the underlying pool for efficient execution. Slippage during large liquidations is possible. Correct calculation of liquidation thresholds and penalties is crucial.
* **Blacklisting:** Mechanism relies on correct identification of default *at maturity*. Must avoid unfairly blacklisting users due to pre-maturity liquidations caused solely by market volatility where the debt was fully covered. Privacy implications of storing/checking nullifiers must be accepted.
* **Centralization Risk:** The `runAuction` function is initially permissioned (`Ownable`). Requires a path towards decentralization (keeper network, internal triggers).

## 8. State Variables & Structs

(Referencing the structs `Offer`, `Request`, `Loan`, `MarketData` and key state variables defined in the Solidity skeleton provided previously).

## 9. Key Functions (External Interface)

* `submitLendOffer(maturity, amount, minRate)`
* `submitBorrowRequest(maturity, collateralToken, collateralAmount, quoteAmountRequested, maxRate, worldIdProofDetails...)`
* `runAuction(maturity)` (Permissioned)
* `claimLoan(loanId)`
* `repayLoan(loanId)`
* `liquidatePosition(loanId)`
* (Read functions for viewing market data, loan status, offers, requests etc.)

## 10. Future Considerations

* Support for multiple collateral types.
* Decentralizing the `runAuction` trigger.
* On-chain governance for parameters (LTVs, penalties, allowed collaterals).

---
