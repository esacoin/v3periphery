require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying NonfungiblePositionManager with the account:', deployer.address);

  // Addresses required for deploying NonfungiblePositionManager
  const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Uniswap V3 Factory address
  const WESAAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C';    // WESA Token address
  const tokenDescriptorAddress = '0xf12811D2b7c8fa62694e2016423a342043668580'; // Token Descriptor address

  // Deploy the NonfungiblePositionManager
  const PositionManager = await ethers.getContractFactory('NonfungiblePositionManager');
  const positionManager = await PositionManager.deploy(factoryAddress, WESAAddress, tokenDescriptorAddress);

  await positionManager.deployed();
  console.log('NonfungiblePositionManager deployed to:', positionManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
