"use client";

import { useState } from "react";

export const LendForm = () => {
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("90"); // Default term
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log(`Submitting Lend: Amount=${amount} USDC, Term=${term} days`);

    // --- TODO: Implement actual lending logic ---
    // 1. API call to backend to prepare/validate.
    // 2. MiniKit interaction if needed for signing/sending tx.
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // --- End TODO ---

    alert(`Lend Submitted (Simulated): ${amount} USDC for ${term} days`);
    setAmount(""); // Reset form
    setIsSubmitting(false);
  };

  return (
    // Use DaisyUI Card and Form Control
    <div className="card bg-base-100 shadow-md">
      <form onSubmit={handleSubmit} className="card-body space-y-4">
        <h3 className="card-title">Lend USDC</h3>

        {/* Amount Input */}
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
            min="0.01" // Example minimum
            step="0.01"
            className="input input-bordered w-full" // DaisyUI input class
            disabled={isSubmitting}
          />
          {/* Optional: Add balance display here */}
          {/* <label className="label">
                        <span className="label-text-alt">Balance: 1234.56 USDC</span>
                    </label> */}
        </div>

        {/* Term Select */}
        <div className="form-control w-full">
          <label className="label" htmlFor="lend-term">
            <span className="label-text">Term (Days)</span>
          </label>
          <select
            id="lend-term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            required
            className="select select-bordered w-full" // DaisyUI select class
            disabled={isSubmitting}
          >
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="card-actions justify-end">
          <button
            type="submit"
            className="btn btn-primary w-full" // DaisyUI button class
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                {" "}
                <span className="loading loading-spinner loading-sm"></span>{" "}
                Submitting...{" "}
              </>
            ) : (
              "Confirm Lend"
            )}
          </button>
        </div>
        {/* Add estimated APY info here later */}
        {/* <p className="text-xs text-center text-base-content/70 mt-2">
                    Estimated APY based on last auction: X.XX%
                </p> */}
      </form>
    </div>
  );
};
