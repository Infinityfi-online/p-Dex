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
  addPharosNetwork: () => Promise<void>;
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
  connectionError: null,
  addPharosNetwork: async () => {}
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

  // Initialize Web3Modal for Pharos devnet connection
  useEffect(() => {
    const setupWeb3Modal = () => {
      const modal = new Web3Modal({
        cacheProvider: true,
        network: 'custom',
        providerOptions: {}
      });
      setWeb3Modal(modal);

      // Check if user is already connected
      if (modal.cachedProvider) {
        connectWallet();
      }
    };
    
    // Setup Web3Modal for Pharos devnet
    setupWeb3Modal();
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

      // Check if connected to Pharos devnet
      if (chainId !== NETWORK_CONFIG.chainId) {
        try {
          // Request network switch
          await web3Provider.send('wallet_switchEthereumChain', [
            { chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` },
          ]);
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
            try {
              await web3Provider.send('wallet_addEthereumChain', [
                {
                  chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                  chainName: NETWORK_CONFIG.chainName,
                  rpcUrls: NETWORK_CONFIG.rpcUrls,
                  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                },
              ]);
            } catch (addError: any) {
              setConnectionError(`Failed to add Pharos devnet to wallet: ${addError.message}`);
              return;
            }
          } else {
            setConnectionError(`Failed to switch to Pharos devnet: ${switchError.message}`);
            return;
          }
        }
        
        // Refresh provider after network switch
        const updatedNetwork = await web3Provider.getNetwork();
        setNetworkId(updatedNetwork.chainId);
      } else {
        setNetworkId(chainId);
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
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

  // Function to add Pharos devnet to wallet
  const addPharosNetwork = async () => {
    try {
      if (!provider) {
        setConnectionError('No provider available. Please connect your wallet first.');
        return;
      }

      await provider.send('wallet_addEthereumChain', [
        {
          chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
          chainName: NETWORK_CONFIG.chainName,
          rpcUrls: NETWORK_CONFIG.rpcUrls,
          nativeCurrency: NETWORK_CONFIG.nativeCurrency,
        },
      ]);

      console.log('Pharos devnet added to wallet');
    } catch (error: any) {
      console.error('Error adding Pharos devnet to wallet:', error);
      setConnectionError(`Failed to add Pharos devnet: ${error.message}`);
    }
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
        connectionError,
        addPharosNetwork
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};