import { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-[100vh] bg-base-100">
      {/* Header */}
      <Header />
      
      {/* Content area with scrolling */}
      <main className="overflow-y-auto px-4 py-6 bg-gradient-to-b from-base-100 to-base-200/50">
        <div className="container mx-auto max-w-4xl">
          <div className="p-4 rounded-xl bg-base-100 shadow-sm">
            {children}
          </div>
        </div>
      </main>
      
      {/* Bottom tab bar */}
      <div className="h-16 bg-base-100 border-t border-base-300">
        <TabBar />
      </div>
    </div>
  );
};
