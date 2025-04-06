"use client"; // Required for Next.js

import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect, useState } from "react";

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMiniKit = async () => {
      try {
        // Install MiniKit
        await MiniKit.install();
        
        // Ensure provider is ready (this is important for World App environment)
        if (MiniKit.isInstalled()) {
          try {
            // MiniKit doesn't have a direct getProvider method
            // Just ensure it's installed properly
            console.log("MiniKit installed successfully:", MiniKit.isInstalled());
          } catch (err) {
            console.warn("MiniKit provider initialization warning:", err);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize MiniKit:", error);
        // Still mark as initialized to allow the app to render
        setIsInitialized(true);
      }
    };

    initializeMiniKit();
  }, []);

  // You could add a loading state here if needed
  // if (!isInitialized) {
  //   return <div>Loading MiniKit...</div>;
  // }

  return <>{children}</>;
}
