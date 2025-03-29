// Contract addresses and configurations

// Factory contract address (from Hardhat logs)
export const FACTORY_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

// Mock tokens for testing (from Hardhat logs)
export const mockTokens = [
  {
    name: "Token0",
    symbol: "TK0",
    address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    decimals: 18
  },
  {
    name: "Token1",
    symbol: "TK1",
    address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
    decimals: 18
  }
];

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31337, // Hardhat's default chain ID
  chainName: "Hardhat Local",
  rpcUrls: ["http://localhost:8545"],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  }
};

// Fee options for pool creation
export const FEE_OPTIONS = [
  { value: 500, label: "0.05%" },
  { value: 3000, label: "0.3%" },
  { value: 10000, label: "1%" }
]; 