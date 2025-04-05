"use client";

import { SignInButton } from "@/components/Auth/SignInButton";
import { WalletStatus } from "@/components/Core/WalletStatus";
import Link from "next/link";
import { useSession } from "next-auth/react";

export const Header = () => {
  const { data: session } = useSession();
  
  return (
    <div className="navbar bg-base-100 border-b border-base-300">
      <div className="flex-1">
        <Link href="/dashboard" legacyBehavior>
          <a className="btn btn-ghost text-xl normal-case">Humane Banque</a>
        </Link>
      </div>
      <div className="flex-none gap-2">
        {session && <WalletStatus />}
        <SignInButton />
      </div>
    </div>
  );
};
