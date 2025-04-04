"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CurrencyDollarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"; // Using outline icons for consistency

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Lend", href: "/lend", icon: ArrowUpTrayIcon },
  // { name: "Borrow", href: "/borrow", icon: ArrowDownTrayIcon }, // Placeholder for future borrow feature
  // { name: "Portfolio", href: "/portfolio", icon: CurrencyDollarIcon }, // Placeholder for future portfolio feature
];

export const TabBar = () => {
  const pathname = usePathname();

  return (
    <div className="btm-nav border-t border-base-300">
      {tabs.map((tab) => (
        <Link key={tab.name} href={tab.href} legacyBehavior>
          <a
            className={`${pathname === tab.href ? "active text-primary" : ""}`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="btm-nav-label">{tab.name}</span>
          </a>
        </Link>
      ))}
    </div>
  );
};
