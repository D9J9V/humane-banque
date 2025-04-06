"use client";

import { useVerification } from "@/lib/useVerification";

interface VerifyButtonProps {
  onVerified?: () => void; // Optional callback on successful verification
}

export const VerifyButton = ({ onVerified }: VerifyButtonProps) => {
  const { isVerified, isVerifying, verificationError, triggerVerification } =
    useVerification();

  const handleVerifyClick = async () => {
    const result = await triggerVerification();
    if (result) {
      console.log("Verification successful in component");
      onVerified?.();
    } else {
      console.error("Verification failed in component");
    }
  };

  // Render nothing if verification is already complete for this instance.
  // Parent components should use the hook's `isVerified` state for conditional rendering of content.
  if (isVerified && !isVerifying) {
    // Returning null makes VerifyButton purely an action component (disappears after success).
    // Alternatively, could show a success indicator:
    // return <span className="text-sm text-success flex items-center gap-1">✅ Verified</span>;
    return null;
  }

  return (
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
          <div className="alert alert-error mt-2 p-2 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{verificationError}</span>
          </div>
        )}
        <p className="text-xs mt-1">
          <a 
            href="https://worldcoin.org/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link link-primary"
          >
            Need World ID app? Download here
          </a>
        </p>
      </div>

      <button
        onClick={handleVerifyClick}
        disabled={isVerifying}
        className="btn btn-sm btn-success"
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
