// Script to mint tokens to a specific wallet and perform a swap
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  // Define the wallet address to mint tokens to
  const targetWalletAddress = "0x4222Fd3257F7C760F07d11f0354e51BA4840Fae7";
  const amountToMint = hre.ethers.utils.parseEther('20'); // 20 tokens with 18 decimals
  const amountToSwap = hre.ethers.utils.parseEther('10'); // Swap 10 tokens
  
  // Load the deployment information
  const tokensPath = path.join(__dirname, '../deployed-tokens.json');
  const poolPath = path.join(__dirname, '../deployed-pool.json');
  
  if (!fs.existsSync(tokensPath) || !fs.existsSync(poolPath)) {
    console.error("Deployment files not found. Make sure tokens and pool are deployed.");
    process.exit(1);
  }
  
  const tokenInfo = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const poolInfo = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
  
  console.log("Loaded deployment info:");
  console.log("- Token0:", tokenInfo.tokens.token0);
  console.log("- Token1:", tokenInfo.tokens.token1);
  console.log("- Pool:", poolInfo.pool.address);
  
  // Get the contract instances
  const token0 = await hre.ethers.getContractAt(
    'TestERC20',
    tokenInfo.tokens.token0
  );
  
  const token1 = await hre.ethers.getContractAt(
    'TestERC20',
    tokenInfo.tokens.token1
  );
  
  const pool = await hre.ethers.getContractAt(
    'UniswapV3Pool',
    poolInfo.pool.address
  );
  
  // Get the swap helper contract
  const swapHelperAddress = poolInfo.swapHelper || "0xdFcF98987310a068e9f0F8190A58eE2f98552d7e";
  const swapHelperABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "pool",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "zeroForOne",
          "type": "bool"
        },
        {
          "internalType": "uint160",
          "name": "sqrtPriceX96",
          "type": "uint160"
        },
        {
          "internalType": "int256",
          "name": "amountSpecified",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "pay0",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "pay1",
          "type": "uint256"
        }
      ],
      "name": "swap",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  
  const swapHelper = await hre.ethers.getContractAt(swapHelperABI, swapHelperAddress);
  
  // Get signer information
  const [signer] = await hre.ethers.getSigners();
  console.log("\nUsing account:", signer.address);
  
  // Step 1: Mint tokens to the target wallet
  console.log(`\nStep 1: Minting ${hre.ethers.utils.formatEther(amountToMint)} Token0 (TK0) to ${targetWalletAddress}...`);
  await token0.mint(targetWalletAddress, amountToMint);
  
  console.log(`Minting ${hre.ethers.utils.formatEther(amountToMint)} Token1 (TK1) to ${targetWalletAddress}...`);
  await token1.mint(targetWalletAddress, amountToMint);
  
  // Verify the balances
  const token0Balance = await token0.balanceOf(targetWalletAddress);
  const token1Balance = await token1.balanceOf(targetWalletAddress);
  
  console.log("\nToken balances for wallet", targetWalletAddress);
  console.log("Token0 (TK0):", hre.ethers.utils.formatEther(token0Balance));
  console.log("Token1 (TK1):", hre.ethers.utils.formatEther(token1Balance));
  
  // Step 2: Add liquidity to the pool if needed
  console.log("\nStep 2: Checking pool liquidity...");
  const liquidity = await pool.liquidity();
  
  if (liquidity.eq(0)) {
    console.log("Pool has no liquidity. Adding initial liquidity...");
    // This would require a more complex implementation to add liquidity
    // For simplicity, we'll just note that liquidity should be added
    console.log("NOTE: Please add liquidity to the pool before swapping.");
  } else {
    console.log("Pool has liquidity:", liquidity.toString());
  }
  
  // Step 3: Prepare for swap (if we were to execute it)
  console.log("\nStep 3: Preparing for swap...");
  console.log("To execute a swap, you would need to:");
  console.log("1. Connect your wallet to the p-dex-app");
  console.log("2. Select Token0 (TK0) as the input token");
  console.log("3. Select Token1 (TK1) as the output token");
  console.log("4. Enter the amount you want to swap (up to 20 tokens)");
  console.log("5. Click the 'Swap' button");
  
  console.log("\nThe SwapService in the p-dex-app will handle:");
  console.log("- Checking your token balance");
  console.log("- Approving the swap helper contract to spend your tokens");
  console.log("- Executing the swap through the Uniswap V3 pool");
  
  console.log("\nToken minting complete! You can now use the p-dex-app to perform swaps.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {};