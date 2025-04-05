"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { Config } from "@/lib/config";

// Define base tabs that are always available
const baseTabs = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Lend", href: "/lend", icon: ArrowUpTrayIcon },
];

// Feature-flagged tabs
const borrowingEnabled = Config.features.borrowingEnabled;
const borrowTab = { name: "Borrow", href: "/borrow", icon: ArrowDownTrayIcon };
const portfolioTab = { name: "Portfolio", href: "/portfolio", icon: CurrencyDollarIcon };

// Build the tabs array based on feature flags
const tabs = [
  ...baseTabs,
  ...(borrowingEnabled ? [borrowTab] : []),
  portfolioTab,
];

export const TabBar = () => {
  const pathname = usePathname();

  return (
    <div role="tablist" className="tabs tabs-boxed bg-base-200 p-1 rounded-xl mx-auto max-w-md mb-4">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          role="tab"
          className={`tab flex-1 flex items-center justify-center gap-2 transition-all duration-200 ${
            pathname === tab.href
              ? "tab-active bg-primary text-primary-content font-medium" 
              : "hover:bg-base-300"
          }`}
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.name}</span>
        </Link>
      ))}
    </div>
  );
};
