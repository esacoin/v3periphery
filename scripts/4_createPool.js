// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for creating a pool
const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Nonfungible Position Manager address
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // Address of Token A (TTN)
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // Address of Token B (TT2)
const feeTier = 500; // Fee tier for the pool (e.g., 500 for 0.05%)
const initialPrice = ethers.utils.parseUnits('0.5', 18); // Set your desired initial price (e.g., 0.5 TT2 per TTN)

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Creating and initializing pool with the account:', deployer.address);

  try {
    // Connect to the Nonfungible Position Manager contract
    const positionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);

    // Create and initialize the pool if necessary with a manual gas limit
    const tx = await positionManager.createAndInitializePoolIfNecessary(
      tokenA,
      tokenB,
      feeTier,
      initialPrice,
      { gasLimit: ethers.utils.hexlify(3000000) } // Manually set the gas limit
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log('Pool created and initialized successfully. Transaction Hash:', receipt.transactionHash);
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
