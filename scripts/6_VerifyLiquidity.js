require('dotenv').config();
const { ethers } = require('hardhat');

const poolAddress = '0x289d013e3EFf82320DAc930cCdF39fE979D0b10b'; // Use the retrieved pool address here

async function verifyLiquidity() {
  const [deployer] = await ethers.getSigners();
  console.log('Verifying liquidity with the account:', deployer.address);

  try {
    // Connect to the Uniswap V3 pool contract
    const poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress);

    // Check the liquidity in the pool
    const liquidity = await poolContract.liquidity();
    console.log('Current Liquidity in the Pool:', liquidity.toString());

    if (liquidity.gt(0)) {
      console.log('Liquidity has been successfully added to the pool.');
    } else {
      console.log('Liquidity addition did not succeed as expected.');
    }
  } catch (error) {
    console.error('Error verifying liquidity:', error);
  }
}

verifyLiquidity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
