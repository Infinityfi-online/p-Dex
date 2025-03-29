'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { FACTORY_ABI, POOL_ABI, ERC20_ABI } from '../constants/abis';
import { FACTORY_ADDRESS, NETWORK_CONFIG } from '../constants/addresses';

// Define the shape of our context
interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  networkId: number | null;
  factoryContract: ethers.Contract | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getPoolContract: (address: string) => ethers.Contract;
  getTokenContract: (address: string) => ethers.Contract;
  connectionError: string | null;
}

// Create the context with default values
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  networkId: null,
  factoryContract: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  getPoolContract: () => {
    throw new Error('Web3Context not initialized');
  },
  getTokenContract: () => {
    throw new Error('Web3Context not initialized');
  },
  connectionError: null
});

// Create a hook to use the context
export const useWeb3 = () => useContext(Web3Context);

// Provider component that wraps app and provides context values
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Try to connect directly to Hardhat for development
  useEffect(() => {
    const connectToHardhat = async () => {
      try {
        // First try to connect directly to Hardhat node for development
        const hardhatProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        const network = await hardhatProvider.getNetwork();
        
        if (network.chainId === 31337) {
          console.log("Connected directly to Hardhat node");
          
          // Get first account for development
          const accounts = await hardhatProvider.listAccounts();
          const hardhatSigner = hardhatProvider.getSigner(accounts[0]);
          
          setProvider(hardhatProvider as unknown as ethers.providers.Web3Provider);
          setSigner(hardhatSigner);
          setAccount(accounts[0]);
          setNetworkId(network.chainId);
          setIsConnected(true);
          
          // Set up factory contract
          if (FACTORY_ADDRESS) {
            try {
              const factory = new ethers.Contract(
                FACTORY_ADDRESS, 
                FACTORY_ABI, 
                hardhatSigner
              );
              setFactoryContract(factory);
              console.log("Factory contract initialized with Hardhat provider");
            } catch (error: any) {
              console.error("Error initializing factory contract with Hardhat:", error);
              setConnectionError(`Factory contract error: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.warn("Could not connect to Hardhat node directly, will use Web3Modal");
        // Continue with Web3Modal setup
        setupWeb3Modal();
      }
    };
    
    const setupWeb3Modal = () => {
      const modal = new Web3Modal({
        cacheProvider: true,
        network: 'hardhat',
        providerOptions: {}
      });
      setWeb3Modal(modal);

      // Check if user is already connected
      if (modal.cachedProvider) {
        connectWallet();
      }
    };
    
    // First try Hardhat direct connection, fall back to Web3Modal
    connectToHardhat();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setConnectionError(null);
      
      if (!web3Modal) {
        console.error('Web3Modal not initialized');
        setConnectionError('Wallet connection not initialized');
        return;
      }

      const instance = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);
      const web3Signer = web3Provider.getSigner();
      const accounts = await web3Provider.listAccounts();
      const { chainId } = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setNetworkId(chainId);
      setIsConnected(true);

      // Initialize factory contract
      if (FACTORY_ADDRESS) {
        try {
          const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, web3Signer);
          setFactoryContract(factory);
        } catch (error: any) {
          console.error('Error initializing factory contract:', error);
          setConnectionError(`Error initializing factory: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('Could not connect to wallet:', error);
      
      // Handle user rejection specifically
      if (error.code === 4001 || error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        setConnectionError('Connection rejected. Please approve the connection request in your wallet.');
      } else if (error.message?.includes('already processing')) {
        setConnectionError('A connection is already in progress. Please check your wallet.');
      } else {
        setConnectionError(`Wallet connection failed: ${error.message || 'Unknown error'}`);
      }
      
      // Clear cached provider if there was an error
      if (web3Modal && (error.code === 4001 || error.message?.includes('User rejected'))) {
        web3Modal.clearCachedProvider();
      }
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
    }
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetworkId(null);
    setFactoryContract(null);
    setIsConnected(false);
    setConnectionError(null);
  };

  // Function to get a pool contract instance
  const getPoolContract = (address: string) => {
    if (!signer) throw new Error('Signer not initialized');
    return new ethers.Contract(address, POOL_ABI, signer);
  };

  // Function to get a token contract instance
  const getTokenContract = (address: string) => {
    if (!signer) throw new Error('Signer not initialized');
    return new ethers.Contract(address, ERC20_ABI, signer);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        networkId,
        factoryContract,
        isConnected,
        connectWallet,
        disconnectWallet,
        getPoolContract,
        getTokenContract,
        connectionError
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}; 