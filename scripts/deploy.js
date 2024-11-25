require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // Factory address on your network
  const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475';
  // WESA Token address on your network
  const WESAAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C';
  // Token descriptor address - update this with the correct address if required.
  const tokenDescriptorAddress = '0xYourTokenDescriptorAddress'; // Replace with the actual address if applicable

  // Deploy the Nonfungible Position Manager contract
  const PositionManager = await ethers.getContractFactory('NonfungiblePositionManager');
  const positionManager = await PositionManager.deploy(
    factoryAddress,
    WESAAddress,
    tokenDescriptorAddress
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
