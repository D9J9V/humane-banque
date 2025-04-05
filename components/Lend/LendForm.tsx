"use client";

import { useState } from "react";
import { useVerification } from "@/lib/useVerification";
import { submitLendOffer, daysToMaturityTimestamp, bpsToPercentage } from "@/lib/contracts";

export const LendForm = () => {
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("90"); // Default term
  const [minRateBPS, setMinRateBPS] = useState(200); // Default 2% minimum rate
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
      console.log(`Submitting Lend: Amount=${amount} USDC, Term=${term} days, Min Rate=${bpsToPercentage(minRateBPS)}`);

      // Calculate maturity timestamp from term days
      const maturityTimestamp = daysToMaturityTimestamp(parseInt(term));
      
      // Get the latest World ID verification from the previous step
      // In a real implementation, you'd retrieve this from your backend or state
      const verificationDataResponse = await fetch("/api/user/verified");
      const verificationData = await verificationDataResponse.json();
      
      if (!verificationData || !verificationData.worldIdProof) {
        throw new Error("Verification data not available");
      }
      
      // Submit the lending offer
      const result = await submitLendOffer(
        amount,
        minRateBPS,
        maturityTimestamp,
        verificationData.worldIdProof
      );

      if (result.success) {
        setTransactionHash(result.transactionHash);
        setAmount(""); // Reset form after submission
        console.log("Transaction successful:", result);
      } else {
        setTransactionError(result.error || "Transaction failed");
        console.error("Transaction failed:", result.error);
      }
    } catch (error) {
      console.error("Error submitting lend offer:", error);
      setTransactionError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <form onSubmit={handleSubmit} className="card-body space-y-4">
        <h3 className="card-title">Lend USDC</h3>

        <div className="form-control w-full">
          <label className="label" htmlFor="lend-amount">
            <span className="label-text">Amount (USDC)</span>
          </label>
          <input
            type="number"
            id="lend-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100"
            required
            min="0.01" // Example: Define a sensible minimum lend amount
            step="0.01" // Allow cents for USDC
            className="input input-bordered w-full"
            disabled={isSubmitting}
          />
          {/* Optional: Placeholder for displaying user's available USDC balance */}
          {/* <label className="label">
              <span className="label-text-alt">Balance: 1234.56 USDC</span>
            </label> */}
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="lend-term">
            <span className="label-text">Term (Days)</span>
          </label>
          <select
            id="lend-term"
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
          <label className="label" htmlFor="min-rate">
            <span className="label-text">Minimum Interest Rate</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              id="min-rate"
              min="0"
              max="5000" // 50% in BPS
              step="25"
              value={minRateBPS}
              onChange={(e) => setMinRateBPS(parseInt(e.target.value))}
              className="range range-primary"
              disabled={isSubmitting}
            />
            <span className="badge badge-primary">{bpsToPercentage(minRateBPS)}</span>
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
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {isVerifying ? "Verifying..." : "Submitting..."}
              </>
            ) : (
              isVerified ? "Confirm Lend" : "Verify & Lend"
            )}
          </button>
        </div>
        
        <p className="text-xs text-center text-base-content/70 mt-2">
          {isVerified 
            ? `Estimated annual yield: ${bpsToPercentage(minRateBPS)}+` 
            : "World ID verification required for lending"}
        </p>
      </form>
    </div>
  );
};
