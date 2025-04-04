"use client";

import { useState } from "react";

export const LendForm = () => {
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("90"); // Default term
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log(`Submitting Lend: Amount=${amount} USDC, Term=${term} days`);

    // --- TODO: Implement actual lending logic ---
    // 1. API call to backend to prepare/validate lending request.
    // 2. May involve MiniKit interaction for transaction signing or approval depending on backend implementation.
    // Simulate API call delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // --- End TODO ---

    alert(`Lend Submitted (Simulated): ${amount} USDC for ${term} days`);
    setAmount(""); // Reset form after submission
    setIsSubmitting(false);
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

        <div className="card-actions justify-end">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              "Confirm Lend"
            )}
          </button>
        </div>
        {/* Placeholder for displaying estimated APY based on the selected term and latest auction data */}
        {/* <p className="text-xs text-center text-base-content/70 mt-2">
            Estimated APY based on last auction: X.XX%
          </p> */}
      </form>
    </div>
  );
};
