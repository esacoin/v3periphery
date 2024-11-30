require('dotenv').config();
const { ethers } = require('hardhat');

const tokenA = '0x7e6D75B1A8Bd04778387DFb7063D192F835D084e'; // Holon
const tokenB = '0x8CB4c1B4094e58Ff8a071421c7d1cf87daA1BCDe'; // Hether
const feeTier = 500; // 0.05% fee tier
const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Nonfungible Position Manager address

async function addLiquidity() {
  const [deployer] = await ethers.getSigners();
  console.log('Adding liquidity with the account:', deployer.address);

  try {
    // Approve tokens if not done yet
    const tokenAContract = await ethers.getContractAt('IERC20', tokenA);
    await tokenAContract.approve(positionManagerAddress, ethers.constants.MaxUint256);

    const tokenBContract = await ethers.getContractAt('IERC20', tokenB);
    await tokenBContract.approve(positionManagerAddress, ethers.constants.MaxUint256);

    // Set parameters for adding liquidity
    const amountA = ethers.utils.parseUnits('10', 18); // 10 tokens of tokenA (Holon)
    const amountB = ethers.utils.parseUnits('20', 18); // 20 tokens of tokenB (Hether)
    const tickLower = -887220; // Replace with the appropriate tick range for your price
    const tickUpper = 887220;  // Replace with the appropriate tick range for your price

    // Connect to the Position Manager
    const positionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);

    // Add liquidity to the pool
    const tx = await positionManager.mint({
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
      deadline: Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes from now
    });

    const receipt = await tx.wait();
    console.log('Liquidity added successfully. Transaction Hash:', receipt.transactionHash);
  } catch (error) {
    console.error('Error adding liquidity:', error);
  }
}

addLiquidity()
  .then(() => console.log('Add liquidity script completed'))
  .catch((error) => console.error('Error:', error));
