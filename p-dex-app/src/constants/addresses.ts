// Contract addresses and configurations

// Factory contract address (from Hardhat logs)
export const FACTORY_ADDRESS = "0x5c0f0d410CB441BdeB0851a58c25D76C99BE6C6B";

// SwapHelper contract address (from Hardhat logs)
export const SWAP_HELPER_ADDRESS = "0x2181293267760781849981138241801838965648";

// Mock tokens for testing (from Hardhat logs)
export const mockTokens = [
  {
    name: "Token0",
    symbol: "TK0",
    address: "0xbBaF9ad69510623C2a8152B68cF70DA102eD186B",
    decimals: 18
  },
  {
    name: "Token1",
    symbol: "TK1",
    address: "0x78A4C5b3aA0b285b6aAa7895A9DB2e69a6a12Be2",
    decimals: 18
  }
];

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 50002, // Hardhat's default chain ID
  chainName: "pharos devnet",
  rpcUrls: ["https://devnet.dplabs-internal.com"],
  nativeCurrency: {
    name: "PHAROS",
    symbol: "PHA",
    decimals: 18
  }
};

// Fee options for pool creation
export const FEE_OPTIONS = [
  { value: 500, label: "0.05%" },
  { value: 3000, label: "0.3%" },
  { value: 10000, label: "1%" }
]; 