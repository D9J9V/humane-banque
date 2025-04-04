import Link from "next/link";

// Helper component for tooltips
export const InfoTooltip = ({
  term,
  explanation,
}: {
  term: string;
  explanation: string;
}) => (
  <span className="tooltip tooltip-info" data-tip={explanation}>
    <span className="underline decoration-dotted cursor-help text-info">
      {term}
    </span>
  </span>
);

export const LandingPageContent = () => {
  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center text-center">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-base-200 rounded-box mb-10">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Humane Banque</h1>
            <p className="py-6">
              Secure, predictable{" "}
              <InfoTooltip
                term="Fixed-Term"
                explanation="Loans and deposits have clear start and end dates, unlike open-ended terms common in DeFi."
              />{" "}
              DeFi Lending exclusively for{" "}
              <InfoTooltip
                term="Verified Humans"
                explanation="Uses World ID's Proof-of-Humanity to ensure every participant is a unique real person, preventing bots."
              />
              .
            </p>
            <Link href="/dashboard" legacyBehavior>
              <a className="btn btn-primary">Enter App</a>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <h2 className="text-3xl font-bold mb-6">Why Humane Banque?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h3 className="card-title">Predictability</h3>
            <p>
              Fixed terms and fixed rates mean you know your APY as a lender and
              your APR as a borrower upfront. No surprises from{" "}
              <InfoTooltip
                term="Floating Rates"
                explanation="Interest rates that can change over the life of the loan, common in other DeFi protocols."
              />
              .
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h3 className="card-title">Fair & Transparent Rates</h3>
            <p>
              Interest rates are set by real supply and demand through periodic{" "}
              <InfoTooltip
                term="Auctions"
                explanation="A mechanism where lenders and borrowers submit bids/offers, and the protocol determines a clearing interest rate."
              />{" "}
              among verified humans, not artificial subsidies.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h3 className="card-title">Enhanced Security</h3>
            <p>
              Mandatory{" "}
              <InfoTooltip
                term="Proof-of-Humanity"
                explanation="Cryptographic proof provided by World ID confirming you are a unique human without revealing your identity."
              />{" "}
              prevents Sybil attacks, while{" "}
              <InfoTooltip
                term="Over-collateralization"
                explanation="Borrowers must deposit collateral (like ETH or WLD) worth more than the loan amount, protecting lenders."
              />{" "}
              secures loans.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <h2 className="text-3xl font-bold mb-6">How It Works (Simplified)</h2>
      <div className="w-full max-w-2xl mb-10">
        <ul className="steps steps-vertical lg:steps-horizontal w-full">
          <li className="step step-primary">Verify with World ID</li>
          <li className="step step-primary">
            Commit to Lend (Deposit USDC) or Borrow (Provide Collateral) for a
            chosen term
          </li>
          <li className="step step-primary">Rates set via Auction</li>
          <li className="step">Loan Active</li>
          <li className="step">Repay or Receive Funds at Maturity</li>
        </ul>
      </div>

      <div className="text-sm text-base-content/70">
        Built on{" "}
        <InfoTooltip
          term="Uniswap V4 Hooks"
          explanation="Custom logic integrated directly into Uniswap V4 pools, enabling novel financial applications like this lending protocol."
        />{" "}
        and{" "}
        <InfoTooltip
          term="World ID"
          explanation="A privacy-preserving identity protocol that lets you prove you're a unique human online."
        />
        .
      </div>
    </div>
  );
};
