// Script to create a pool using the factory and tokens
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Check if factory and tokens are deployed
  const factoryPath = path.join(__dirname, '../deployed-factory.json');
  const tokensPath = path.join(__dirname, '../deployed-tokens.json');
  
  if (!fs.existsSync(factoryPath)) {
    console.error("Factory deployment file not found. Run the deploy-factory script first.");
    process.exit(1);
  }
  
  if (!fs.existsSync(tokensPath)) {
    console.error("Token deployment file not found. Run the deploy-tokens script first.");
    process.exit(1);
  }
  
  // Load deployment information
  const factoryInfo = JSON.parse(fs.readFileSync(factoryPath, 'utf8'));
  const tokensInfo = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  
  console.log("Factory address:", factoryInfo.factory);
  console.log("Token0 address:", tokensInfo.tokens.token0);
  console.log("Token1 address:", tokensInfo.tokens.token1);
  
  // Get the factory contract
  const factory = await hre.ethers.getContractAt(
    'UniswapV3Factory',
    factoryInfo.factory
  );
  
  // Ensure token0 address is less than token1 (requirement for Uniswap V3)
  const token0Address = tokensInfo.tokens.token0.toLowerCase();
  const token1Address = tokensInfo.tokens.token1.toLowerCase();
  
  let sortedToken0Address, sortedToken1Address;
  
  if (token0Address < token1Address) {
    sortedToken0Address = tokensInfo.tokens.token0;
    sortedToken1Address = tokensInfo.tokens.token1;
  } else {
    sortedToken0Address = tokensInfo.tokens.token1;
    sortedToken1Address = tokensInfo.tokens.token0;
  }
  
  console.log('Sorted token addresses:');
  console.log('Token0:', sortedToken0Address);
  console.log('Token1:', sortedToken1Address);
  
  // Define the fee for the pool (0.3% = 3000)
  const fee = 3000;
  
  // Check if pool already exists
  const existingPool = await factory.getPool(
    sortedToken0Address,
    sortedToken1Address,
    fee
  );
  
  if (existingPool !== '0x0000000000000000000000000000000000000000') {
    console.log("Pool already exists at:", existingPool);
    
    // Save the pool information
    const deploymentInfo = {
      networkName: hre.network.name,
      factory: factoryInfo.factory,
      tokens: {
        token0: {
          address: tokensInfo.tokens.token0,
          sortedAddress: sortedToken0Address
        },
        token1: {
          address: tokensInfo.tokens.token1,
          sortedAddress: sortedToken1Address
        }
      },
      pool: {
        address: existingPool,
        fee: fee
      }
    };
    
    const poolPath = path.join(__dirname, '../deployed-pool.json');
    fs.writeFileSync(
      poolPath,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`Pool information saved to ${poolPath}`);
    process.exit(0);
  }
  
  // Create the pool
  console.log(`Creating pool with ${fee/10000}% fee...`);
  
  const tx = await factory.createPool(
    sortedToken0Address,
    sortedToken1Address,
    fee
  );
  
  await tx.wait();
  
  // Get the pool address
  const poolAddress = await factory.getPool(
    sortedToken0Address,
    sortedToken1Address,
    fee
  );
  
  console.log('Pool created at:', poolAddress);
  
  // Get the pool contract
  const UniswapV3Pool = await hre.ethers.getContractFactory('UniswapV3Pool');
  const pool = UniswapV3Pool.attach(poolAddress);
  
  // Initialize pool with price of 1:1 (sqrtPriceX96 = sqrt(1) * 2^96)
  console.log('Initializing pool...');
  const sqrtPriceX96 = '79228162514264337593543950336'; // sqrt(1) * 2^96
  await pool.initialize(sqrtPriceX96);
  console.log('Pool initialized!');
  
  // Save deployment info to a file
  const deploymentInfo = {
    networkName: hre.network.name,
    factory: factoryInfo.factory,
    tokens: {
      token0: {
        address: tokensInfo.tokens.token0,
        sortedAddress: sortedToken0Address
      },
      token1: {
        address: tokensInfo.tokens.token1,
        sortedAddress: sortedToken1Address
      }
    },
    pool: {
      address: poolAddress,
      fee: fee,
      initialSqrtPriceX96: sqrtPriceX96
    }
  };
  
  const poolPath = path.join(__dirname, '../deployed-pool.json');
  fs.writeFileSync(
    poolPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Pool deployment information saved to ${poolPath}`);
  console.log('Pool creation complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Add empty export to make this file a module
export {}; 