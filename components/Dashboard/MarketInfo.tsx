import { InfoTooltip } from "@/components/Landing/LandingPageContent";

export const MarketInfo = () => {
  // Placeholder data - Fetch this from the backend/API in a real application
  const marketData = [
    { term: 30, auctionRate: "4.5%", effectiveRate: "4.3%" },
    { term: 90, auctionRate: "5.0%", effectiveRate: "4.8%" },
    { term: 180, auctionRate: "5.5%", effectiveRate: "5.2%" },
  ];

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
              </tr>
            </thead>
            <tbody>
              {marketData.map((data) => (
                <tr key={data.term}>
                  <td>{data.term}</td>
                  <td>{data.auctionRate}</td>
                  <td>{data.effectiveRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-base-content/70 mt-2">
          {/* Clarify that rates are historical */}* Rates are indicative based
          on the last completed auction cycle.
        </p>
      </div>
    </div>
  );
};
