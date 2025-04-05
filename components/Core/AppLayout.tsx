import { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col min-h-dvh bg-base-100">
      <Header />
      <main className="flex-grow px-4 py-6 bg-gradient-to-b from-base-100 to-base-200/50">
        <div className="container mx-auto max-w-4xl">
          <TabBar />
          <div className="p-4 rounded-xl bg-base-100 shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
