// Script to deploy only the UniswapV3Factory
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying factory with the account:', deployer.address);

  // Deploy UniswapV3Factory
  console.log('Deploying UniswapV3Factory...');
  const UniswapV3Factory = await hre.ethers.getContractFactory('UniswapV3Factory');
  const factory = await UniswapV3Factory.deploy();
  await factory.deployed();
  console.log('UniswapV3Factory deployed to:', factory.address);
  
  // Save deployment info to a file
  const deploymentInfo = {
    networkName: hre.network.name,
    factory: factory.address
  };
  
  const deploymentPath = path.join(__dirname, '../deployed-factory.json');
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Factory deployment information saved to ${deploymentPath}`);
  console.log('Factory deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {}; 