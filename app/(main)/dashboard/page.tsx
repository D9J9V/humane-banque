"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { MarketInfo } from "@/components/Dashboard/MarketInfo";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { SignInButton } from "@/components/Auth/SignInButton";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { isVerified } = useVerification();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!session) {
    return (
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

  return (
    <div className="space-y-6">
      {!isVerified ? (
        // Prompt user to verify if they haven't yet
        <VerifyButton />
      ) : (
        // Show main market info if verified
        <div>
          <h2 className="text-2xl font-semibold mb-4">Market Overview</h2>
          <MarketInfo />
        </div>
      )}

      {!isVerified && (
        // Show a disabled/preview version of market info if not verified
        <div className="mt-8 opacity-50">
          <h2 className="text-2xl font-semibold mb-4 text-base-content/50">
            Market Overview (Verification Required)
          </h2>
          <MarketInfo />
        </div>
      )}

      {/* TODO: Add more dashboard components here later (e.g., portfolio summary) */}
    </div>
  );
}
