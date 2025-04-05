"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";

export const useVerification = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);

  // Function to check verification status with the backend
  const checkVerification = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.sub || isCheckingStatus) return isVerified;

    setIsCheckingStatus(true);
    try {
      const response = await fetch("/api/user/verified");
      const data = await response.json();

      if (response.ok && data.isVerified) {
        setIsVerified(true);
        return true;
      } else {
        setIsVerified(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      return isVerified; // Return current state on error
    } finally {
      setIsCheckingStatus(false);
    }
  }, [session?.user?.sub, isVerified, isCheckingStatus]);

  // Check verification status from the backend when session changes
  // Fixed by adding checkVerification to dependency array
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.sub) {
      checkVerification();
    } else if (sessionStatus === "unauthenticated") {
      setIsVerified(false);
    }
  }, [sessionStatus, session?.user?.sub, checkVerification]); // Added checkVerification here

  const triggerVerification = useCallback(async () => {
    if (!session?.user?.sub || isVerifying) {
      console.log("Cannot verify: No session or already verifying.");
      return null;
    }

    const userIdSignal = session.user.sub;

    console.log("Triggering World ID Verification Flow...");
    setIsVerifying(true);
    setVerificationError(null);

    try {
      if (!MiniKit.isInstalled()) {
        console.warn("MiniKit is not installed.");
        throw new Error("MiniKit not installed");
      }

      // Execute the verification with MiniKit
      const result = await MiniKit.commandsAsync.verify({
        action: "verify-humane-banque",
        signal: userIdSignal,
        verification_level: VerificationLevel.Orb,
      });

      if (result.finalPayload.status === "error") {
        const errorCode = result.finalPayload.error_code || "UNKNOWN_ERROR";
        throw new Error(`MiniKit Error: ${errorCode}`);
      }

      // Successfully got proof from MiniKit, now verify with backend
      console.log("MiniKit verification successful, verifying with backend...");

      // Fixed: Extract only the properties that exist on the success payload
      // Remove signal - it's not in the response, we'll use the one we sent
      const { proof, merkle_root, nullifier_hash } = result.finalPayload;

      // Send to our backend verify endpoint
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof,
          merkle_root,
          nullifier_hash,
          signal: userIdSignal, // Use the signal we sent to MiniKit
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        // API returned an error
        throw new Error(verifyResult.error || "Verification failed on server");
      }

      // Update local state to reflect successful verification
      setIsVerified(true);

      // After successful verification, no need to check again
      setIsCheckingStatus(true);

      return verifyResult;
    } catch (error: any) {
      console.error("Error during verification process:", error);
      setVerificationError(
        error.message || "An unknown error occurred during verification.",
      );
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, [session?.user?.sub, isVerifying]);

  return {
    isVerified,
    isVerifying,
    isCheckingStatus,
    verificationError,
    triggerVerification,
    checkVerification,
  };
};
