// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

// Define key addresses and contract addresses
const swapRouterAddress = '0x0e25d9e279426d5FEd0dD258cDCD9ffbBaF04C57'; // Replace with your swap router address (e.g., Uniswap V3 router)

 // Token Addresses
 const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin Token
 const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA WESA

const amountIn = ethers.utils.parseUnits('1', 18); // Amount of Token A to swap (e.g., 100 tokens)

// Fee Tier for the Pool (e.g., 3000 for 0.3%)
const feeTier = 3000;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Swapping tokens with the account:', deployer.address);

  // Connect to the token contracts to approve them for swapping
  const tokenAContract = await ethers.getContractAt('IERC20', tokenA);
  const tokenBContract = await ethers.getContractAt('IERC20', tokenB);

  // Approve the swap router to spend Token A
  const approvalTx = await tokenAContract.approve(swapRouterAddress, amountIn);
  await approvalTx.wait();
  console.log('Approved SwapRouter to spend Token A.');

  // Connect to the Swap Router
  const swapRouter = await ethers.getContractAt('ISwapRouter', swapRouterAddress);

  // Set the swap parameters
  const params = {
    tokenIn: tokenA,
    tokenOut: tokenB,
    fee: feeTier, // Fee tier of the pool, e.g., 0.05% fee
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
    amountIn: amountIn,
    amountOutMinimum: 0, // Set to 0 for simplicity; you can calculate slippage tolerance
    sqrtPriceLimitX96: 0, // No price limit; execute the swap at current rate
  };

  try {
    // Execute the swap
    const tx = await swapRouter.exactInputSingle(params, {
      gasLimit: ethers.utils.hexlify(300000),
    });
    const receipt = await tx.wait();
    console.log('Swap executed successfully. Transaction Hash:', receipt.transactionHash);
  } catch (error) {
    console.error('Error executing swap:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
