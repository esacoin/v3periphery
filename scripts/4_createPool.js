const { ethers } = require('hardhat');

const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3';
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928';
const feeTier = 500;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('Using deployer account:', deployer.address);
  
  try {
    // Connect to the Uniswap V3 Factory contract
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);

    // Step 1: Create the Pool
    let poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log('No pool found, creating a new pool.');

      const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684';
      const positionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);

      // Create the pool
      const createTx = await positionManager.createPool(tokenA, tokenB, feeTier, {
        gasLimit: 3000000, // Use a reasonable gas limit for pool creation
      });
      await createTx.wait();
      console.log('Pool created successfully.');

      // Fetch the newly created pool address
      poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
      console.log('Pool Address:', poolAddress);
    } else {
      console.log('Pool already exists at address:', poolAddress);
    }

    // Step 2: Initialize the Pool with Initial Price
    const initialPrice = ethers.utils.parseUnits('0.5', 18);
    console.log('Initializing pool with initial price:', initialPrice.toString());

    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
    const initializeTx = await poolContract.initialize(initialPrice, {
      gasLimit: 1500000, // Set a separate reasonable gas limit for initialization
    });
    await initializeTx.wait();
    console.log('Pool initialized with initial price successfully.');

  } catch (error) {
    console.error('Error during pool creation or initialization:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
