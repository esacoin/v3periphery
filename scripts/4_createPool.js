const { ethers } = require('hardhat');

const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin Token
const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA WESA
const feeTier = 3000; // Example fee tier (0.3%)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Using deployer account:', deployer.address);

  try {
    // Step 1: Reference the Uniswap V3 Factory Contract
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);

    // Check if the pool already exists
    let poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
    console.log('Pool Address:', poolAddress);

    if (poolAddress === ethers.constants.AddressZero) {
      console.log('No pool found, creating a new pool...');

      // Create the pool using the Factory contract
      const createTx = await factoryContract.createPool(tokenA, tokenB, feeTier, {
        gasLimit: 5000000, // Increased gas limit
        gasPrice: ethers.utils.parseUnits('20', 'gwei'), // Increased gas price
      });
      console.log('Create pool transaction sent, tx hash:', createTx.hash);

      const receipt = await createTx.wait();
      console.log('Transaction receipt:', receipt);

      // Fetch the newly created pool address
      poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
      console.log('New Pool Address:', poolAddress);
    } else {
      console.log('Pool already exists at address:', poolAddress);
    }

    // Step 2: Initialize the Pool with an Initial Price
    // The initial price is represented as sqrt(price) * 2^96.
    // For example, if the desired price is 0.5 (tokenB per tokenA), we need sqrt(0.5).
    const targetPrice = 0.5;
    const sqrtPrice = Math.sqrt(targetPrice); // ~0.707106781...

    const twoTo96 = ethers.BigNumber.from(2).pow(96);
    const scaleFactor = ethers.BigNumber.from('1000000000000000000'); // 1e18
    const sqrtPriceScaled = Math.floor(sqrtPrice * 1e18).toString();
    const initialPrice = ethers.BigNumber.from(sqrtPriceScaled).mul(twoTo96).div(scaleFactor);

    console.log('Initializing pool with initial price:', initialPrice.toString());

    // Interact with the newly created pool
    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
    const initializeTx = await poolContract.initialize(initialPrice, {
      gasLimit: 5000000,
      gasPrice: ethers.utils.parseUnits('20', 'gwei'),
    });
    console.log('Initialize transaction sent, tx hash:', initializeTx.hash);

    const initializeReceipt = await initializeTx.wait();
    console.log('Initialize transaction receipt:', initializeReceipt);

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
