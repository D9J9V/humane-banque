"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { LendForm } from "@/components/Lend/LendForm";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { SignInButton } from "@/components/Auth/SignInButton";

export default function LendPage() {
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
          <h2 className="card-title">Sign In Required</h2>
          <p>Please sign in with your World ID to access lending features.</p>
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
        {/* Prompt user to verify before allowing lending */}
        <VerifyButton />
      </div>
    );
  }

  // Signed in and verified: Show the Lend form
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Lend Your USDC</h2>
        <p className="text-sm text-base-content/80 mb-4">
          Choose the amount and term for your fixed-term deposit. Your capital
          will earn interest based on the next market auction rate for the
          selected term.
        </p>
      </div>
      <LendForm />
    </div>
  );
}
