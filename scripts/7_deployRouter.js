require('dotenv').config();
const { ethers } = require('hardhat');

const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Uniswap V3 Factory address
const wethAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Replace with your Wrapped ESA (WESA) token address

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying SwapRouter with the account:', deployer.address);

  // Deploy the SwapRouter contract
  const SwapRouter = await ethers.getContractFactory('SwapRouter');
  const swapRouter = await SwapRouter.deploy(factoryAddress, wethAddress);

  await swapRouter.deployed();

  console.log('SwapRouter deployed to:', swapRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
