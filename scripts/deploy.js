require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // Deploy the Nonfungible Position Manager contract
  const PositionManager = await ethers.getContractFactory('NonfungiblePositionManager');
  const positionManager = await PositionManager.deploy(
    '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475', // Replace with the Uniswap V3 Factory address on your network
    '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'  // WESA Token address on your network
  );

  await positionManager.deployed();
  console.log('Nonfungible Position Manager deployed to:', positionManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
