## This template provides a minimal setup to get Next.js working with MiniKit

## Setup

```bash
cp .env.example .env
pnpm i
pnpm dev

```

To run as a mini app choose a production app in the dev portal and use NGROK to tunnel. Set the `NEXTAUTH_URL` and the redirect url if using sign in with worldcoin to that ngrok url

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To use the application, you'll need to:

1. **Get World ID Credentials**
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Get `DEV_PORTAL_API_KEY` from the API Keys section
   - Navigate to "Sign in with World ID" page to get:
     - `WLD_CLIENT_ID`
     - `WLD_CLIENT_SECRET`

2. **Configure Action**
   - In the Developer Portal, create an action in the "Incognito Actions" section
   - Use the same action name in `components/Verify/index.tsx`

View docs: [Docs](https://docs.world.org/)

[Developer Portal](https://developer.worldcoin.org/)
---
# Humane Banque
**Secure Fixed-Term DeFi Lending for Verified Humans**

**Date:** April 5, 2025

Abstract:

Current decentralized finance (DeFi) lending protocols often suffer from indefinite loan terms, leading to duration mismatch risks, and rely on unsustainable token subsidies for interest rates. Humane Banque introduces a new paradigm for DeFi lending and borrowing built on the robust infrastructure of Uniswap V4 and World ID's proof-of-humanity. By facilitating fixed-term, collateralized loans with market-driven rates exclusively between verified human participants, Humane Banque offers enhanced predictability, security, and long-term sustainability for consumer finance within the World App ecosystem.

**1. The Challenge in Current DeFi Lending**

DeFi lending platforms face fundamental challenges:

- **Indefinite Terms & Duration Mismatch:** Open-ended loans create unpredictable liabilities for protocols and liquidity risks for users, mirroring vulnerabilities seen in traditional finance.
- **Unsustainable Rates:** Artificially high yields, often subsidized by inflationary protocol tokens, mask true market rates and create unstable economic models vulnerable to collapse.
- **Sybil Vulnerability:** Protocols struggle to differentiate between genuine users and bots, making them susceptible to manipulation in governance and market dynamics.

**2. Introducing Humane Banque: A New Paradigm**

Humane Banque leverages the composability of Uniswap V4 hooks and the security of World ID to create a fundamentally sounder lending market. Accessed via an intuitive Mini App within World App, it facilitates:

- **Fixed-Term Lending/Borrowing:** Loans and deposits have clear maturity dates (e.g., 30, 90, 180 days).
- **Market-Driven Interest Rates:** Rates are discovered transparently through periodic auctions run by the underlying `AuctionRepoHook`, reflecting genuine supply and demand.
- **Human-Centric Design:** Participation is restricted to unique humans verified via World ID.

**3. Key Advantages of Humane Banque**

- **Predictability & Certainty:** Fixed terms and fixed interest rates eliminate uncertainty for both lenders (predictable APY) and borrowers (predictable APR and repayment amount). This removes the risk associated with floating rates common in other protocols.
	- We present the last same-term stats: Auction Rate and Effective Rate, Where Effective Rate is the aggregate rate repayed net of liquidation losses
- **Fair & Transparent Rates:** By using an auction mechanism, Humane Banque allows the market (of verified humans) to determine interest rates for various terms, creating a true yield curve without artificial subsidies or external manipulation.
- **Enhanced Security via Proof-of-Humanity:** Mandatory World ID verification ensures all participants are unique humans, preventing Sybil attacks on rate discovery auctions and fostering a trusted environment. This directly addresses bot-related risks prevalent in DeFi.
- **Reduced Credit Risk & Increased Accountability:** Combining over-collateralization with a clear framework for managing defaults (including accountability measures for borrowers who fail to meet obligations, safeguarding lender capital) significantly de-risks the system for lenders and promotes responsible borrowing.
- **Sustainable Protocol Design:** The protocol does not rely on inflationary token emissions to bootstrap yield. Its economic model, based on market-discovered rates and potentially small protocol fees, is designed for long-term viability.
- **Seamless User Experience:** Integrated as a World App Mini App, Humane Banque offers a simple, intuitive interface that abstracts away the underlying blockchain complexity, making secure fixed-term DeFi accessible to a broader audience.

**4. How It Works (Simplified)**

Humane Banque functions like an on-chain repo market facilitated by a Uniswap V4 hook:

1. **Initiation (`t=0`):** Verified users commit to lend USDC or borrow USDC against collateral (e.g., ETH, WLD) for a fixed term via the Mini App. The hook matches these via periodic auctions, establishing the fixed interest rate.
2. **Duration:** Collateral is held securely by the hook. Lenders' capital is utilized by borrowers.
3. **Maturity (`t=T`):** Borrowers repay the principal plus the fixed interest. The hook returns capital plus interest to lenders and releases collateral back to borrowers. The process enforces accountability for repayment.

**5. Conclusion**

Humane Banque represents a significant step forward in building a more stable, transparent, and human-centric DeFi. By combining the architectural innovations of Uniswap V4 with the foundational security of World ID, it offers a predictable and reliable platform for fixed-term lending and borrowing. It addresses critical flaws in existing models, paving the way for more sustainable and trustworthy financial applications within the growing World App ecosystem.

---
