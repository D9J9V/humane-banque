import { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    // min-h-screen ensures the TabBar stays at the bottom even on short pages
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* pb-20 accounts for TabBar height (approx h-16 or 4rem) to prevent content overlap */}
      <main className="flex-grow p-4 pb-20 bg-base-200/50">{children}</main>
      <TabBar />
    </div>
  );
};
