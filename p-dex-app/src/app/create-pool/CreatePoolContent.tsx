'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import TokenSelector from '../../components/TokenSelector';
import { mockTokens, FEE_OPTIONS } from '../../constants/addresses';

export default function CreatePoolContent() {
  const { factoryContract, isConnected, connectWallet, account } = useWeb3();
  const [token0, setToken0] = useState<any>(null);
  const [token1, setToken1] = useState<any>(null);
  const [fee, setFee] = useState<number>(3000); // Default 0.3%
  const [initialPrice, setInitialPrice] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Check factory contract on component mount
  useEffect(() => {
    const checkFactoryContract = async () => {
      if (factoryContract) {
        try {
          const owner = await factoryContract.owner();
          setDebugInfo(`Factory contract connected. Owner: ${owner}`);
        } catch (error: any) {
          console.error("Error checking factory contract:", error);
          setDebugInfo(`Factory contract error: ${error.message}`);
        }
      } else {
        setDebugInfo("Factory contract not connected");
      }
    };

    checkFactoryContract();
  }, [factoryContract]);

  const handleCreatePool = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!token0 || !token1) {
      setMessage({
        text: 'Please select both tokens',
        type: 'error'
      });
      return;
    }

    if (!initialPrice || isNaN(Number(initialPrice)) || Number(initialPrice) <= 0) {
      setMessage({
        text: 'Please enter a valid initial price',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMessage({
      text: 'Creating pool...',
      type: 'info'
    });

    try {
      // Sort token addresses (Uniswap V3 requires tokenA < tokenB)
      let tokenA = token0;
      let tokenB = token1;
      let invertPrice = false;

      if (tokenA.address.toLowerCase() > tokenB.address.toLowerCase()) {
        tokenA = token1;
        tokenB = token0;
        invertPrice = true;
      }

      // Create pool
      if (!factoryContract) {
        throw new Error('Factory contract not initialized');
      }

      setDebugInfo(`Checking if pool exists: ${tokenA.address}, ${tokenB.address}, ${fee}`);
      
      // Check if pool already exists - need to handle this differently
      try {
        const existingPool = await factoryContract.getPool(
          tokenA.address,
          tokenB.address,
          fee
        );
        
        setDebugInfo(`Pool check result: ${existingPool}`);
        
        if (existingPool && existingPool !== ethers.constants.AddressZero) {
          throw new Error(`Pool already exists at: ${existingPool}`);
        }
      } catch (error: any) {
        if (error.message.includes("Pool already exists")) {
          throw error;
        }
        // If there was an error checking for the pool, log it but continue
        console.warn("Error checking existing pool:", error);
        setDebugInfo(`Error checking pool: ${error.message}`);
      }

      // Create pool
      setDebugInfo(`Creating pool: ${tokenA.address}, ${tokenB.address}, ${fee}`);
      
      const tx = await factoryContract.createPool(
        tokenA.address,
        tokenB.address,
        fee
      );
      
      setDebugInfo(`Transaction sent: ${tx.hash}`);
      setMessage({
        text: `Creating pool... Transaction: ${tx.hash}`,
        type: 'info'
      });
      
      await tx.wait();
      
      setDebugInfo(`Transaction confirmed!`);
      setMessage({
        text: 'Pool created successfully! Now initializing price...',
        type: 'success'
      });

      // Try to get pool address again
      try {
        const poolAddress = await factoryContract.getPool(
          tokenA.address,
          tokenB.address,
          fee
        );
        
        setDebugInfo(`New pool address: ${poolAddress}`);
        
        setMessage({
          text: `Pool created successfully at ${poolAddress}`,
          type: 'success'
        });
      } catch (poolError: any) {
        console.error("Error getting new pool address:", poolError);
        setDebugInfo(`Error getting pool address: ${poolError.message}`);
        
        setMessage({
          text: 'Pool created but could not verify address',
          type: 'warning'
        });
      }

    } catch (error: any) {
      console.error('Error creating pool:', error);
      setDebugInfo(`Creation error: ${error.message}`);
      
      setMessage({
        text: `Error: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Pool</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
        <div className="mb-6">
          <TokenSelector
            label="Token 0"
            tokens={mockTokens}
            selectedToken={token0}
            onSelect={setToken0}
          />
        </div>
        
        <div className="mb-6">
          <TokenSelector
            label="Token 1"
            tokens={mockTokens}
            selectedToken={token1}
            onSelect={setToken1}
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Fee Tier</label>
          <select
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-2.5"
          >
            {FEE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Initial Price (token1 per token0)</label>
          <input
            type="text"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-2.5"
            placeholder="1.0"
          />
        </div>
        
        <button
          onClick={handleCreatePool}
          disabled={isLoading}
          className={`w-full px-4 py-2 text-white font-bold rounded ${
            isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Creating...' : isConnected ? 'Create Pool' : 'Connect Wallet to Create Pool'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-800' :
            message.type === 'error' ? 'bg-red-800' : 
            message.type === 'warning' ? 'bg-yellow-800' : 'bg-blue-800'
          }`}>
            {message.text}
          </div>
        )}
        
        {debugInfo && (
          <div className="mt-4 p-3 rounded bg-gray-700 text-xs">
            <p className="font-mono">{debugInfo}</p>
            {account && (
              <p className="font-mono mt-1">Connected Account: {account}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 