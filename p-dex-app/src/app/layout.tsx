import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "p-Dex - Pharos Devnet DEX",
  description: "Your personal Uniswap V3 decentralized exchange on Pharos devnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}
