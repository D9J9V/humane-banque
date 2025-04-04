"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { MarketInfo } from "@/components/Dashboard/MarketInfo";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { SignInButton } from "@/components/Auth/SignInButton"; // Still needed for prompt

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { isVerified } = useVerification(); // Use the hook's state

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!session) {
    return (
      // Use Card for better visual grouping
      <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Welcome to Humane Banque!</h2>
          <p>
            Please sign in with your World ID to view market rates and access
            lending.
          </p>
          <div className="card-actions justify-center mt-4">
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  // Signed in, now check verification
  return (
    <div className="space-y-6">
      {/* Conditionally render VerifyButton prompt OR MarketInfo */}
      {!isVerified ? (
        <VerifyButton /> // The VerifyButton now includes the prompt styling
      ) : (
        <div>
          {/* Optional: Welcome message for verified users */}
          {/* <div className="alert alert-success shadow-lg mb-6">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>You are verified! Access all features.</span>
                </div>
             </div> */}
          <h2 className="text-2xl font-semibold mb-4">Market Overview</h2>
          <MarketInfo />
        </div>
      )}

      {/* Always show MarketInfo but maybe disabled/greyed out if not verified? */}
      {/* Example: Greyed out version */}
      {!isVerified && (
        <div className="mt-8 opacity-50">
          <h2 className="text-2xl font-semibold mb-4 text-base-content/50">
            Market Overview (Verification Required)
          </h2>
          <MarketInfo />
        </div>
      )}

      {/* Add more dashboard components here later, e.g., portfolio summary */}
    </div>
  );
}
