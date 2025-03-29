'use client';

import React from 'react';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isConnected, connectWallet, disconnectWallet, account, connectionError } = useWeb3();

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-2xl font-bold">p-Dex</span>
              </Link>
            </div>
            
            <nav className="flex space-x-4">
              <Link href="/">
                <span className="px-3 py-2">Home</span>
              </Link>
              <Link href="/create-pool">
                <span className="px-3 py-2">Create Pool</span>
              </Link>
              <Link href="/swap">
                <span className="px-3 py-2">Swap</span>
              </Link>
            </nav>
            
            <div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-gray-800">
                    {account && truncateAddress(account)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-2 bg-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-3 py-2 bg-blue-600"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {connectionError && (
        <div className="bg-red-800 text-white p-3">
          <div className="max-w-7xl mx-auto px-4">
            {connectionError}
          </div>
        </div>
      )}
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          {children}
        </div>
      </main>
      
      <footer className="bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>p-Dex - A Uniswap V3 Interface</p>
        </div>
      </footer>
    </div>
  );
} 