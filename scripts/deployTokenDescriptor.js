require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying Token Descriptor with the account:', deployer.address);

  // Replace with the WETH (WESA in your case) address
  const WESAAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C';

  // Deploy the NonfungibleTokenPositionDescriptor
  const TokenDescriptor = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor');
  const tokenDescriptor = await TokenDescriptor.deploy(WESAAddress);

  await tokenDescriptor.deployed();
  console.log('NonfungibleTokenPositionDescriptor deployed to:', tokenDescriptor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
