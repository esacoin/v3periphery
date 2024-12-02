// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for verifying the pool
const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // Address of Test Token A (TTN)
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // Address of Test Second Token (TT2)
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
      console.log('No pool found for the specified token pair and fee tier. Attempting to create and initialize a new pool.');
      
      // Connect to the Nonfungible Position Manager contract
      const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Replace with your Position Manager address
      const positionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);

      // Check token balances
      const tokenAContract = await ethers.getContractAt('IERC20', tokenA);
      const tokenBContract = await ethers.getContractAt('IERC20', tokenB);
      const balanceA = await tokenAContract.balanceOf(deployer.address);
      const balanceB = await tokenBContract.balanceOf(deployer.address);
      console.log('Balance of Token A:', ethers.utils.formatUnits(balanceA, 18));
      console.log('Balance of Token B:', ethers.utils.formatUnits(balanceB, 18));

      // Approve tokens to be spent by the position manager
      await tokenAContract.approve(positionManagerAddress, ethers.utils.parseUnits('1000', 18));
      await tokenBContract.approve(positionManagerAddress, ethers.utils.parseUnits('1000', 18));
      console.log('Approved the position manager to spend Token A and Token B.');

      // Set the initial price of Token A in terms of Token B (e.g., 0.5 Token B per Token A)
      const initialPrice = ethers.utils.parseUnits('0.5', 18);
      console.log('Setting initial price of pool:', initialPrice.toString());

      // Create and initialize the pool if it does not exist
      const tx = await positionManager.createAndInitializePoolIfNecessary(tokenA, tokenB, feeTier, initialPrice, {
        gasLimit: 500000000, // Increase gas limit
      });
      await tx.wait();
      console.log('Pool created and initialized successfully.');
    } else {
      console.log('Pool already exists at address:', poolAddress);

      // Connect to the Uniswap V3 pool contract
      const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);

      // Check if the pool is initialized by verifying if the sqrtPriceX96 is non-zero
      const slot0 = await poolContract.slot0();
      if (slot0.sqrtPriceX96.eq(0)) {
        console.log('Pool is not initialized.');
      } else {
        console.log('Pool is initialized with sqrtPriceX96:', slot0.sqrtPriceX96.toString());
      }
    }
  } catch (error) {
    console.error('Error verifying or creating pool:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
