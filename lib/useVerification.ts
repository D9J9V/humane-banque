"use client";
// VERY IMPORTANT: This is a placeholder/simulation.
// In a real app, verification status should ideally be:
// 1. Fetched from your backend (which checks the blockchain/proof).
// 2. Stored securely, perhaps linked to the user's session or profile.
// 3. Re-validated periodically or as needed.
// This hook just uses simple React state for demonstration.

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
// Add necessary MiniKit imports if not globally available (might need to import types)
import {
  MiniKit,
  VerificationLevel,
  MiniAppVerifyActionErrorPayload,
  ISuccessResult,
} from "@worldcoin/minikit-js";
// Simulate fetching/storing verification status
// In a real app, this might involve an API call on session load
const getInitialVerificationStatus = (): boolean => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("isUserVerified") === "true";
  }
  return false;
};

const setVerificationStatus = (isVerified: boolean) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("isUserVerified", String(isVerified));
  }
};

export const useVerification = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [isVerified, setIsVerified] = useState<boolean>(
    getInitialVerificationStatus(),
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  // Reset verification status if user logs out
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      setVerificationStatus(false);
      setIsVerified(false);
    } else if (sessionStatus === "authenticated") {
      // Re-check stored status when session becomes available
      setIsVerified(getInitialVerificationStatus());
    }
  }, [sessionStatus]);

  const checkVerification = useCallback(async (): Promise<boolean> => {
    // In real app: Call your backend to check verification status for the logged-in user
    // For now, we just return the state
    console.log("Checking verification status (simulated):", isVerified);
    return isVerified;
  }, [isVerified]);

  const triggerVerification = useCallback(async () => {
    if (!session || isVerifying) {
      console.log("Cannot verify: No session or already verifying.");
      return null; // Or throw error
    }

    // ----- FIX START -----
    // Explicitly check for session.user and session.user.sub
    // We need 'sub' which comes from our custom session type (see next step)
    const userIdSignal = session.user?.sub;

    if (!userIdSignal) {
      console.error("Cannot verify: User ID (sub) not found in session.");
      setVerificationError("User identifier missing from session.");
      return null; // Can't proceed without a signal
    }
    // ----- FIX END -----

    console.log("Triggering World ID Verification Flow...");
    setIsVerifying(true);
    setVerificationError(null);

    // Reuse logic from the original VerifyBlock
    try {
      if (!MiniKit.isInstalled()) {
        console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
        throw new Error("MiniKit not installed");
      }

      const verifyPayload = {
        action:
          process.env.NEXT_PUBLIC_WLD_ACTION_NAME || "humane-banque-verify", // Use env var
        signal: userIdSignal, // Use user's unique ID from session as signal
        verification_level: VerificationLevel.Orb,
      };
      console.log("Using verification payload:", verifyPayload);

      const { finalPayload } =
        await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === "error") {
        console.error("MiniKit verification command error:", finalPayload);

        // ----- CORRECTED FIX START -----
        // Access the correct properties from MiniAppVerifyActionErrorPayload.
        // According to the type definition, only 'error_code' is available for error details.
        const errorCode = finalPayload.error_code || "UNKNOWN_CODE"; // Provide fallback
        // Remove access to 'finalPayload.detail' as it doesn't exist on the type.
        setVerificationError(`MiniKit Error: ${errorCode}`);
        // ----- CORRECTED FIX END -----

        setIsVerified(false);
        setVerificationStatus(false);
        setIsVerifying(false); // Make sure this is set
        return null;
      }

      console.log(
        "MiniKit verification successful, verifying proof with backend...",
      );
      // Verify the proof in the backend
      const verifyResponse = await fetch(`/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
        }),
      });

      const verifyResponseJson = await verifyResponse.json();

      if (verifyResponse.ok && verifyResponseJson.success) {
        // Adjust based on your API response
        console.log("Backend verification successful!");
        setIsVerified(true);
        setVerificationStatus(true); // Persist status (simulated)
        setVerificationError(null);
        return verifyResponseJson;
      } else {
        console.error("Backend verification failed:", verifyResponseJson);
        setVerificationError(
          verifyResponseJson.detail || "Backend verification failed",
        );
        setIsVerified(false);
        setVerificationStatus(false);
        return null;
      }
    } catch (error: any) {
      console.error("Error during verification process:", error);
      setVerificationError(
        error.message || "An unknown error occurred during verification.",
      );
      setIsVerified(false);
      setVerificationStatus(false);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, [session, isVerifying]); // Add MiniKit types if needed

  return {
    isVerified,
    isVerifying,
    verificationError,
    triggerVerification,
    checkVerification,
  };
};
