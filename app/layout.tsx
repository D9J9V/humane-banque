import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import dynamic from "next/dynamic";
import NextAuthProvider from "@/components/next-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Humane Banque",
  description: "Secure Fixed-Term DeFi Lending for Verified Humans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dynamically import Eruda for debugging, ensuring it only runs client-side
  const ErudaProvider = dynamic(
    () => import("../components/Eruda").then((c) => c.ErudaProvider),
    {
      ssr: false,
    },
  );

  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <ErudaProvider>
            <MiniKitProvider>{children}</MiniKitProvider>
          </ErudaProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
