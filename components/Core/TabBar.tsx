"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CurrencyDollarIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
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
const infoTab = { name: "Info", href: "/info", icon: InformationCircleIcon };

// Build the tabs array based on feature flags
const tabs = [
  ...baseTabs,
  ...(borrowingEnabled ? [borrowTab] : []),
  portfolioTab,
  infoTab,
];

export const TabBar = () => {
  const pathname = usePathname();

  // Use a fixed grid-cols-5 since we have 5 tabs (or adjust if borrowingEnabled is false)
  const gridClass = borrowingEnabled ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className={`grid ${gridClass} h-full w-full`}>
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          className={`flex flex-col items-center justify-center ${
            pathname === tab.href ? 'text-primary font-medium' : 'text-base-content/70'
          }`}
        >
          <tab.icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{tab.name}</span>
        </Link>
      ))}
    </div>
  );
};
