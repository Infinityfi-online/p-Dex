// Script to mint tokens to a specific wallet address
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Define the wallet address to mint tokens to
  const targetWalletAddress = "0x4222Fd3257F7C760F07d11f0354e51BA4840Fae7";
  const amountToMint = hre.ethers.utils.parseEther('200'); // 20 tokens with 18 decimals
  
  // Load the deployment information
  const tokensPath = path.join(__dirname, '../deployed-tokens.json');
  
  if (!fs.existsSync(tokensPath)) {
    console.error("Tokens deployment file not found. Run the deploy-tokens script first.");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  console.log("Loaded token info from:", tokensPath);
  
  // Get the contract instances
  const token0 = await hre.ethers.getContractAt(
    'TestERC20',
    deploymentInfo.tokens.token0
  );
  
  const token1 = await hre.ethers.getContractAt(
    'TestERC20',
    deploymentInfo.tokens.token1
  );
  
  // Get signer information
  const [signer] = await hre.ethers.getSigners();
  console.log("Minting tokens using account:", signer.address);
  
  // Mint tokens to the target wallet
  console.log(`Minting ${hre.ethers.utils.formatEther(amountToMint)} Token0 to ${targetWalletAddress}...`);
  await token0.mint(targetWalletAddress, amountToMint);
  
  console.log(`Minting ${hre.ethers.utils.formatEther(amountToMint)} Token1 to ${targetWalletAddress}...`);
  await token1.mint(targetWalletAddress, amountToMint);
  
  // Verify the balances
  const token0Balance = await token0.balanceOf(targetWalletAddress);
  const token1Balance = await token1.balanceOf(targetWalletAddress);
  
  console.log("\nToken balances for wallet", targetWalletAddress);
  console.log("Token0 (TK0):", hre.ethers.utils.formatEther(token0Balance));
  console.log("Token1 (TK1):", hre.ethers.utils.formatEther(token1Balance));
  
  console.log("\nToken minting complete!");
  console.log("You can now use these tokens for swapping in the p-dex-app.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {};