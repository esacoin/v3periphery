// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// New Token Addresses
const tokenA = '0x6353d130520CC2b803F224Ad515A40Fa59e968F3'; // TTN
const tokenB = '0x5964c3B17dA46f239B305d559B2A4Ff2505F6928'; // TT2

// The Nonfungible Position Manager contract address
const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Update with your deployed NonfungiblePositionManager address
// Fee tier for the pool (e.g., 500 for 0.05%)
const feeTier = 500;

// Tick ranges for the pool, adjusted based on the desired price ratio (e.g., 1 TTN = 2 TT2)
const tickLower = -5000; // Approximate tick for price of 1 TT2 per TTN (must be divisible by 10)
const tickUpper = 5000; // Approximate tick for price of 4 TT2 per TTN (must be divisible by 10)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Adding liquidity with the account:', deployer.address);

  // Connect to Nonfungible Position Manager contract
  const positionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);

  // Set parameters for adding liquidity
  const amountA = ethers.utils.parseUnits('10', 18); // 10 TTN tokens
  const amountB = ethers.utils.parseUnits('20', 18); // 20 TT2 tokens

  try {
    // Approve the Position Manager to spend tokens on behalf of deployer
    const tokenAContract = await ethers.getContractAt('IERC20', tokenA);
    const tokenBContract = await ethers.getContractAt('IERC20', tokenB);

    await (await tokenAContract.approve(positionManagerAddress, amountA)).wait();
    await (await tokenBContract.approve(positionManagerAddress, amountB)).wait();

    console.log('Approved the position manager to spend TTN and TT2.');

    // Check balances to ensure sufficient funds are available
    const balanceA = await tokenAContract.balanceOf(deployer.address);
    const balanceB = await tokenBContract.balanceOf(deployer.address);

    if (balanceA.lt(amountA) || balanceB.lt(amountB)) {
      throw new Error('Insufficient token balance for liquidity provision');
    }

    // Fetch the pool address from the factory
    const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address
    const factoryContract = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
    const poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
    if (poolAddress === ethers.constants.AddressZero) {
      throw new Error('Pool does not exist');
    }

    // Fetch token0 and token1 from the pool
    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    
    // Fetch current pool state
    const slot0 = await poolContract.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    console.log('Current sqrtPriceX96:', sqrtPriceX96.toString());

    // Sort the token amounts to match token0 and token1
    let amount0Desired, amount1Desired;
    if (tokenA === token0) {
      amount0Desired = amountA;
      amount1Desired = amountB;
    } else {
      amount0Desired = amountB;
      amount1Desired = amountA;
    }

    // Set more flexible minimums to avoid slippage reverts
    const amount0Min = ethers.utils.parseUnits('8', 18);
    const amount1Min = ethers.utils.parseUnits('15', 18);

    // Set a longer deadline
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Add liquidity to the pool
    const tx = await positionManager.mint({
      token0,
      token1,
      fee: feeTier,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient: deployer.address,
      deadline,
    }, {
      gasLimit: 3000000, // Set a higher gas limit to avoid underestimating
      gasPrice: ethers.utils.parseUnits('20', 'gwei'), // Set a reasonable gas price
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
