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
  const tickLower = -276421; // Adjusted tick value for 0.25 Euro
  const tickUpper = 0; // Adjusted tick value for 1 Euro

  // Connect to the token contracts
  const tokenAContract = await ethers.getContractAt('IERC20', tokenA);
  const tokenBContract = await ethers.getContractAt('IERC20', tokenB);

  // Check balances
  const balanceA = await tokenAContract.balanceOf(deployer.address);
  const balanceB = await tokenBContract.balanceOf(deployer.address);
  console.log("Balance of Token A:", ethers.utils.formatUnits(balanceA, 18));
  console.log("Balance of Token B:", ethers.utils.formatUnits(balanceB, 18));

  if (balanceA.lt(amountA) || balanceB.lt(amountB)) {
    console.error("Insufficient balance for adding liquidity.");
    return;
  }

  // Approve the Nonfungible Position Manager to spend the tokens
  const approvalAmount = ethers.utils.parseUnits('100', 18); // Approve 100 tokens just to be safe
  await tokenAContract.connect(deployer).approve(positionManagerAddress, approvalAmount);
  await tokenBContract.connect(deployer).approve(positionManagerAddress, approvalAmount);

  // Connect to the position manager contract
  const PositionManager = await ethers.getContractAt('INonfungiblePositionManager', positionManagerAddress);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes from now

  try {
    // Add liquidity to the pool with manual gas limit
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
    }, {
      gasLimit: 3000000, // Set a manual gas limit (adjust if needed)
      gasPrice: ethers.utils.parseUnits('20', 'gwei') // Set a reasonable gas price
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
