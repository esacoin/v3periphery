require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying NonfungibleTokenPositionDescriptor with the account:', deployer.address);

  // Use the deployed NFTDescriptor address from the previous step
  const nftDescriptorAddress = '0xA753F63a55f7dAD3DfCbAeA06DB9D77e29BfDF89'; // Replace with the deployed NFTDescriptor address

  // Link the NFTDescriptor library to NonfungibleTokenPositionDescriptor
  const TokenDescriptor = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
    libraries: {
      NFTDescriptor: nftDescriptorAddress,
    },
  });

  // Replace with the WETH (WESA in your case) address
  const WESAAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C';

  // Deploy the NonfungibleTokenPositionDescriptor
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
