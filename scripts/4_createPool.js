// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for initializing the pool
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // TTN
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // TT2
const feeTier = 500; // Fee tier for the pool (e.g., 500 for 0.05%)
const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Address of deployed Nonfungible Position Manager

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Creating and initializing pool with the account:', deployer.address);

  // Connect to the Nonfungible Position Manager contract
  const PositionManager = await ethers.getContractFactory('NonfungiblePositionManager');
  const positionManager = await PositionManager.attach(positionManagerAddress);

  // Set the initial price of Token A in terms of Token B (e.g., 0.5 Token B per Token A)
  const initialPrice = ethers.utils.parseUnits('0.5', 18);

  try {
    // Create and initialize the pool if it doesn't already exist
    const tx = await positionManager.createAndInitializePoolIfNecessary(
      tokenA,
      tokenB,
      feeTier,
      initialPrice
    );
    await tx.wait();

    console.log('Pool created and initialized successfully with initial price:', initialPrice.toString());
  } catch (error) {
    console.error('Error creating and initializing pool:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
