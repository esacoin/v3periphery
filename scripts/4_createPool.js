// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Token addresses and other necessary details for initializing the pool
const tokenA = '0x7e6D75B1A8Bd04778387DFb7063D192F835D084e'; // Address of Token A
const tokenB = '0x8CB4c1B4094e58Ff8a071421c7d1cf87daA1BCDe'; // Address of Token B
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
