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
        {/* Card 1: Predictability */}
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
        {/* Card 2: Fair Rates */}
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
        {/* Card 3: Security */}
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
            Commit to{" "}
            <InfoTooltip
              term="Lend (Deposit USDC)"
              explanation="Provide USDC stablecoins to the protocol to earn fixed interest."
            />{" "}
            or{" "}
            <InfoTooltip
              term="Borrow (Provide Collateral)"
              explanation="Take out a USDC loan by locking up assets like ETH or WLD as security."
            />{" "}
            for a{" "}
            <InfoTooltip
              term="chosen term"
              explanation="Select a predefined loan duration (e.g., 30, 90 days) with a fixed interest rate."
            />
          </li>
          <li className="step step-primary">Rates set via Auction</li>
          <li className="step">Loan Active</li>
          <li className="step">Repay or Receive Funds at Maturity</li>
        </ul>
      </div>

      {/* --- FAQ Section START --- */}
      <h2 className="text-3xl font-bold mb-6 mt-10">
        Frequently Asked Questions
      </h2>
      <div className="w-full max-w-4xl mb-10 space-y-2">
        {/* FAQ 1: Fixed Terms */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            Why use fixed terms (e.g., 30, 90 days) instead of indefinite
            lending?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              We deliberately chose fixed terms to address the significant{" "}
              <InfoTooltip
                term="duration mismatch risk"
                explanation="Risk arising when assets are lent for potentially longer terms than they are funded, leading to liquidity issues if depositors withdraw unexpectedly."
              />{" "}
              inherent in indefinite lending protocols. Fixed terms provide{" "}
              <strong>predictability and certainty</strong> for both parties:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Lenders:</strong> Know exactly when their capital plus
                fixed interest will be returned.
              </li>
              <li>
                <strong>Borrowers:</strong> Know exactly when their loan is due
                and the fixed interest cost, simplifying financial planning.
              </li>
            </ul>
            <p>
              This structure mirrors established financial instruments,
              promoting a more stable risk environment.
            </p>
          </div>
        </div>

        {/* FAQ 2: Interest Rates */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            How are interest rates determined? Why aren&apos;t they super high?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              Rates are set entirely by{" "}
              <strong>market supply and demand</strong> through periodic{" "}
              <InfoTooltip
                term="auctions"
                explanation="A process where verified lenders and borrowers submit desired rates, and the protocol finds the market-clearing rate."
              />{" "}
              via the underlying <code>AuctionRepoHook</code> smart contract.
            </p>
            <p>
              We consciously <strong>avoid artificial subsidies</strong> (like
              inflationary token rewards) that create temporarily high but
              unsustainable yields. Humane Banque prioritizes{" "}
              <strong>long-term economic viability and transparency</strong>.
            </p>
          </div>
        </div>

        {/* FAQ 3: World ID Mandatory */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            Why is World ID verification mandatory?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              This is core to our &quot;Humane&quot; philosophy. It ensures{" "}
              <strong>every participant is a unique, verified human</strong>,
              achieving:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Sybil Resistance:</strong> Prevents bots/single entities
                from manipulating auctions or loans.
              </li>
              <li>
                <strong>Fair Market:</strong> Rates reflect genuine human supply
                and demand.
              </li>
              <li>
                <strong>Enhanced Trust:</strong> Reduces risks from anonymous
                actors.
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ 4: Lender Protection */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            How are lenders&apos; funds protected (besides World ID)?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>We use several standard and unique mechanisms:</p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Over-Collateralization:</strong> Borrowers pledge assets
                (ETH, WLD) worth significantly more than the loan (USDC).
              </li>
              <li>
                <strong>Reliable Price Feeds:</strong> Using Uniswap V4&apos;s
                built-in{" "}
                <InfoTooltip
                  term="TWAP"
                  explanation="Time-Weighted Average Price oracles, which are resistant to short-term price manipulation."
                />{" "}
                oracles.
              </li>
              <li>
                <strong>Liquidation Mechanism:</strong> Automatic sale of
                collateral on Uniswap if its value drops below a safe threshold.
              </li>
              <li>
                <strong>Accountability:</strong> Internal mechanism to deter
                defaults (see next question).
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ 5: Defaults & Blacklisting */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            What happens if a borrower defaults? What is &quot;defaulter
            blacklisting&quot;?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              If a borrower doesn&apos;t repay, their collateral is liquidated
              to repay the lender.
            </p>
            <p>
              To foster accountability, we use an{" "}
              <strong>internal reputation mechanism</strong>. The unique,
              anonymous{" "}
              <InfoTooltip
                term="World ID nullifier hash"
                explanation="A private, unique identifier linked to a verified World ID, usable within specific applications without revealing the user's public identity."
              />{" "}
              of the defaulter is recorded internally. This specific verified
              human (identified only by this hash within Humane Banque) is{" "}
              <strong>prevented from taking out *new* loans</strong> via the
              protocol.
            </p>
            <p>
              This is <strong>not a public list</strong> and preserves privacy,
              but acts as an internal control to reduce credit risk and deter
              repeat defaults, benefiting all responsible users.
            </p>
          </div>
        </div>

        {/* FAQ 6: Uniswap V4 Hooks */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            Why build this using Uniswap V4 Hooks?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              Uniswap V4 Hooks allow embedding custom logic directly into
              Uniswap pools, providing:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Access to Liquidity:</strong> Efficient collateral
                liquidation via the Uniswap pool.
              </li>
              <li>
                <strong>Reliable Oracles:</strong> Leveraging the pool&apos;s
                robust on-chain TWAP data.
              </li>
              <li>
                <strong>Integration:</strong> Seamless coexistence within the
                broader DeFi infrastructure.
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ 7: No Token */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            Does Humane Banque have its own token?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              <strong>No.</strong> We deliberately avoided introducing a new
              token. The protocol&apos;s value relies on its core mechanics
              using established assets (USDC, ETH, WLD). We believe this leads
              to a more fundamentally sound and sustainable economic model, free
              from token-related complexities and pressures.
            </p>
          </div>
        </div>

        {/* FAQ 8: User Experience */}
        <div className="collapse collapse-plus bg-base-100 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium">
            Are the complex mechanics difficult for end-users?
          </div>
          <div className="collapse-content text-left space-y-2">
            <p>
              While the underlying protocol (<code>AuctionRepoHook</code>) is
              sophisticated, the{" "}
              <strong>
                Humane Banque Mini App in World App is designed for simplicity
              </strong>
              . We abstract the complexity. Users interact with a clean
              interface for straightforward actions (deposit, borrow, manage
              positions) – like a modern digital banking app, but decentralized
              and human-verified.
            </p>
          </div>
        </div>
      </div>
      {/* --- FAQ Section END --- */}

      <div className="text-sm text-base-content/70 mt-4">
        {" "}
        {/* Added mt-4 for spacing */}
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
