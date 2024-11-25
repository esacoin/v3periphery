require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Adding liquidity with the account:', deployer.address);

  // Addresses required
  const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Deployed NonfungiblePositionManager
  const tokenA = '0x7e6D75B1A8Bd04778387DFb7063D192F835D084e'; // Address of token A (Holon)
  const tokenB = '0x8CB4c1B4094e58Ff8a071421c7d1cf87daA1BCDe'; // Address of token B (Hether)
  const feeTier = 500; // Fee tier (0.05%)

  // Set parameters for adding liquidity
  const amountA = ethers.utils.parseUnits('10', 18); // 10 tokens of token A
  const amountB = ethers.utils.parseUnits('10', 18); // 10 tokens of token B
  const tickLower = -276421; // Set a reasonable lower tick range
  const tickUpper = 0; // Set a reasonable upper tick range

  // Connect to the position manager contract
  const PositionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  try {
    // Add liquidity to the pool
    const tx = await PositionManager.mint({
      token0: tokenA,
      token1: tokenB,
      fee: feeTier,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amountA,
      amount1Desired: amountB,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline: deadline
    });

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log('Liquidity added successfully. Transaction Hash:', receipt.transactionHash);
  } catch (error) {
    console.error('Error adding liquidity:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
