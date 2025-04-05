"use client";

import { useState, useEffect } from "react";
import { fetchLoansByLender, claimLoanPrincipalAndInterest, bpsToPercentage } from "@/lib/contracts";

type Loan = {
  loanId: number;
  quoteAmount: string;
  rateBPS: number;
  startTimestamp: number;
  maturityTimestamp: number;
  status: string;
  borrower: string;
};

export const LendingPositions = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingLoanId, setClaimingLoanId] = useState<number | null>(null);
  const [claimResult, setClaimResult] = useState<{
    success: boolean;
    loanId: number | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadLoans() {
      try {
        setIsLoading(true);
        setError(null);
        const loansData = await fetchLoansByLender();
        setLoans(loansData);
      } catch (err) {
        console.error("Error loading loans:", err);
        setError("Failed to load lending positions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLoans();
  }, []);

  const handleClaimRepayment = async (loanId: number) => {
    try {
      setClaimingLoanId(loanId);
      setClaimResult(null);

      const result = await claimLoanPrincipalAndInterest(loanId);
      
      if (result.success) {
        // Optimistically update the UI
        setLoans(prevLoans => 
          prevLoans.map(loan => 
            loan.loanId === loanId 
              ? { ...loan, status: "Repaid" }
              : loan
          )
        );
        
        setClaimResult({
          success: true,
          loanId,
          message: "Successfully claimed funds!"
        });
      } else {
        setClaimResult({
          success: false,
          loanId,
          message: result.error || "Failed to claim funds"
        });
      }
    } catch (err) {
      console.error("Error claiming loan:", err);
      setClaimResult({
        success: false,
        loanId,
        message: err instanceof Error ? err.message : "Unknown error occurred"
      });
    } finally {
      setClaimingLoanId(null);
    }
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
          <span>You don&apos;t have any active lending positions.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => {
        const now = Math.floor(Date.now() / 1000);
        const isMatured = now >= loan.maturityTimestamp;
        const canClaim = loan.status === "Active" && isMatured;
        const isRepaid = loan.status === "Repaid";
        const maturityDate = new Date(loan.maturityTimestamp * 1000).toLocaleDateString();
        const issuedDate = loan.startTimestamp > 0 
          ? new Date(loan.startTimestamp * 1000).toLocaleDateString()
          : "Pending";
        
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
                <div>Principal:</div>
                <div className="font-semibold">{loan.quoteAmount} USDC</div>
                
                <div>Rate:</div>
                <div className="font-semibold">{bpsToPercentage(loan.rateBPS)}</div>
                
                <div>Issued:</div>
                <div>{issuedDate}</div>
                
                <div>Maturity:</div>
                <div>{maturityDate}</div>
              </div>
              
              {canClaim && (
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleClaimRepayment(loan.loanId)}
                    disabled={claimingLoanId === loan.loanId}
                  >
                    {claimingLoanId === loan.loanId ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : "Claim Repayment"}
                  </button>
                </div>
              )}
              
              {isRepaid && (
                <div className="text-center text-success text-sm mt-2">
                  Funds have been returned with interest
                </div>
              )}
              
              {claimResult && claimResult.loanId === loan.loanId && (
                <div className={`alert ${claimResult.success ? 'alert-success' : 'alert-error'} mt-2 py-2 text-xs`}>
                  {claimResult.message}
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