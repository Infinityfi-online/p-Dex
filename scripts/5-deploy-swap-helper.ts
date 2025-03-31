// Script to deploy the TestUniswapV3SwapPay helper contract
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying TestUniswapV3SwapPay with the account:', deployer.address);

  // Deploy TestUniswapV3SwapPay
  console.log('Deploying TestUniswapV3SwapPay...');
  const TestUniswapV3SwapPay = await hre.ethers.getContractFactory('TestUniswapV3SwapPay');
  const swapHelper = await TestUniswapV3SwapPay.deploy();
  await swapHelper.deployed();
  console.log('TestUniswapV3SwapPay deployed to:', swapHelper.address);
  
  // Update the swapHelper.ts file with the deployed address
  const swapHelperPath = path.join(__dirname, '../p-dex-app/src/constants/swapHelper.ts');
  
  if (fs.existsSync(swapHelperPath)) {
    let content = fs.readFileSync(swapHelperPath, 'utf8');
    
    // Replace the placeholder address with the actual deployed address
    content = content.replace(
      /export const SWAP_HELPER_ADDRESS = "0x0000000000000000000000000000000000000000";/,
      `export const SWAP_HELPER_ADDRESS = "${swapHelper.address}";`
    );
    
    fs.writeFileSync(swapHelperPath, content);
    console.log(`Updated SwapHelper address in ${swapHelperPath}`);
  } else {
    console.warn(`Warning: Could not find ${swapHelperPath} to update the address`);
  }
  
  console.log('TestUniswapV3SwapPay deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {};