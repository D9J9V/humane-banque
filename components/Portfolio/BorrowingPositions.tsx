"use client";

import { useState, useEffect } from "react";
import { fetchLoansByBorrower, repayLoan, bpsToPercentage } from "@/lib/contracts";

type Loan = {
  loanId: number;
  quoteAmount: string;
  rateBPS: number;
  startTimestamp: number;
  maturityTimestamp: number;
  status: string;
  lender: string;
  collateralToken: string;
  collateralAmount: string;
};

export const BorrowingPositions = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repayingLoanId, setRepayingLoanId] = useState<number | null>(null);
  const [repayResult, setRepayResult] = useState<{
    success: boolean;
    loanId: number | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadLoans() {
      try {
        setIsLoading(true);
        setError(null);
        const loansData = await fetchLoansByBorrower();
        setLoans(loansData);
      } catch (err) {
        console.error("Error loading loans:", err);
        setError("Failed to load borrowing positions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLoans();
  }, []);

  const handleRepayLoan = async (loanId: number) => {
    try {
      setRepayingLoanId(loanId);
      setRepayResult(null);

      const result = await repayLoan(loanId);
      
      if (result.success) {
        // Optimistically update the UI
        setLoans(prevLoans => 
          prevLoans.map(loan => 
            loan.loanId === loanId 
              ? { ...loan, status: "Repaid" }
              : loan
          )
        );
        
        setRepayResult({
          success: true,
          loanId,
          message: "Loan successfully repaid! Collateral has been returned."
        });
      } else {
        setRepayResult({
          success: false,
          loanId,
          message: result.error || "Failed to repay loan"
        });
      }
    } catch (err) {
      console.error("Error repaying loan:", err);
      setRepayResult({
        success: false,
        loanId,
        message: err instanceof Error ? err.message : "Unknown error occurred"
      });
    } finally {
      setRepayingLoanId(null);
    }
  };

  const calculateRepaymentAmount = (loan: Loan): string => {
    if (loan.status !== "Active" || !loan.startTimestamp) return "0";
    
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = Math.min(now - loan.startTimestamp, loan.maturityTimestamp - loan.startTimestamp);
    const principal = parseFloat(loan.quoteAmount);
    const interestRate = loan.rateBPS / 10000; // Convert from BPS to decimal
    const yearFraction = timeElapsed / (365 * 24 * 60 * 60);
    const interest = principal * interestRate * yearFraction;
    
    return (principal + interest).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-md p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <span className="loading loading-dots loading-md"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-md p-6">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="card bg-base-100 shadow-md p-6">
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>You don&apos;t have any active borrowing positions.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => {
        const now = Math.floor(Date.now() / 1000);
        const daysRemaining = Math.max(0, Math.floor((loan.maturityTimestamp - now) / (24 * 60 * 60)));
        const canRepay = loan.status === "Active";
        const isRepaid = loan.status === "Repaid";
        const maturityDate = new Date(loan.maturityTimestamp * 1000).toLocaleDateString();
        const repaymentAmount = calculateRepaymentAmount(loan);
        const collateralTokenSymbol = loan.collateralToken.includes("ETH") ? "ETH" : 
                                     loan.collateralToken.includes("WLD") ? "WLD" : 
                                     "TOKEN";
        
        return (
          <div key={loan.loanId} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h4 className="card-title text-base">Loan #{loan.loanId}</h4>
                <span className={`badge ${getBadgeClass(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Borrowed:</div>
                <div className="font-semibold">{loan.quoteAmount} USDC</div>
                
                <div>Rate:</div>
                <div className="font-semibold">{bpsToPercentage(loan.rateBPS)}</div>
                
                <div>Collateral:</div>
                <div>{loan.collateralAmount} {collateralTokenSymbol}</div>
                
                <div>Maturity:</div>
                <div>{maturityDate} ({daysRemaining} days remaining)</div>
                
                {canRepay && (
                  <>
                    <div>Repayment Amount:</div>
                    <div className="font-semibold">{repaymentAmount} USDC</div>
                  </>
                )}
              </div>
              
              {canRepay && (
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRepayLoan(loan.loanId)}
                    disabled={repayingLoanId === loan.loanId}
                  >
                    {repayingLoanId === loan.loanId ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : "Repay Loan"}
                  </button>
                </div>
              )}
              
              {isRepaid && (
                <div className="text-center text-success text-sm mt-2">
                  Loan fully repaid and collateral returned
                </div>
              )}
              
              {repayResult && repayResult.loanId === loan.loanId && (
                <div className={`alert ${repayResult.success ? 'alert-success' : 'alert-error'} mt-2 py-2 text-xs`}>
                  {repayResult.message}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getBadgeClass(status: string): string {
  switch (status) {
    case "Pending":
      return "badge-warning";
    case "Active":
      return "badge-primary";
    case "Repaid":
      return "badge-success";
    case "Defaulted":
      return "badge-error";
    case "Liquidated":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}