import { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    // Min height ensures footer stays down on short pages
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Adjust padding-bottom to account for btm-nav height (approx h-16 or 4rem) */}
      <main className="flex-grow p-4 pb-20 bg-base-200/50">
        {" "}
        {/* Added background color */}
        {children}
      </main>
      <TabBar />
    </div>
  );
};
