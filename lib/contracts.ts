"use client";

import { ethers } from "ethers";
import { MiniKit } from "@worldcoin/minikit-js";
import AuctionRepoHookABI from "../contracts-unified/artifacts/contracts/AuctionRepoHook.sol/AuctionRepoHook.json";
import { Config } from "@/lib/config";

// Get contract addresses from config
const AUCTION_REPO_HOOK_ADDRESS = Config.contracts.auctionRepoHook;
const USDC_ADDRESS = Config.contracts.usdc;

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
      AuctionRepoHookABI.abi,
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
    
    // First, approve USDC transfer
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      ["function approve(address spender, uint256 amount) public returns (bool)"],
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