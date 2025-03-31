'use client';

import Link from "next/link";
import { Web3Provider, useWeb3 } from "../context/Web3Context";
import Layout from "../components/Layout";
import { NETWORK_CONFIG } from "../constants/addresses";

// This component will be wrapped with Web3Provider
function HomeContent() {
  const { isConnected, connectWallet, connectionError } = useWeb3();

  return (
    <div className="bg-gray-900 min-h-[80vh] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            p-Dex on Pharos
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-300">
            Your personal Uniswap V3 decentralized exchange on Pharos devnet
          </p>
          <div className="mt-2 bg-blue-800 inline-block px-4 py-2 rounded-md">
            <p className="text-sm font-medium">Exclusively for Pharos devnet (Chain ID: {NETWORK_CONFIG.chainId})</p>
          </div>

          {!isConnected && (
            <div className="mt-8">
              <button
                onClick={connectWallet}
                disabled={!!connectionError}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  connectionError ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Connect Wallet
              </button>
              {connectionError && (
                <p className="mt-2 text-red-400 text-sm">
                  {connectionError}
                </p>
              )}
            </div>
          )}

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5">
                <h3 className="text-lg leading-6 font-medium text-white">Create a Pool</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-400">
                  <p>Deploy a new Uniswap V3 pool with your own token pair. Choose the fee tier and initialize the price.</p>
                </div>
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-400">
                  <li>Select two tokens to pair</li>
                  <li>Choose a fee tier (0.05%, 0.3%, or 1%)</li>
                  <li>Deploy your pool to the blockchain</li>
                </ul>
                <div className="mt-5">
                  <Link href="/create-pool">
                    <span className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Create a pool
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5">
                <h3 className="text-lg leading-6 font-medium text-white">Swap Tokens</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-400">
                  <p>Swap tokens on any of the deployed Uniswap V3 pools. Select your input and output tokens, and the amount to swap.</p>
                </div>
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-400">
                  <li>Swap between any token pair with an existing pool</li>
                  <li>View price impact before confirming</li>
                  <li>Connect your wallet to start trading</li>
                </ul>
                <div className="mt-5">
                  <Link href="/swap">
                    <span className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Swap tokens
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5">
              <h3 className="text-lg leading-6 font-medium text-white">About Uniswap V3</h3>
              <div className="mt-2 max-w-4xl mx-auto text-sm text-gray-400">
                <p>
                  Uniswap V3 introduces concentrated liquidity, allowing liquidity providers to allocate capital more efficiently.
                  It offers better capital efficiency, lower slippage, and more flexible fee tiers compared to previous versions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Web3Provider>
      <Layout>
        <HomeContent />
      </Layout>
    </Web3Provider>
  );
}
