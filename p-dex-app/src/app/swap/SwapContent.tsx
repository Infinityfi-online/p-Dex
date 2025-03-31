'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3, Web3Provider } from '../../context/Web3Context';
import TokenSelector from '../../components/TokenSelector';
import { mockTokens } from '../../constants/addresses';

export default function SwapContent() {
  const { factoryContract, isConnected, connectWallet, getPoolContract, provider } = useWeb3();
  const [tokenIn, setTokenIn] = useState<any>(null);
  const [tokenOut, setTokenOut] = useState<any>(null);
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('0');
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Find pool when tokens are selected
  useEffect(() => {
    const findPool = async () => {
      if (factoryContract && tokenIn && tokenOut) {
        try {
          // Check both token orderings
          const pool1 = await factoryContract.getPool(tokenIn.address, tokenOut.address, 3000);
          const pool2 = await factoryContract.getPool(tokenOut.address, tokenIn.address, 3000);
          
          if (pool1 !== ethers.constants.AddressZero) {
            setPoolAddress(pool1);
            setMessage({text: 'Pool found', type: 'success'});
          } else if (pool2 !== ethers.constants.AddressZero) {
            setPoolAddress(pool2);
            setMessage({text: 'Pool found', type: 'success'});
          } else {
            setPoolAddress(null);
            setMessage({text: 'No pool exists for this token pair', type: 'error'});
          }
        } catch (error) {
          console.error('Error finding pool:', error);
          setPoolAddress(null);
          setMessage({text: 'Error finding pool', type: 'error'});
        }
      } else {
        setPoolAddress(null);
      }
    };

    findPool();
  }, [factoryContract, tokenIn, tokenOut]);

  // Swap tokens
  const handleSwap = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!tokenIn || !tokenOut) {
      setMessage({
        text: 'Please select both tokens',
        type: 'error'
      });
      return;
    }

    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
      setMessage({
        text: 'Please enter a valid amount',
        type: 'error'
      });
      return;
    }

    if (!poolAddress) {
      setMessage({
        text: 'No pool exists for this token pair',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMessage({
      text: 'Swapping tokens...',
      type: 'info'
    });

    try {
      // Import SwapService dynamically to avoid SSR issues
      const { SwapService } = await import('../../services/SwapService');
      const swapService = new SwapService(provider as ethers.providers.Web3Provider);
      
      // Execute the swap
      const result = await swapService.executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        poolAddress,
        slippageTolerance: 0.5, // 0.5% slippage tolerance
      });
      
      if (result.success) {
        setMessage({
          text: `Successfully swapped ${result.amountIn} ${tokenIn.symbol} for ${result.amountOut} ${tokenOut.symbol}`,
          type: 'success'
        });
        setAmountIn('');
      } else {
        throw new Error(result.error || 'Swap failed');
      }
      
    } catch (error: any) {
      console.error('Error swapping tokens:', error);
      setMessage({
        text: `Error: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate output amount by querying the pool
  const calculateOutputAmount = async () => {
    if (amountIn && !isNaN(Number(amountIn)) && Number(amountIn) > 0 && tokenIn && tokenOut && poolAddress) {
      try {
        // Import SwapService dynamically to avoid SSR issues
        const { SwapService } = await import('../../services/SwapService');
        const swapService = new SwapService(provider as ethers.providers.Web3Provider);
        
        // Calculate expected output amount
        const calculatedAmount = await swapService.calculateOutputAmount({
          tokenIn,
          tokenOut,
          amountIn,
          poolAddress
        });
        
        setAmountOut(calculatedAmount);
      } catch (error) {
        console.error('Error calculating output amount:', error);
        setAmountOut('0');
      }
    } else {
      setAmountOut('0');
    }
  };

  // Update output amount when input amount changes
  useEffect(() => {
    if (poolAddress) {
      calculateOutputAmount();
    }
  }, [amountIn, tokenIn, tokenOut, poolAddress]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Swap Tokens</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">You Pay</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-2.5"
                placeholder="0.0"
              />
            </div>
            <div className="w-40">
              <TokenSelector
                label=""
                tokens={mockTokens}
                selectedToken={tokenIn}
                onSelect={setTokenIn}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center my-4">
          <button 
            className="bg-gray-700 p-2 rounded-full"
            onClick={() => {
              const temp = tokenIn;
              setTokenIn(tokenOut);
              setTokenOut(temp);
            }}
          >
            ↓↑
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">You Receive (estimated)</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={amountOut}
                disabled
                className="bg-gray-700 border border-gray-600 text-gray-400 rounded-lg block w-full p-2.5"
                placeholder="0.0"
              />
            </div>
            <div className="w-40">
              <TokenSelector
                label=""
                tokens={mockTokens}
                selectedToken={tokenOut}
                onSelect={setTokenOut}
              />
            </div>
          </div>
        </div>
        
        {poolAddress && (
          <div className="mb-6 text-xs text-gray-400">
            <p>Pool: {poolAddress}</p>
          </div>
        )}
        
        <button
          onClick={handleSwap}
          disabled={isLoading}
          className={`w-full px-4 py-2 text-white font-bold rounded ${
            isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Swapping...' : isConnected ? 'Swap' : 'Connect Wallet to Swap'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-800' :
            message.type === 'error' ? 'bg-red-800' : 'bg-blue-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}