FAQ highlighting the opinionated design decisions behind Humane Banque, framed for clarity and transparency.

---

**Humane Banque - Design Philosophy FAQ**

**Last Updated:** April 5, 2025

This FAQ explains the core design principles and choices behind Humane Banque, aiming to clarify *why* the protocol operates the way it does.

**1. Q: Why does Humane Banque use fixed terms (e.g., 30, 90 days) instead of letting users borrow/lend indefinitely like other DeFi protocols?**

**A:** We deliberately chose fixed terms to address the significant **duration mismatch risk** inherent in indefinite lending protocols. When assets are locked for uncertain periods, it can lead to instability, similar to bank runs in traditional finance. Fixed terms provide **predictability and certainty** for both parties:
    * **Lenders:** Know exactly when their capital plus fixed interest will be returned.
    * **Borrowers:** Know exactly when their loan is due and the fixed interest cost, simplifying financial planning.
    This structure mirrors established financial instruments like bonds, term deposits, and repos, promoting a more stable and manageable risk environment.

**2. Q: How are Humane Banque's interest rates determined? Why aren't they as high as some yields seen elsewhere in DeFi?**

**A:** Interest rates are determined entirely by **market supply and demand** through periodic **auctions** conducted by the underlying `AuctionRepoHook` smart contract. Verified human lenders and borrowers indicate their desired rates for specific fixed terms, and the auction mechanism finds the clearing rate where supply meets demand. We fundamentally believe this is the only sustainable way to determine rates.
    We consciously **avoid artificial subsidies** (often paid via inflationary protocol tokens) that create temporarily high but ultimately unsustainable APYs. Such subsidies mask the true risk and cost of capital. Humane Banque prioritizes **long-term economic viability and transparency** over short-term, inflated yields.

**3. Q: Why is verifying with World ID absolutely mandatory to use Humane Banque?**

**A:** This is a cornerstone of our "Humane" philosophy and a critical security feature. Requiring World ID verification ensures that **every participant is a unique, verified human**. This achieves several key goals:
    * **Sybil Resistance:** Prevents bots or single entities with multiple wallets from manipulating the interest rate auctions or unfairly accessing loans/deposits.
    * **Fair Market:** Guarantees that the discovered interest rates reflect genuine human supply and demand.
    * **Enhanced Trust:** Creates a lending environment exclusively among verified participants, reducing risks associated with anonymous or potentially malicious actors.

**4. Q: Besides World ID, how does Humane Banque protect lenders' funds?**

**A:** We employ standard best practices for secured lending, combined with our unique features:
    * **Over-Collateralization:** Borrowers must pledge collateral (like ETH, WLD) worth significantly more than the loan amount (USDC).
    * **Reliable Price Feeds:** We use Uniswap V4's built-in TWAP (Time-Weighted Average Price) oracles for robust, manipulation-resistant valuation of collateral.
    * **Liquidation Mechanism:** If collateral value drops below a safe threshold relative to the loan value, the protocol automatically liquidates the collateral on the underlying Uniswap spot market to protect the lender's principal.
    * **Accountability:** Our system includes measures to disincentivize defaults (see next point).

**5. Q: What happens if a borrower defaults (doesn't repay)? What is the "defaulter blacklisting"?**

**A:** If a borrower fails to repay their loan by the maturity date, their collateral is automatically liquidated by the protocol to make the lender whole. To foster accountability and maintain the long-term health of the lending pool, we implement an **internal reputation mechanism**.
    The unique, anonymous **World ID nullifier hash** associated with the defaulted loan is recorded by the `AuctionRepoHook`. This specific verified human (identified only by this private nullifier within the context of Humane Banque) will be **prevented from taking out *new* loans** via the protocol.
    This is **not a public list** and doesn't reveal identity, but it acts as an internal control to deter repeat defaults and reduce overall credit risk. By ensuring accountability, we aim to increase lender confidence, which can contribute to **lower interest rates for all responsible borrowers** over time.

**6. Q: Why build this using Uniswap V4 Hooks? Isn't that just for swaps?**

**A:** Uniswap V4's hook architecture is incredibly flexible. It allows us to embed our custom auction and fixed-term lending/repo logic directly into the Uniswap ecosystem. This provides crucial advantages:
    * **Access to Liquidity:** We can efficiently liquidate collateral using the deep liquidity of the underlying Uniswap V4 spot pool.
    * **Reliable Oracles:** We leverage the pool's robust on-chain TWAP data for collateral pricing.
    * **Integration:** It allows our specialized lending protocol to coexist seamlessly within the broader, trusted DeFi infrastructure of Uniswap. The hook *augments* the pool's capabilities.

**7. Q: Does Humane Banque have its own governance or utility token?**

**A:** No. We made a deliberate decision to **avoid introducing a new token**. The protocol's value proposition relies on its core mechanics: providing secure, predictable, fixed-term lending with market-driven rates using established assets (USDC, ETH, WLD). We believe this leads to a more fundamentally sound and sustainable economic model, free from the complexities, inflation, and speculative pressures often associated with native protocol tokens.

**8. Q: The underlying mechanics sound complex. Is Humane Banque difficult for end-users?**

**A:** While the underlying `AuctionRepoHook` protocol incorporates sophisticated financial and blockchain concepts, the **Humane Banque Mini App experience in World App is designed for simplicity and ease of use**. We abstract away all the complexity. Users interact with a clean interface focused on straightforward actions: choosing a term, entering an amount to deposit or borrow, seeing clear fixed rates and returns, and managing their positions – much like a modern digital banking application, but built on decentralized, human-verified principles.

---
