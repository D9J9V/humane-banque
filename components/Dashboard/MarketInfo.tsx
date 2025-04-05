"use client";

import { InfoTooltip } from "@/components/Landing/LandingPageContent";
import { useEffect, useState } from "react";
import { getContract, daysToMaturityTimestamp, bpsToPercentage } from "@/lib/contracts";
import { MiniKit } from "@worldcoin/minikit-js";

interface MarketData {
  maturityTimestamp: number;
  lastAuctionTimestamp: number;
  lastClearingRateBPS: number;
  totalOfferedAmount: bigint;
  totalRequestedAmount: bigint;
  activeLoanCount: number;
  totalLoanVolume: bigint;
  defaultCount: number;
}

export const MarketInfo = () => {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to format timestamp to a human-readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Function to format amount in USDC
  const formatAmount = (amount: bigint) => {
    // USDC has 6 decimals
    return (Number(amount) / 1_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        setError("MiniKit not installed. Please install World App to view market data.");
        setIsLoading(false);
        return;
      }

      // Try to get contract (this will work after deployment)
      // For now, use mock data for UI development
      try {
        const contract = await getContract();
        
        // In a real implementation, we would fetch actual market data:
        // const activeMarkets = await contract.activeMarkets();
        // const marketData = await Promise.all(
        //   activeMarkets.map(async (timestamp) => {
        //     const data = await contract.markets(timestamp);
        //     return {
        //       maturityTimestamp: timestamp,
        //       ...data
        //     };
        //   })
        // );
        
        // For now, use mock data:
        const marketData: MarketData[] = [30, 90, 180].map((days) => {
          const timestamp = daysToMaturityTimestamp(days);
          return {
            maturityTimestamp: timestamp,
            lastAuctionTimestamp: Math.floor(Date.now() / 1000) - 86400, // Yesterday
            lastClearingRateBPS: days === 30 ? 250 : days === 90 ? 350 : 500, // Rates increase with term
            totalOfferedAmount: BigInt(days * 10000 * 1_000_000), // Example amount in USDC (with 6 decimals)
            totalRequestedAmount: BigInt(days * 8500 * 1_000_000),
            activeLoanCount: days === 30 ? 12 : days === 90 ? 25 : 8,
            totalLoanVolume: BigInt(days * 50000 * 1_000_000),
            defaultCount: days === 30 ? 0 : days === 90 ? 1 : 0
          };
        });

        setMarkets(marketData);
      } catch (err) {
        console.error("Error getting contract data:", err);
        
        // Fallback to mock data
        const marketData: MarketData[] = [30, 90, 180].map((days) => {
          const timestamp = daysToMaturityTimestamp(days);
          return {
            maturityTimestamp: timestamp,
            lastAuctionTimestamp: Math.floor(Date.now() / 1000) - 86400, // Yesterday
            lastClearingRateBPS: days === 30 ? 450 : days === 90 ? 500 : 550, // Example rates
            totalOfferedAmount: BigInt(days * 10000 * 1_000_000), // Example amount in USDC (with 6 decimals)
            totalRequestedAmount: BigInt(days * 8500 * 1_000_000),
            activeLoanCount: days === 30 ? 12 : days === 90 ? 25 : 8,
            totalLoanVolume: BigInt(days * 50000 * 1_000_000),
            defaultCount: days === 30 ? 0 : days === 90 ? 1 : 0
          };
        });

        setMarkets(marketData);
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
      setError("Failed to load market data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Market Rates (Fixed Term)</h2>
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Market Rates (Fixed Term)</h2>
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
          <button 
            className="btn btn-outline btn-sm mt-4" 
            onClick={fetchMarketData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate effective rate (slightly lower than auction rate due to default risk)
  const calculateEffectiveRate = (market: MarketData) => {
    const totalLoans = market.activeLoanCount + market.defaultCount;
    if (totalLoans === 0) return "N/A";
    
    // Simple calculation: auction rate * (1 - default ratio)
    const defaultRatio = market.defaultCount / totalLoans;
    const effectiveBPS = Math.floor(market.lastClearingRateBPS * (1 - defaultRatio));
    
    return bpsToPercentage(effectiveBPS);
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Market Rates (Fixed Term)</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Term (Days)</th>
                <th>
                  Last{" "}
                  <InfoTooltip
                    term="Auction Rate"
                    explanation="The fixed APR determined by the most recent supply/demand auction for this term."
                  />
                </th>
                <th>
                  Last{" "}
                  <InfoTooltip
                    term="Effective Rate"
                    explanation="The actual aggregate APR earned by lenders for the last completed term, after accounting for any losses from borrower liquidations."
                  />
                </th>
                <th>Active Loans</th>
                <th>Volume (USDC)</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market.maturityTimestamp}>
                  <td>
                    {(market.maturityTimestamp - Math.floor(Date.now() / 1000)) / 86400 > 120 ? 180 : 
                     (market.maturityTimestamp - Math.floor(Date.now() / 1000)) / 86400 > 60 ? 90 : 30}
                  </td>
                  <td className="font-medium">
                    {market.lastClearingRateBPS > 0 
                      ? bpsToPercentage(market.lastClearingRateBPS)
                      : "No auction yet"}
                  </td>
                  <td>{calculateEffectiveRate(market)}</td>
                  <td>{market.activeLoanCount}</td>
                  <td>{formatAmount(market.totalLoanVolume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-base-content/70">
            * Last auction: {markets[0] ? formatDate(markets[0].lastAuctionTimestamp) : "N/A"}
          </p>
          <button 
            className="btn btn-outline btn-xs" 
            onClick={fetchMarketData}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
