"use client";

import { useVerification } from "@/lib/useVerification";

interface VerifyButtonProps {
  onVerified?: () => void; // Optional callback on success
}

export const VerifyButton = ({ onVerified }: VerifyButtonProps) => {
  const { isVerified, isVerifying, verificationError, triggerVerification } =
    useVerification();

  const handleVerifyClick = async () => {
    const result = await triggerVerification();
    if (result) {
      console.log("Verification successful in component");
      if (onVerified) {
        onVerified();
      }
    } else {
      console.error("Verification failed in component");
      // Error is displayed via verificationError state
    }
  };

  // Don't show anything if already verified in this specific component instance
  // Parent components should handle conditional rendering based on the hook's `isVerified` state
  if (isVerified && !isVerifying) {
    // It's better for the parent component (e.g., DashboardPage) to decide
    // whether to show this success message or just proceed.
    // Returning null here makes VerifyButton purely an action component when verified.
    // Alternatively, show a success indicator:
    // return <span className="text-sm text-success flex items-center gap-1">✅ Verified</span>;
    return null; // Let parent decide what to show post-verification
  }

  return (
    // Use DaisyUI Alert for prompting verification
    <div className="alert alert-warning shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="flex-grow">
        <h3 className="font-bold">Verification Required</h3>
        <div className="text-xs">Prove your humanity to continue.</div>
        {verificationError && (
          <p className="text-xs text-error mt-1">Error: {verificationError}</p>
        )}
      </div>

      <button
        onClick={handleVerifyClick}
        disabled={isVerifying}
        className="btn btn-sm btn-success" // Use DaisyUI button classes
      >
        {isVerifying ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          "Verify Now"
        )}
      </button>
    </div>
  );
};
