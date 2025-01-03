// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for verifying the pool
const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin Token
const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA WESA
const feeTier = 3000; // Fee tier for the pool (e.g., 500 for 0.05%)

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Retrieving pool address and verifying initialization with the account:', deployer.address);

  try {
    // Connect to the Uniswap V3 Factory contract
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);

    // Get the pool address for the given tokens and fee tier
    const poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
    
    if (poolAddress === ethers.constants.AddressZero) {
      console.log('No pool found for the specified token pair and fee tier.');
      return;
    } else {
      console.log('Pool Address:', poolAddress);
    }

    // Connect to the Uniswap V3 pool contract
    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);

    // Check if the pool is initialized by verifying if the sqrtPriceX96 is non-zero
    const slot0 = await poolContract.slot0();
    if (slot0.sqrtPriceX96.eq(0)) {
      console.log('Pool is not initialized.');
    } else {
      console.log('Pool is initialized with sqrtPriceX96:', slot0.sqrtPriceX96.toString());
    }
  } catch (error) {
    console.error('Error verifying pool initialization:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
