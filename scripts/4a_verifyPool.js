// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for verifying the pool
const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // Replace with Token A address
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // Replace with Token B address
const feeTier = 500; // Fee tier for the pool (e.g., 500 for 0.05%)

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
