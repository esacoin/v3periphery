const { ethers } = require('hardhat');

const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // Replace with Token A address
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // Replace with Token B address
const feeTier = 3000; // Example fee tier (0.3%)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Using deployer account:', deployer.address);

  try {
    // Step 1: Reference the Uniswap V3 Factory Contract
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);

    // Check if the pool already exists
    let poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log('No pool found, creating a new pool...');

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

    // Step 2: Initialize the Pool with an Initial Price
    // The initial price is represented as sqrt(price) * 2^96.
    // For example, if the desired price is 0.5 (tokenB per tokenA), we need sqrt(0.5).
    const targetPrice = 0.5;
    const sqrtPrice = Math.sqrt(targetPrice); // ~0.707106781...

    // We can do: initialPrice = floor(sqrtPrice * 2^96)
    // To avoid floating-point precision issues, we'll scale sqrtPrice by 1e18 first.
    const twoTo96 = ethers.BigNumber.from(2).pow(96);
    const scaleFactor = ethers.BigNumber.from("1000000000000000000"); // 1e18 as BigNumber

    // Convert sqrtPrice to an integer by scaling it
    const sqrtPriceScaled = Math.floor(sqrtPrice * 1e18).toString();

    // Now compute initialPrice:
    // initialPrice = (sqrtPriceScaled / 1e18) * 2^96
    // Use BigNumber arithmetic:
    const initialPrice = ethers.BigNumber.from(sqrtPriceScaled).mul(twoTo96).div(scaleFactor);

    console.log('Initializing pool with initial price:', initialPrice.toString());

    // Interact with the newly created pool
    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
    const initializeTx = await poolContract.initialize(initialPrice);
    await initializeTx.wait();

    console.log('Pool initialized successfully.');
  } catch (error) {
    console.error('Error during pool creation or initialization:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
