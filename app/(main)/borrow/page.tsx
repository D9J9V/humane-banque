"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { BorrowForm } from "@/components/Borrow/BorrowForm";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { SignInButton } from "@/components/Auth/SignInButton";
import { Config } from "@/lib/config";

export default function BorrowPage() {
  const { data: session, status } = useSession();
  const { isVerified } = useVerification();
  const borrowingEnabled = Config.features.borrowingEnabled;

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!borrowingEnabled) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Coming Soon</h2>
          <p>The borrowing feature is currently under development and will be available soon.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Sign In Required</h2>
          <p>Please sign in with your World ID to access borrowing features.</p>
          <div className="card-actions justify-center mt-4">
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Prompt user to verify before allowing borrowing */}
        <VerifyButton />
      </div>
    );
  }

  // Signed in and verified: Show the Borrow form
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Borrow Against Collateral</h2>
        <p className="text-sm text-base-content/80 mb-4">
          Deposit collateral and borrow USDC for a fixed term. Your loan will be matched
          in the next market auction based on your maximum rate.
        </p>
      </div>
      <BorrowForm />
    </div>
  );
}