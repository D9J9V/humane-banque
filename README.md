# Humane Banque
**Secure Fixed-Term DeFi Lending for Verified Humans**

**Date:** April 5, 2025

## Project Structure

- **Frontend**: Next.js app in the root directory
- **Smart Contracts**: Unified in the [contracts-unified](./contracts-unified) directory

## Overview

Current decentralized finance (DeFi) lending protocols often suffer from duration mismatch risks due to indefinite loan terms, and rely on unsustainable token subsidies for interest rates. 
*Humane Banque* introduces a new paradigm for DeFi lending and borrowing built on the robust infrastructure of Uniswap V4 and World ID's proof-of-humanity. By facilitating fixed-term, collateralized loans with market-driven rates exclusively between verified human participants, Humane Banque offers enhanced predictability, security, and long-term sustainability for consumer finance within the World App ecosystem.

## Core Advantages

- **Predictability & Certainty:** Fixed terms and fixed interest rates eliminate uncertainty for both lenders and borrowers
- **Fair & Transparent Rates:** Auction mechanism allows the market to determine interest rates without artificial subsidies
- **Enhanced Security via Proof-of-Humanity:** World ID verification prevents Sybil attacks on price discovery of rates
- **Reduced Credit Risk:** Over-collateralization with clear framework for managing defaults
- **Sustainable Protocol Design:** No reliance on inflationary token emissions
- **Seamless User Experience:** Integrated as a World App Mini App with intuitive interface

## How It Works

1. **Initiation (`t=0`):** Verified users commit to lend or borrow USDC against collateral for a fixed term. The hook matches these via periodic auctions.
2. **Duration:** Collateral is held securely by the hook while borrowers utilize lenders' capital.
3. **Maturity (`t=T`):** Borrowers repay principal plus fixed interest. The hook returns capital plus interest to lenders and releases collateral back to borrowers.

## Smart Contract Architecture

The core of Humane Banque is the `AuctionRepoHook` smart contract, deployed as a Uniswap V4 Hook. It implements a decentralized, fixed-term, collateralized lending market with key features:

- Fixed maturity dates for all loans (30, 90, 180 days)
- Market-driven rates through transparent auctions
- World ID verification for all participants
- Over-collateralization and liquidation mechanisms
- Borrower accountability through nullifier-based blacklisting

For detailed technical specifications, see the contracts in the `contracts-unified` directory.

## Current Development Status

### Completed

- **Authentication & Verification:**
  - NextAuth with Worldcoin provider
  - Complete World ID verification flow
  - Server-side verification endpoint
  
- **Frontend Foundation:**
  - Multi-screen architecture using Next.js App Router
  - Core navigation components
  - Initial screens (Landing, Dashboard, Lending)
  
- **Smart Contracts:**
  - Core `AuctionRepoHook` implementation
  - World ID integration
  - Auction-based rate discovery
  - Liquidation mechanisms

### Next Steps

1. **Integration:**
   - Connect frontend to smart contracts
   - Implement transaction signing via MiniKit
   
2. **Complete User Flows:**
   - Finish Borrow screen and logic
   - Add portfolio management features
   
3. **Testing & Security:**
   - Comprehensive contract audits
   - Frontend testing and error handling

## Design Philosophy

- **Fixed Terms:** Deliberately chosen to address duration mismatch risk
- **Market-Driven Rates:** Determined entirely by supply and demand in auctions
- **Mandatory Verification:** Every participant must be a unique, verified human
- **Protection Mechanisms:** Over-collateralization, TWAP oracles, automatic liquidation
- **No Native Token:** Focuses on core mechanics with established assets (USDC, ETH, WLD)

## Development Guidelines

### Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm tsc` - Run TypeScript type checking
- `pnpm compile` - Compile smart contracts
- `pnpm test` - Run contract tests
- `pnpm deploy` - Deploy contracts

### Code Style
- **Imports:** Group by external, internal (@/), and relative paths
- **Components:** Use named exports, client/server directives at top
- **Types:** Use TypeScript with strict mode, prefer explicit return types
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Error Handling:** Use conditional rendering for loading/error states
- **Formatting:** Follow Next.js/React best practices, use tailwindcss
- **Authentication:** Use next-auth with Worldcoin provider
- **API Routes:** Place in app/api with proper error handling
