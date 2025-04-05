import Link from "next/link";

// Reusable tooltip component for explaining terms inline
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
    <div className="w-full flex flex-col items-center justify-start overflow-y-auto pb-4">
      <div className="stats bg-primary text-primary-content shadow w-full mb-6">
        <div className="stat">
          <div className="stat-title opacity-80">Platform</div>
          <div className="stat-value text-xl md:text-2xl">Verified Human Banking</div>
          <div className="stat-desc opacity-90 mt-2">
            Secure, predictable{" "}
            <InfoTooltip
              term="Fixed-Term"
              explanation="Loans and deposits have clear start and end dates, unlike open-ended terms common in DeFi."
            />{" "}
            DeFi lending with{" "}
            <InfoTooltip
              term="World ID"
              explanation="Uses World ID's Proof-of-Humanity to ensure every participant is a unique real person, preventing bots."
            />
            .
          </div>
        </div>
      </div>

      <div className="divider divider-primary">Key Features</div>
      
      <div className="flex overflow-x-auto gap-4 w-full mb-6 pb-2 snap-x">
        <div className="card bg-secondary text-secondary-content shadow-lg flex-shrink-0 w-[85%] max-w-xs snap-center">
          <div className="card-body">
            <div className="badge badge-outline mb-2">Predictability</div>
            <p>
              Fixed terms and rates mean you know your returns or costs upfront. No surprises from{" "}
              <InfoTooltip
                term="Floating Rates"
                explanation="Interest rates that can change over the life of the loan, common in other DeFi protocols."
              />
              .
            </p>
          </div>
        </div>
        
        <div className="card bg-accent text-accent-content shadow-lg flex-shrink-0 w-[85%] max-w-xs snap-center">
          <div className="card-body">
            <div className="badge badge-outline mb-2">Fair Pricing</div>
            <p>
              Rates set by real supply and demand through{" "}
              <InfoTooltip
                term="Auctions"
                explanation="A mechanism where lenders and borrowers submit bids/offers, and the protocol determines a clearing interest rate."
              />{" "}
              among verified humans.
            </p>
          </div>
        </div>
        
        <div className="card bg-info text-info-content shadow-lg flex-shrink-0 w-[85%] max-w-xs snap-center">
          <div className="card-body">
            <div className="badge badge-outline mb-2">Enhanced Security</div>
            <p>
              <InfoTooltip
                term="Proof-of-Humanity"
                explanation="Cryptographic proof provided by World ID confirming you are a unique human without revealing your identity."
              />{" "}
              prevents attacks, while{" "}
              <InfoTooltip
                term="Over-collateralization"
                explanation="Borrowers must deposit collateral worth more than the loan amount, protecting lenders."
              />{" "}
              secures loans.
            </p>
          </div>
        </div>
      </div>

      <div className="divider divider-primary">Process Flow</div>
      
      <div className="w-full mb-6">
        <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
          <li>
            <div className="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-primary"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            </div>
            <div className="timeline-start md:text-end mb-10">
              <div className="text-lg font-bold">Verify Identity</div>
              <div className="text-sm">Complete World ID verification to prove you&apos;re a unique human</div>
            </div>
            <hr className="bg-primary"/>
          </li>
          <li>
            <hr className="bg-primary"/>
            <div className="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-primary"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            </div>
            <div className="timeline-end mb-10">
              <div className="text-lg font-bold">Choose Position</div>
              <div className="text-sm">
                <InfoTooltip
                  term="Lend"
                  explanation="Provide USDC stablecoins to the protocol to earn fixed interest."
                />{" "}
                or{" "}
                <InfoTooltip
                  term="Borrow"
                  explanation="Take out a USDC loan by locking up assets like ETH or WLD as security."
                />{" "}
                for a fixed term
              </div>
            </div>
            <hr className="bg-primary"/>
          </li>
          <li>
            <hr className="bg-primary"/>
            <div className="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-primary"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            </div>
            <div className="timeline-start md:text-end mb-10">
              <div className="text-lg font-bold">Auction Phase</div>
              <div className="text-sm">Rates are determined fairly through market-based auction mechanism</div>
            </div>
            <hr/>
          </li>
          <li>
            <hr/>
            <div className="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            </div>
            <div className="timeline-end mb-10">
              <div className="text-lg font-bold">Active Period</div>
              <div className="text-sm">Your loan or deposit is active with the fixed rate</div>
            </div>
            <hr/>
          </li>
          <li>
            <hr/>
            <div className="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            </div>
            <div className="timeline-start md:text-end">
              <div className="text-lg font-bold">Maturity</div>
              <div className="text-sm">Borrowers repay, lenders receive principal plus interest</div>
            </div>
          </li>
        </ul>
      </div>

      <div className="divider divider-primary">FAQ</div>
      <div className="w-full mb-6 space-y-3">
        {/* FAQ items using DaisyUI collapse for better organization */}
        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" defaultChecked />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">01</span>
            Why use fixed terms instead of indefinite lending?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">02</span>
            How are interest rates determined?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">03</span>
            Why is World ID verification mandatory?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">04</span>
            How are lenders&apos; funds protected?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">05</span>
            What happens if a borrower defaults?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">06</span>
            Why build this using Uniswap V4 Hooks?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">07</span>
            Is there a platform token?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
            <p>
              <strong>No.</strong> We deliberately avoided introducing a new
              token. The protocol&apos;s value relies on its core mechanics
              using established assets (USDC, ETH, WLD). We believe this leads
              to a more fundamentally sound and sustainable economic model, free
              from token-related complexities and pressures.
            </p>
          </div>
        </div>

        <div className="collapse collapse-arrow bg-base-200 shadow-md rounded-box">
          <input type="radio" name="landing-faq" />
          <div className="collapse-title font-medium text-sm md:text-base flex items-center">
            <span className="badge badge-primary mr-2">08</span>
            Is it complex to use?
          </div>
          <div className="collapse-content text-left space-y-2 bg-base-100 rounded-b-box">
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

      <div className="alert bg-neutral text-neutral-content rounded-box mt-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <div className="text-sm font-medium">Powered by</div>
          <div className="text-xs flex gap-2 items-center">
            <InfoTooltip
              term="Uniswap V4 Hooks"
              explanation="Custom logic integrated directly into Uniswap V4 pools, enabling novel financial applications like this lending protocol."
            />
            +
            <InfoTooltip
              term="World ID"
              explanation="A privacy-preserving identity protocol that lets you prove you're a unique human online."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
