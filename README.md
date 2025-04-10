# Humane Banque
**Secure Fixed-Term DeFi Lending for Verified Humans**

**Date:** April 7, 2025

## Project Structure

- **Frontend**: Next.js app in the root directory
- **Smart Contracts**: Unified in the [contracts-unified](./contracts-unified) directory
- **Integration Layer**: Services in the [lib](./lib) directory connect frontend to contracts

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
  - Initial screens (Landing, Dashboard, Lending, Borrowing, Portfolio)
  
- **Smart Contracts:**
  - Core `AuctionRepoHook` implementation
  - World ID integration
  - Auction-based rate discovery
  - Liquidation mechanisms
  - Comprehensive testing of contract functionality

- **Frontend-Contract Integration:**
  - Contract service layer with ethers.js
  - Transaction signing via MiniKit
  - Wallet connection status component
  - Environment-based configuration management
  - Real-time market data display
  - Lending and Borrowing forms with contract interaction

- **User Flows:**
  - Complete Borrow screen and logic with collateral management
  - Portfolio management with position tracking
  - Loan claiming and repayment interfaces
  - Feature flagging for phased release

### Next Steps

1. **Security & Additional Testing:**
   - Comprehensive contract audits
   - Frontend testing and error handling
   - Error boundaries and fallback UI
   
2. **Performance & UX Improvements:**
   - Add transaction status monitoring
   - Implement loading state optimizations
   - Add advanced analytics dashboard
   
3. **Advanced Features:**
   - Liquidation monitoring and notifications
   - Historical rate analysis
   - User profile and transaction history

### Deployment Status

**Successfully Deployed to World Chain!**

The smart contracts have been deployed to World Chain with the following details:

1. **Smart Contract Deployment:**
   - AuctionRepoHook: `0x31E40b7CfC3dF606272ba24A7d961466a5Dc1000`
   - Pool created and initialized with USDC and WLD token pair
   - World ID integration active at: `0x17B354dD2595411ff79041f930e491A4Df39A278`

2. **Token Information:**
   - USDC: `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
   - WLD: `0x2cFc85d8E48F8EAB294be644d9E25C3030863003`
   - Uniswap V4 Pool Manager: `0xb1860D529182ac3BC1F51Fa2ABd56662b7D13f33`

3. **Markets Created:**
   - 30-day term market
   - 90-day term market
   - 180-day term market

To view deployment details, see [contracts-unified/README.md](./contracts-unified/README.md) or run the demo script:
```bash
cd contracts-unified
forge script script/DemoDeployment.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public -vvvv
```

The current version is configured for demonstration with the following considerations:

- Liquidations are currently disabled (`NEXT_PUBLIC_ENABLE_LIQUIDATIONS="false"`) in the default configuration
- Later this month, we will introduce additional liquidity and enable liquidations once optimal parameters are determined
- The `.env.example` file contains all necessary configuration variables for both current demo setup and future enhancements
- For production use, additional security measures and parameter optimization will be implemented

## Design Philosophy

- **Fixed Terms:** Deliberately chosen to address duration mismatch risk
- **Market-Driven Rates:** Determined entirely by supply and demand in auctions
- **Mandatory Verification:** Every participant must be a unique, verified human
- **Protection Mechanisms:** Over-collateralization, TWAP oracles, automatic liquidation
- **No Native Token:** Focuses on core mechanics with established assets (USDC, ETH, WLD)

## Tech Implementation

### Uniswap V4

Humane Banque leverages Uniswap V4's hook system to implement its lending functionality:

- **AuctionRepoHook Contract**: [contracts-unified/contracts/AuctionRepoHook.sol](https://github.com/D9J9V/humane-banque/blob/main/contracts-unified/contracts/AuctionRepoHook.sol) - Core contract implementing the lending market using Uniswap V4 hooks
- **BaseHook Contract**: [contracts-unified/contracts/BaseHook.sol](https://github.com/D9J9V/humane-banque/blob/main/contracts-unified/contracts/BaseHook.sol) - Base implementation for Uniswap V4 hook integration
- **Deployment Scripts**: [contracts-unified/script/](https://github.com/D9J9V/humane-banque/blob/main/contracts-unified/script/) - Scripts for deploying hooks to Uniswap V4
- **Frontend Integration**: [lib/contracts.ts](https://github.com/D9J9V/humane-banque/blob/main/lib/contracts.ts) - JavaScript interface to interact with the Uniswap-based contracts

The AuctionRepoHook uses Uniswap V4's hook system to manage fixed-term loans with auction-based rate discovery, integrating with Uniswap's pools for liquidations and pricing.

### World ID

Humane Banque uses World ID for sybil-resistance and human verification:

- **Verification Hook**: [lib/useVerification.ts](https://github.com/D9J9V/humane-banque/blob/main/lib/useVerification.ts) - Custom React hook for World ID verification flow
- **VerifyButton Component**: [components/Auth/VerifyButton.tsx](https://github.com/D9J9V/humane-banque/blob/main/components/Auth/VerifyButton.tsx) - UI component for World ID verification
- **Smart Contract Integration**: [contracts-unified/contracts/AuctionRepoHook.sol](https://github.com/D9J9V/humane-banque/blob/main/contracts-unified/contracts/AuctionRepoHook.sol) (line 260-281) - Verification logic in the smart contract
- **Backend Verification**: [app/api/verify/route.ts](https://github.com/D9J9V/humane-banque/blob/main/app/api/verify/route.ts) - Server-side verification endpoint

World ID verification ensures each user is a unique human, preventing sybil attacks on the rate discovery mechanism.

## Development Guidelines

### Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm tsc` - Run TypeScript type checking
- `pnpm compile` - Compile smart contracts (run in contracts-unified directory)
- `pnpm test` - Run contract tests (run in contracts-unified directory)
- `pnpm deploy` - Deploy contracts (run in contracts-unified directory)

### Code Style
- **Imports:** Group by external, internal (@/), and relative paths
- **Components:** Use named exports, client/server directives at top
- **Types:** Use TypeScript with strict mode, prefer explicit return types
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Error Handling:** Use conditional rendering for loading/error states
- **Formatting:** Follow Next.js/React best practices, use tailwindcss
- **Authentication:** Use next-auth with Worldcoin provider
- **API Routes:** Place in app/api with proper error handling
- **Contract Interaction:** Use ethers.js via the contracts service
- **Environment Config:** Use config.ts for environment-specific settings
---
