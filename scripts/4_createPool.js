const { ethers } = require('hardhat');

const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // Replace with Token A address
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // Replace with Token B address
const feeTier = 3000; // Use a different fee tier (0.3%)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Using deployer account:', deployer.address);

  try {
    // Step 1: Create the Pool using the Factory Contract
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);

    let poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log('No pool found, creating a new pool.');

      // Create the pool using the Factory contract
      const createTx = await factoryContract.createPool(tokenA, tokenB, feeTier);
      await createTx.wait();
      console.log('Pool created successfully.');

      // Fetch the newly created pool address
      poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
      console.log('Pool Address:', poolAddress);
    } else {
      console.log('Pool already exists at address:', poolAddress);
    }

    // Step 2: Initialize the Pool with Initial Price
    // Calculate sqrtPriceX96 for price ratio of 0.5
    const price = ethers.utils.parseUnits('0.5', 18); // Use 18 decimals for precision
    const sqrtPrice = price.sqrt(); // Get the square root of the price as a BigNumber
    const sqrtPriceX96 = sqrtPrice.mul(ethers.BigNumber.from(2).pow(96)); // Multiply by 2^96 to get sqrtPriceX96

    console.log('Initializing pool with initial price:', sqrtPriceX96.toString());

    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
    const initializeTx = await poolContract.initialize(sqrtPriceX96, {
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
