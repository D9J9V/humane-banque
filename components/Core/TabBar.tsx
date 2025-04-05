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
    // Use the 'tabs' component class, adding a style like 'tabs-boxed' or 'tabs-bordered'
    // Add role="tablist" for accessibility
    // You might want to remove border-t/border-base-300 if tabs-boxed/tabs-bordered provides enough separation
    <div role="tablist" className="tabs tabs-boxed">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          role="tab" // Accessibility: Add role="tab" to each tab link
          // Base class 'tab' is required for each item
          // Conditional 'tab-active' for the active tab
          // Conditional 'text-primary' can style the active tab text/icon further if needed
          // Added flex/gap for icon + text layout within the tab
          className={`tab flex items-center gap-1 sm:gap-2 ${
            // Added flex layout
            pathname === tab.href
              ? "tab-active text-primary font-semibold" // DaisyUI active class + custom styling
              : ""
          }`}
        >
          <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />{" "}
          {/* Optional: Adjust icon size */}
          {/* Removed 'btm-nav-label' class, not needed for 'tabs' */}
          <span>{tab.name}</span>
        </Link>
      ))}
    </div>
  );
};
