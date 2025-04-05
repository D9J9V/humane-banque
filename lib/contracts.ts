"use client";

import { ethers } from "ethers";
import { MiniKit } from "@worldcoin/minikit-js";
// Minimal ABIs with only the functions we need
const minimalABI = [
  // Lend function
  "function submitLendOffer(uint256 amount, uint16 minRateBPS, uint256 maturityTimestamp, address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external returns (uint256)",
  // Borrow function
  "function submitBorrowRequest(address collateralToken, uint256 collateralAmount, uint256 borrowAmount, uint16 maxRateBPS, uint256 maturityTimestamp, address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external returns (uint256)"
];

// Minimal ERC20 ABI with just the approve function
const minimalERC20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];
import { Config } from "./config";

// Get contract addresses from config
const AUCTION_REPO_HOOK_ADDRESS = Config.contracts.auctionRepoHook;
const USDC_ADDRESS = Config.contracts.usdc;
const ETH_ADDRESS = Config.contracts.eth;
const WLD_ADDRESS = Config.contracts.wld;

// Map token symbols to addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  usdc: USDC_ADDRESS,
  eth: ETH_ADDRESS,
  wld: WLD_ADDRESS
};

// Constants
const DEFAULT_MATURITY_TIMESTAMP = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days from now

/**
 * Initialize ethers contract instance via MiniKit
 */
export const getContract = async () => {
  try {
    if (!MiniKit.isInstalled()) {
      throw new Error("MiniKit is not installed");
    }

    // Request connection and get provider
    const provider = await getProvider();
    
    // Initialize contract with the ABI and address
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      AUCTION_REPO_HOOK_ADDRESS,
      minimalABI,
      signer
    );

    return contract;
  } catch (error) {
    console.error("Error getting contract:", error);
    throw error;
  }
};

/**
 * Get ethers provider via MiniKit
 */
export const getProvider = async () => {
  try {
    if (!MiniKit.isInstalled()) {
      throw new Error("MiniKit is not installed");
    }

    // In the real implementation, MiniKit will provide ethereum access
    // This fallback is for development/testing only
    if (typeof window !== 'undefined' && 'ethereum' in window) {
      // Create provider from window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      return provider;
    } else {
      throw new Error("Ethereum provider not found");
    }
  } catch (error) {
    console.error("Error getting provider:", error);
    throw error;
  }
};

/**
 * Submit a lending offer to the smart contract
 */
export const submitLendOffer = async (
  amount: string,
  minRateBPS: number,
  maturityTimestamp: number = DEFAULT_MATURITY_TIMESTAMP,
  worldIdVerification: any
) => {
  try {
    // Convert amount to Wei (or appropriate units)
    const amountInWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    
    // Get contract instance
    const contract = await getContract();
    
    // Use the minimal ERC20 ABI defined at the top
    
    // First, approve USDC transfer
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      minimalERC20ABI,
      await (await getProvider()).getSigner()
    );
    
    // Approve the contract to spend USDC
    const approveTx = await usdcContract.approve(AUCTION_REPO_HOOK_ADDRESS, amountInWei);
    await approveTx.wait();
    
    // Extract World ID verification params
    const { proof, merkle_root, nullifier_hash } = worldIdVerification;
    
    // Format proof for contract call (example format, adjust based on actual format)
    // In actual implementation, this would parse the proof string correctly
    const proofArray = Array(8).fill(0); // Placeholder for 8-element array required by the contract
    
    // Get the signer
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Submit lend offer
    const tx = await contract.submitLendOffer(
      amountInWei,
      minRateBPS,
      maturityTimestamp,
      signerAddress, // signal (user's address)
      merkle_root,
      nullifier_hash,
      proofArray
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      events: receipt.events
    };
  } catch (error) {
    console.error("Error submitting lend offer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Convert days term to a timestamp
 */
export const daysToMaturityTimestamp = (days: number): number => {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
};

/**
 * Convert BPS to a percentage string (e.g., 500 -> "5.00%")
 */
export const bpsToPercentage = (bps: number): string => {
  return (bps / 100).toFixed(2) + "%";
};

/**
 * Fetch loans where user is the lender
 */
export const fetchLoansByLender = async () => {
  try {
    // In a real implementation, this would query the smart contract
    // Here we're generating mock data for demonstration
    
    // Get contract instance
    const contract = await getContract();
    
    // Get the signer address
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // This is where you would query events or call a view function on the contract
    // For example: const loans = await contract.getLoansByLender(signerAddress);
    
    // For demonstration, we'll use mock data
    const mockLoans = [
      {
        loanId: 1,
        quoteAmount: "1000",
        rateBPS: 500, // 5%
        startTimestamp: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
        maturityTimestamp: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // 60 days from now
        status: "Active",
        borrower: "0x1234...5678"
      },
      {
        loanId: 2,
        quoteAmount: "500",
        rateBPS: 400, // 4%
        startTimestamp: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60), // 10 days ago
        maturityTimestamp: Math.floor(Date.now() / 1000) - (5 * 24 * 60 * 60), // 5 days ago (matured)
        status: "Active", // Ready to be claimed
        borrower: "0x8765...4321"
      }
    ];
    
    return mockLoans;
  } catch (error) {
    console.error("Error fetching loans by lender:", error);
    throw error;
  }
};

/**
 * Fetch loans where user is the borrower
 */
export const fetchLoansByBorrower = async () => {
  try {
    // Similar to fetchLoansByLender, this would query the smart contract
    // Here we're generating mock data for demonstration
    
    // Get the signer address
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // For demonstration, we'll use mock data
    const mockLoans = [
      {
        loanId: 3,
        quoteAmount: "750",
        rateBPS: 450, // 4.5%
        startTimestamp: Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60), // 15 days ago
        maturityTimestamp: Math.floor(Date.now() / 1000) + (75 * 24 * 60 * 60), // 75 days from now
        status: "Active",
        lender: "0xabcd...ef12",
        collateralToken: ETH_ADDRESS,
        collateralAmount: "0.5"
      }
    ];
    
    return mockLoans;
  } catch (error) {
    console.error("Error fetching loans by borrower:", error);
    throw error;
  }
};

/**
 * Claim principal and interest for a matured loan as a lender
 */
export const claimLoanPrincipalAndInterest = async (loanId: number) => {
  try {
    // Get contract instance
    const contract = await getContract();
    
    // In a real implementation, this would call a contract function like:
    // const tx = await contract.claimLoanRepayment(loanId);
    // const receipt = await tx.wait();
    
    // Simulate successful claim with delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      events: []
    };
  } catch (error) {
    console.error("Error claiming loan repayment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Repay a loan as a borrower
 */
export const repayLoan = async (loanId: number) => {
  try {
    // Get contract instance
    const contract = await getContract();
    
    // In a real implementation, this would:
    // 1. Get the repayment amount
    // 2. Approve USDC transfer
    // 3. Call the repay function on the contract
    
    // For example:
    // const repaymentAmount = await contract.calculateRepaymentAmount(loanId);
    // const usdcContract = new ethers.Contract(
    //   USDC_ADDRESS,
    //   ["function approve(address spender, uint256 amount) public returns (bool)"],
    //   await (await getProvider()).getSigner()
    // );
    // const approveTx = await usdcContract.approve(AUCTION_REPO_HOOK_ADDRESS, repaymentAmount);
    // await approveTx.wait();
    // const tx = await contract.repayLoan(loanId);
    // const receipt = await tx.wait();
    
    // Simulate successful repayment with delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      events: []
    };
  } catch (error) {
    console.error("Error repaying loan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

export const submitBorrowRequest = async (
  collateralTokenSymbol: string,
  collateralAmount: string,
  borrowAmount: string,
  maxRateBPS: number,
  maturityTimestamp: number = DEFAULT_MATURITY_TIMESTAMP,
  worldIdVerification: any
) => {
  try {
    // Get collateral token address from symbol
    const collateralToken = TOKEN_ADDRESSES[collateralTokenSymbol.toLowerCase()];
    if (!collateralToken) {
      throw new Error(`Unsupported collateral token: ${collateralTokenSymbol}`);
    }

    // Convert amounts to proper units
    const collateralDecimals = collateralTokenSymbol.toLowerCase() === 'usdc' ? 6 : 18; // ETH and WLD have 18 decimals
    const collateralAmountInWei = ethers.parseUnits(collateralAmount, collateralDecimals);
    const borrowAmountInWei = ethers.parseUnits(borrowAmount, 6); // USDC has 6 decimals
    
    // Get contract instance
    const contract = await getContract();
    
    // Use the minimal ERC20 ABI defined at the top
    
    // First, approve collateral token transfer
    const collateralContract = new ethers.Contract(
      collateralToken,
      minimalERC20ABI,
      await (await getProvider()).getSigner()
    );
    
    // Approve the contract to spend collateral tokens
    const approveTx = await collateralContract.approve(AUCTION_REPO_HOOK_ADDRESS, collateralAmountInWei);
    await approveTx.wait();
    
    // Extract World ID verification params
    const { proof, merkle_root, nullifier_hash } = worldIdVerification;
    
    // Format proof for contract call
    const proofArray = Array(8).fill(0); // Placeholder for 8-element array required by contract
    
    // Get the signer
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Submit borrow request
    const tx = await contract.submitBorrowRequest(
      collateralToken,
      collateralAmountInWei,
      borrowAmountInWei,
      maxRateBPS,
      maturityTimestamp,
      signerAddress, // signal (user's address)
      merkle_root,
      nullifier_hash,
      proofArray
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      events: receipt.events
    };
  } catch (error) {
    console.error("Error submitting borrow request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};