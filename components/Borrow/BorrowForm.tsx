"use client";

import { useState } from "react";
import { useVerification } from "@/lib/useVerification";
import { submitBorrowRequest, daysToMaturityTimestamp, bpsToPercentage } from "@/lib/contracts";

export const BorrowForm = () => {
  const [collateralToken, setCollateralToken] = useState("eth"); // Default to ETH
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [term, setTerm] = useState("90"); // Default term
  const [maxRateBPS, setMaxRateBPS] = useState(1000); // Default 10% max rate
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  const { 
    isVerified, 
    isVerifying, 
    verificationError, 
    triggerVerification
  } = useVerification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setTransactionError(null);
    setTransactionHash(null);

    // Ensure the user is verified first
    if (!isVerified) {
      try {
        setIsSubmitting(true);
        console.log("User not yet verified, triggering verification...");
        const verificationResult = await triggerVerification();
        
        if (!verificationResult) {
          setTransactionError("World ID verification failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Verification error:", error);
        setTransactionError("Verification failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      console.log(`Submitting Borrow: Collateral=${collateralAmount} ${collateralToken.toUpperCase()}, Borrow=${borrowAmount} USDC, Term=${term} days, Max Rate=${bpsToPercentage(maxRateBPS)}`);

      // Calculate maturity timestamp from term days
      const maturityTimestamp = daysToMaturityTimestamp(parseInt(term));
      
      // Get the latest World ID verification from the previous step
      const verificationDataResponse = await fetch("/api/user/verified");
      const verificationData = await verificationDataResponse.json();
      
      if (!verificationData || !verificationData.worldIdProof) {
        throw new Error("Verification data not available");
      }
      
      // Submit the borrow request
      const result = await submitBorrowRequest(
        collateralToken,
        collateralAmount,
        borrowAmount,
        maxRateBPS,
        maturityTimestamp,
        verificationData.worldIdProof
      );

      if (result.success) {
        setTransactionHash(result.transactionHash);
        setCollateralAmount(""); // Reset form after submission
        setBorrowAmount("");
        console.log("Transaction successful:", result);
      } else {
        setTransactionError(result.error || "Transaction failed");
        console.error("Transaction failed:", result.error);
      }
    } catch (error) {
      console.error("Error submitting borrow request:", error);
      setTransactionError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to calculate max borrow amount based on collateral
  // In a real implementation, this would use on-chain data and LTV ratios
  const calculateMaxBorrow = () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) return "0.00";
    
    // Simplified calculation (in reality would use oracle price and LTV ratio)
    // Assuming ETH = $3500, WLD = $5.00
    const collateralValue = collateralToken === "eth" 
      ? parseFloat(collateralAmount) * 3500 
      : parseFloat(collateralAmount) * 5;
    
    // 70% LTV ratio as specified in the contract
    const maxBorrow = collateralValue * 0.7;
    return maxBorrow.toFixed(2);
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <form onSubmit={handleSubmit} className="card-body space-y-4">
        <h3 className="card-title">Borrow USDC</h3>

        <div className="form-control w-full">
          <label className="label" htmlFor="collateral-token">
            <span className="label-text">Collateral Token</span>
          </label>
          <select
            id="collateral-token"
            value={collateralToken}
            onChange={(e) => setCollateralToken(e.target.value)}
            required
            className="select select-bordered w-full"
            disabled={isSubmitting}
          >
            <option value="eth">ETH</option>
            <option value="wld">WLD</option>
          </select>
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="collateral-amount">
            <span className="label-text">{`Collateral Amount (${collateralToken.toUpperCase()})`}</span>
          </label>
          <input
            type="number"
            id="collateral-amount"
            value={collateralAmount}
            onChange={(e) => {
              setCollateralAmount(e.target.value);
              // Optionally auto-calculate the borrow amount based on LTV ratio
              // setBorrowAmount(calculateMaxBorrow());
            }}
            placeholder={`e.g., 1.0 ${collateralToken.toUpperCase()}`}
            required
            min="0.001"
            step="0.001"
            className="input input-bordered w-full"
            disabled={isSubmitting}
          />
          <label className="label">
            <span className="label-text-alt">Max borrow: {calculateMaxBorrow()} USDC</span>
          </label>
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="borrow-amount">
            <span className="label-text">Borrow Amount (USDC)</span>
          </label>
          <input
            type="number"
            id="borrow-amount"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="e.g., 1000"
            required
            min="0.01"
            step="0.01"
            max={calculateMaxBorrow()}
            className="input input-bordered w-full"
            disabled={isSubmitting}
          />
          <label className="label">
            <span className="label-text-alt">
              {parseFloat(borrowAmount) > parseFloat(calculateMaxBorrow()) 
                ? "Amount exceeds maximum allowed based on collateral" 
                : ""}
            </span>
          </label>
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="borrow-term">
            <span className="label-text">Term (Days)</span>
          </label>
          <select
            id="borrow-term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            required
            className="select select-bordered w-full"
            disabled={isSubmitting}
          >
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
          </select>
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="max-rate">
            <span className="label-text">Maximum Interest Rate</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              id="max-rate"
              min="0"
              max="5000" // 50% in BPS
              step="25"
              value={maxRateBPS}
              onChange={(e) => setMaxRateBPS(parseInt(e.target.value))}
              className="range range-primary"
              disabled={isSubmitting}
            />
            <span className="badge badge-primary">{bpsToPercentage(maxRateBPS)}</span>
          </div>
        </div>

        {transactionError && (
          <div className="alert alert-error text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{transactionError}</span>
          </div>
        )}

        {transactionHash && (
          <div className="alert alert-success text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Transaction submitted! Hash: {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}</span>
          </div>
        )}

        <div className="card-actions justify-end">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={
              !collateralAmount || 
              parseFloat(collateralAmount) <= 0 || 
              !borrowAmount || 
              parseFloat(borrowAmount) <= 0 || 
              parseFloat(borrowAmount) > parseFloat(calculateMaxBorrow()) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {isVerifying ? "Verifying..." : "Submitting..."}
              </>
            ) : (
              isVerified ? "Confirm Borrow" : "Verify & Borrow"
            )}
          </button>
        </div>
        
        <p className="text-xs text-center text-base-content/70 mt-2">
          Loans require collateral and are matched at auction
        </p>
      </form>
    </div>
  );
};