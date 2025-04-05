/**
 * Configuration for the application.
 * This helps centralize environment variables and constants used across the app.
 */

export const Config = {
  // Contract addresses
  contracts: {
    // Use environment variables or defaults for contract addresses
    auctionRepoHook: process.env.NEXT_PUBLIC_AUCTION_REPO_HOOK_ADDRESS || 
      "0x0000000000000000000000000000000000000000", // Default or placeholder
    
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || 
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Default to mainnet USDC
    
    // Add other token addresses as needed
    eth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH mainnet
    wld: "0x163f8C2467924be0ae7B5347228CABF260318753", // WLD mainnet
  },
  
  // World ID integration
  worldId: {
    appId: process.env.NEXT_PUBLIC_WORLD_ID_APP_ID || "app_staging_fake_id",
    action: "verify-humane-banque",
    verificationLevel: "orb", // Can be "orb" or "device"
  },
  
  // Network settings
  network: {
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "1", // Default to Ethereum Mainnet
    name: process.env.NEXT_PUBLIC_NETWORK_NAME || "Ethereum",
    rpc: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.public.blastapi.io",
  },
  
  // Application settings
  app: {
    name: "Humane Banque",
    description: "Secure Fixed-Term DeFi Lending for Verified Humans",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://humane-banque.app",
  },
  
  // Feature flags
  features: {
    borrowingEnabled: process.env.NEXT_PUBLIC_ENABLE_BORROWING === "true",
    liquidationsEnabled: process.env.NEXT_PUBLIC_ENABLE_LIQUIDATIONS === "true",
    mockDataOnly: process.env.NEXT_PUBLIC_MOCK_DATA_ONLY === "true" || true, // Default to mock data until production
  }
};

// Helper function to check if we're in development environment
export const isDev = (): boolean => {
  return process.env.NODE_ENV === "development";
};

// Helper to get the chain explorer URL
export const getExplorerUrl = (type: "tx" | "address" | "block", hash: string): string => {
  const baseUrl = 
    Config.network.chainId === "1" ? "https://etherscan.io" :
    Config.network.chainId === "5" ? "https://goerli.etherscan.io" :
    Config.network.chainId === "137" ? "https://polygonscan.com" :
    Config.network.chainId === "42161" ? "https://arbiscan.io" :
    "https://etherscan.io"; // Default to Ethereum
    
  return `${baseUrl}/${type}/${hash}`;
};