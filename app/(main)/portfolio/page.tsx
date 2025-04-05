"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { SignInButton } from "@/components/Auth/SignInButton";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { LendingPositions } from "@/components/Portfolio/LendingPositions";
import { BorrowingPositions } from "@/components/Portfolio/BorrowingPositions";
import { Config } from "@/lib/config";

export default function PortfolioPage() {
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

  if (!session) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Sign In Required</h2>
          <p>Please sign in with your World ID to access your portfolio.</p>
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
        <VerifyButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">My Portfolio</h2>
        <p className="text-sm text-base-content/80 mb-4">
          View and manage your active lending and borrowing positions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-4">Lending Positions</h3>
          <LendingPositions />
        </div>

        {borrowingEnabled && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Borrowing Positions</h3>
            <BorrowingPositions />
          </div>
        )}
      </div>
    </div>
  );
}