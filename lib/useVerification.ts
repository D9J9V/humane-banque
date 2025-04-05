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

  // ... (checkVerification and useEffect remain the same) ...
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

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.sub) {
      checkVerification();
    } else if (sessionStatus === "unauthenticated") {
      setIsVerified(false);
    }
  }, [sessionStatus, session?.user?.sub, checkVerification]);

  const triggerVerification = useCallback(async () => {
    if (!session?.user?.sub || isVerifying) {
      console.log("Cannot verify: No session or already verifying.");
      return null;
    }

    const userIdSignal = session.user.sub;

    console.log("Triggering World ID Verification Flow...");
    console.log("Using signal (user sub):", userIdSignal);
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

      console.log("MiniKit result:", JSON.stringify(result));

      if (result.finalPayload.status === "error") {
        const errorCode = result.finalPayload.error_code || "UNKNOWN_ERROR";
        throw new Error(`MiniKit Error: ${errorCode}`);
      }

      // Successfully got proof from MiniKit, now verify with backend
      console.log("MiniKit verification successful, verifying with backend...");
      
      // Log the full MiniKit result for debugging
      console.log("Full MiniKit result.finalPayload:", JSON.stringify(result.finalPayload, null, 2));

      // Extract properties from the result
      // Depending on MiniKit's response format, adjust this extraction
      const proof = result.finalPayload.proof;
      const merkle_root = result.finalPayload.merkle_root;
      const nullifier_hash = result.finalPayload.nullifier_hash;
      const verification_level = result.finalPayload.verification_level;

      if (!verification_level) {
        throw new Error("Verification level missing from MiniKit response.");
      }
      
      // Log individual extracted values
      console.log("Proof:", proof);
      console.log("Merkle Root:", merkle_root);
      console.log("Nullifier Hash:", nullifier_hash);
      console.log("Verification Level:", verification_level);

      // Log extracted values for debugging
      console.log("Extracted from MiniKit result:", {
        proof,
        merkle_root,
        nullifier_hash,
        verification_level,
      });

      // Create a payload with proper error checking
      const backendPayload = {
        proof: proof || "",
        merkle_root: merkle_root || "",
        nullifier_hash: nullifier_hash || "",
        verification_level: verification_level || "orb",
        action: "verify-humane-banque"
      };
      
      console.log("Sending to backend API:", JSON.stringify(backendPayload));
      
      // Send to our backend verify endpoint
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.error("Server verification error:", JSON.stringify(verifyResult));
        throw new Error(verifyResult.error || "Verification failed on server");
      }

      // Update local state to reflect successful verification
      setIsVerified(true);
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
  }, [session?.user?.sub, isVerifying]); // Removed checkVerification from deps as it's not directly used here

  return {
    isVerified,
    isVerifying,
    isCheckingStatus,
    verificationError,
    triggerVerification,
    checkVerification,
  };
};
