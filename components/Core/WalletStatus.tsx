"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { getProvider } from "@/lib/contracts";
import { Config, getExplorerUrl } from "@/lib/config";
import { ethers } from "ethers";

// Define ethereum property on Window
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletStatus = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      if (!MiniKit.isInstalled()) {
        alert("MiniKit is not installed. Please install World App to continue.");
        return;
      }

      // In real implementation, MiniKit would handle this
      // For development, try to connect directly to provider
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (err) {
          console.error("Error requesting accounts:", err);
          throw err;
        }
      }
      
      // Refresh connection state
      await checkConnection();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      if (!MiniKit.isInstalled()) {
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
        return;
      }

      // Try to get the provider and check if we're connected
      try {
        const provider = await getProvider();
        const accounts = await provider.listAccounts();
        
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0].address);
          
          // Get ETH balance
          const balance = await provider.getBalance(accounts[0]);
          setBalance(ethers.formatEther(balance).substring(0, 6));
        } else {
          setIsConnected(false);
          setAddress(null);
          setBalance(null);
        }
      } catch (err) {
        console.error("Error checking connection:", err);
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Set up event listeners for account changes
    const handleAccountsChanged = () => {
      checkConnection();
    };
    
    // Check if window.ethereum exists (it should be injected by MiniKit)
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }
    
    return () => {
      // Clean up event listeners
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  // Format the address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center rounded-full bg-base-300 px-2 py-1 text-sm">
        <span className="loading loading-spinner loading-xs mr-2"></span>
        Loading...
      </div>
    );
  }

  if (!isConnected) {
    return null; // Don't display anything when not connected
  }

  return (
    <div className="flex items-center gap-2">
      <div className="badge badge-secondary font-medium">{Config.network.name}</div>
      <a
        href={getExplorerUrl("address", address || "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full bg-base-200 px-4 py-1.5 text-sm hover:bg-base-300 transition-colors shadow-sm"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></div>
        <span className="font-medium">
          {address ? formatAddress(address) : "Unknown"}
          {balance && <span className="ml-1 opacity-80">({balance} ETH)</span>}
        </span>
      </a>
    </div>
  );
};