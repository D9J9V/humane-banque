"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";

// Create a shared state object to persist verification status across hook calls
// This is a simple approach that works without React context
const sharedState = {
  isVerified: false,
  lastChecked: 0,
  verificationInProgress: false, // Track if verification is in progress anywhere
  hasBeenVerified: false // Track if a successful verification has happened in this session
};

// Create a way to update localStorage as a backup storage
const updateStorageVerification = (status: boolean) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('humane_banque_verified', status ? 'true' : 'false');
      window.localStorage.setItem('humane_banque_verified_at', Date.now().toString());
    } catch (e) {
      console.warn('Could not update localStorage:', e);
    }
  }
};

// Try to load initial state from localStorage
if (typeof window !== 'undefined') {
  try {
    const storedVerification = window.localStorage.getItem('humane_banque_verified');
    const storedTimestamp = window.localStorage.getItem('humane_banque_verified_at');
    
    if (storedVerification === 'true') {
      sharedState.isVerified = true;
      sharedState.hasBeenVerified = true;
      if (storedTimestamp) {
        sharedState.lastChecked = parseInt(storedTimestamp, 10);
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage:', e);
  }
}

export const useVerification = () => {
  const { data: session, status: sessionStatus } = useSession();
  // Use local state that syncs with the shared state
  const [isVerified, setIsVerified] = useState<boolean>(sharedState.isVerified);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);

  // Function to update both local and shared state
  const updateVerificationStatus = useCallback((status: boolean) => {
    console.log(`Updating verification status to: ${status}`);
    setIsVerified(status);
    sharedState.isVerified = status;
    sharedState.lastChecked = Date.now();
    
    if (status) {
      sharedState.hasBeenVerified = true;
    }
    
    // Also update localStorage
    updateStorageVerification(status);
  }, []);

  const checkVerification = useCallback(async (): Promise<boolean> => {
    // If we've already verified in this session, don't check again
    if (sharedState.hasBeenVerified) {
      console.log("Already verified in this session, using cached status");
      if (!isVerified) {
        setIsVerified(true);
      }
      return true;
    }
    
    if (!session?.user?.sub || isCheckingStatus) return isVerified;

    // Don't check too frequently
    const timeSinceLastCheck = Date.now() - sharedState.lastChecked;
    if (sharedState.lastChecked > 0 && timeSinceLastCheck < 10000) { // Increased to 10 seconds
      console.log("Using cached verification status:", sharedState.isVerified);
      // Update local state from shared state if needed
      if (isVerified !== sharedState.isVerified) {
        setIsVerified(sharedState.isVerified);
      }
      return sharedState.isVerified;
    }

    setIsCheckingStatus(true);
    try {
      console.log("Checking verification status with API...");
      const response = await fetch("/api/user/verified");
      const data = await response.json();

      if (response.ok && data.isVerified) {
        console.log("User is verified according to API");
        updateVerificationStatus(true);
        return true;
      } else {
        console.log("User is NOT verified according to API");
        updateVerificationStatus(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      return isVerified; // Return current state on error
    } finally {
      setIsCheckingStatus(false);
    }
  }, [session?.user?.sub, isVerified, isCheckingStatus, updateVerificationStatus]);

  // Effect to sync with shared state and check verification when session changes
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.sub) {
      // First, check if we've already verified in this session
      if (sharedState.hasBeenVerified) {
        console.log("Already verified in this session, using cached status");
        setIsVerified(true);
        return;
      }
      
      // Sync with shared state first
      if (isVerified !== sharedState.isVerified) {
        setIsVerified(sharedState.isVerified);
      }
      
      // Check verification if needed
      const timeSinceLastCheck = Date.now() - sharedState.lastChecked;
      if (sharedState.lastChecked === 0 || timeSinceLastCheck > 10000) {
        checkVerification();
      }
    } else if (sessionStatus === "unauthenticated") {
      updateVerificationStatus(false);
    }
  }, [sessionStatus, session?.user?.sub, isVerified, checkVerification, updateVerificationStatus]);

  const triggerVerification = useCallback(async () => {
    // If already verified, don't trigger the flow again
    if (sharedState.hasBeenVerified || isVerified) {
      console.log("Already verified, no need to trigger verification again");
      return { success: true, alreadyVerified: true };
    }
    
    // Don't allow multiple verification flows at the same time
    if (sharedState.verificationInProgress) {
      console.log("Verification already in progress in another component");
      return null;
    }
    
    if (!session?.user?.sub || isVerifying) {
      console.log("Cannot verify: No session or already verifying.");
      return null;
    }

    console.log("Triggering World ID Verification Flow...");
    setIsVerifying(true);
    setVerificationError(null);
    sharedState.verificationInProgress = true;

    try {
      if (!MiniKit.isInstalled()) {
        console.warn("MiniKit is not installed.");
        throw new Error("MiniKit not installed");
      }

      // Execute the verification with MiniKit
      const result = await MiniKit.commandsAsync.verify({
        action: "verify-humane-banque",
        signal: "", // Use empty string for signal
        verification_level: VerificationLevel.Orb,
      });

      console.log("MiniKit result:", JSON.stringify(result));

      if (result.finalPayload.status === "error") {
        const errorCode = result.finalPayload.error_code || "UNKNOWN_ERROR";
        throw new Error(`MiniKit Error: ${errorCode}`);
      }

      // Extract properties from the result
      const proof = result.finalPayload.proof;
      const merkle_root = result.finalPayload.merkle_root;
      const nullifier_hash = result.finalPayload.nullifier_hash;
      const verification_level = result.finalPayload.verification_level;

      if (!verification_level) {
        throw new Error("Verification level missing from MiniKit response.");
      }

      // Create payload for the backend
      const backendPayload = {
        proof,
        merkle_root,
        nullifier_hash,
        verification_level,
      };
      
      console.log("Sending to backend API");
      
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

      // Update verification status in both local and shared state
      console.log("Verification successful! Updating status...");
      updateVerificationStatus(true);
      sharedState.hasBeenVerified = true;
      
      // Force a re-check with the server to confirm the database update
      try {
        await checkVerification();
      } catch (e) {
        console.error("Error checking verification after success:", e);
        // Continue even if check fails, since we already know verification succeeded
      }
      
      return verifyResult;
    } catch (error: any) {
      console.error("Error during verification process:", error);
      
      // Provide a more user-friendly error message
      let errorMessage = "Verification failed. Please try again.";
      
      if (error.message && error.message.includes("invalid_proof")) {
        errorMessage = "The World ID verification could not be validated. Please try again.";
      } else if (error.message && error.message.includes("MiniKit not installed")) {
        errorMessage = "Please install the World ID app to verify your identity.";
      } else if (error.message) {
        // Use the actual error if available
        errorMessage = error.message;
      }
      
      setVerificationError(errorMessage);
      return null;
    } finally {
      setIsVerifying(false);
      sharedState.verificationInProgress = false;
    }
  }, [session?.user?.sub, isVerified, isVerifying, updateVerificationStatus, checkVerification]);

  return {
    isVerified,
    isVerifying,
    isCheckingStatus,
    verificationError,
    triggerVerification,
    checkVerification,
  };
};
