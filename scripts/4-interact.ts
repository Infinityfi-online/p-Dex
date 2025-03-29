// Script to demonstrate how to interact with the deployed contracts
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Load the deployment information
  const poolPath = path.join(__dirname, '../deployed-pool.json');
  
  if (!fs.existsSync(poolPath)) {
    console.error("Pool deployment file not found. Run the create-pool script first.");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
  console.log("Loaded deployment info from:", poolPath);
  
  // Get the contract instances
  const factory = await hre.ethers.getContractAt(
    'UniswapV3Factory',
    deploymentInfo.factory
  );
  
  const token0 = await hre.ethers.getContractAt(
    'TestERC20',
    deploymentInfo.tokens.token0.address
  );
  
  const token1 = await hre.ethers.getContractAt(
    'TestERC20',
    deploymentInfo.tokens.token1.address
  );
  
  const pool = await hre.ethers.getContractAt(
    'UniswapV3Pool',
    deploymentInfo.pool.address
  );
  
  // Get some basic information
  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with contracts using account:", signer.address);
  
  // Get token balances
  const token0Balance = await token0.balanceOf(signer.address);
  const token1Balance = await token1.balanceOf(signer.address);
  
  console.log("Token balances:");
  console.log("Token0:", token0Balance.toString());
  console.log("Token1:", token1Balance.toString());
  
  // Get pool information
  const token0Address = await pool.token0();
  const token1Address = await pool.token1();
  const fee = await pool.fee();
  const liquidity = await pool.liquidity();
  const slot0 = await pool.slot0();
  
  console.log("\nPool information:");
  console.log("Pool address:", deploymentInfo.pool.address);
  console.log("Token0 address:", token0Address);
  console.log("Token1 address:", token1Address);
  console.log("Fee:", fee.toString());
  console.log("Liquidity:", liquidity.toString());
  console.log("Current sqrt price:", slot0.sqrtPriceX96.toString());
  console.log("Current tick:", slot0.tick.toString());
  
  console.log("\nInteraction complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {}; 