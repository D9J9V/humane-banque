"use client";

import { useSession } from "next-auth/react";
import { useVerification } from "@/lib/useVerification";
import { MarketInfo } from "@/components/Dashboard/MarketInfo";
import { VerifyButton } from "@/components/Auth/VerifyButton";
import { SignInButton } from "@/components/Auth/SignInButton";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { isVerified } = useVerification();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-dots loading-lg text-primary"></span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="hero min-h-[60vh] bg-base-200 rounded-box">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-primary">Humane Banque</h1>
            <div className="my-4 badge badge-secondary">Verified Lending</div>
            <p className="py-4">
              Please sign in with your World ID to view market rates and access
              our verified human lending platform.
            </p>
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome stats */}
      <div className="stats shadow stats-vertical lg:stats-horizontal bg-base-100 w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="stat-title">Account Status</div>
          <div className="stat-value text-md">
            {isVerified ? (
              <span className="text-success flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            ) : (
              <span className="text-warning flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Unverified
              </span>
            )}
          </div>
          <div className="stat-desc">{isVerified ? "Human-verified access" : "Verification required"}</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </div>
          <div className="stat-title">Available Actions</div>
          <div className="stat-value text-md">
            <div className="flex flex-wrap gap-2">
              <a href="/lend" className="badge badge-primary badge-lg p-3">Lend</a>
              <a href="/borrow" className="badge badge-secondary badge-lg p-3">Borrow</a>
              <a href="/portfolio" className="badge badge-accent badge-lg p-3">Portfolio</a>
            </div>
          </div>
          <div className="stat-desc">Manage your financial activities</div>
        </div>
      </div>

      {!isVerified ? (
        // Prompt user to verify if they haven't yet
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <h3 className="font-bold">Verification Required</h3>
            <div className="text-xs">Complete World ID verification to access all features</div>
          </div>
          <VerifyButton />
        </div>
      ) : (
        // Welcome back message for verified users
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 className="font-bold">Welcome back!</h3>
            <div className="text-xs">You have full access to all lending and borrowing features</div>
          </div>
        </div>
      )}

      {/* Market Data Section */}
      <div className="bg-base-200 p-6 rounded-box">
        <div className="flex items-center space-x-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h2 className="text-2xl font-semibold">Market Overview</h2>
        </div>
        
        {isVerified ? (
          <MarketInfo />
        ) : (
          // Show a disabled/preview version with a glass effect
          <div className="relative">
            <div className="absolute inset-0 bg-base-100/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-box">
              <div className="card bg-base-100 shadow-xl w-fit">
                <div className="card-body">
                  <h2 className="card-title">Verification Required</h2>
                  <p>Complete verification to view detailed market data</p>
                  <div className="card-actions justify-end">
                    <VerifyButton />
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-40">
              <MarketInfo />
            </div>
          </div>
        )}
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary text-primary-content">
          <div className="card-body">
            <h2 className="card-title">Lend USDC</h2>
            <p>Earn stable returns by providing USDC to verified human borrowers.</p>
            <div className="card-actions justify-end">
              <a href="/lend" className="btn btn-sm">Lend Now</a>
            </div>
          </div>
        </div>
        
        <div className="card bg-secondary text-secondary-content">
          <div className="card-body">
            <h2 className="card-title">Borrow USDC</h2>
            <p>Access capital by providing ETH or WLD as collateral.</p>
            <div className="card-actions justify-end">
              <a href="/borrow" className="btn btn-sm">Borrow Now</a>
            </div>
          </div>
        </div>
        
        <div className="card bg-accent text-accent-content">
          <div className="card-body">
            <h2 className="card-title">View Portfolio</h2>
            <p>Manage your active loans and lending positions.</p>
            <div className="card-actions justify-end">
              <a href="/portfolio" className="btn btn-sm">View Portfolio</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
