"use client";

import { SignInButton } from "@/components/Auth/SignInButton";
import Link from "next/link";

export const Header = () => {
  return (
    <div className="navbar bg-base-100 border-b border-base-300">
      <div className="flex-1">
        <Link href="/dashboard" legacyBehavior>
          <a className="btn btn-ghost text-xl normal-case">Humane Banque</a>
        </Link>
      </div>
      <div className="flex-none">
        <SignInButton />
      </div>
    </div>
  );
};
