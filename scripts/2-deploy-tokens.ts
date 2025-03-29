// Script to deploy test tokens
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Check if factory is deployed
  const factoryPath = path.join(__dirname, '../deployed-factory.json');
  if (!fs.existsSync(factoryPath)) {
    console.error("Factory deployment file not found. Run the deploy-factory script first.");
    process.exit(1);
  }
  
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying tokens with the account:', deployer.address);
  
  // Deploy TestERC20 token contracts
  console.log('Deploying test tokens...');
  const TestERC20 = await hre.ethers.getContractFactory('TestERC20');
  
  const token0Amount = hre.ethers.utils.parseEther('1000000');
  const token0 = await TestERC20.deploy(token0Amount);
  await token0.deployed();
  console.log('Token0 deployed to:', token0.address);
  
  const token1Amount = hre.ethers.utils.parseEther('1000000');
  const token1 = await TestERC20.deploy(token1Amount);
  await token1.deployed();
  console.log('Token1 deployed to:', token1.address);
  
  // Save tokens to deployment file
  const deploymentInfo = {
    networkName: hre.network.name,
    tokens: {
      token0: token0.address,
      token1: token1.address
    }
  };
  
  const tokensPath = path.join(__dirname, '../deployed-tokens.json');
  fs.writeFileSync(
    tokensPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Token deployment information saved to ${tokensPath}`);
  console.log('Token deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {}; 