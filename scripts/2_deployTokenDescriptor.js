require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying NonfungibleTokenPositionDescriptor with the account:', deployer.address);

  // Use the deployed NFTDescriptor address from the previous step
  const nftDescriptorAddress = '0xA753F63a55f7dAD3DfCbAeA06DB9D77e29BfDF89'; // Replace with the actual deployed address

  // Link the NFTDescriptor library to NonfungibleTokenPositionDescriptor
  const TokenDescriptor = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
    libraries: {
      NFTDescriptor: nftDescriptorAddress,
    },
  });

  // Constructor arguments for NonfungibleTokenPositionDescriptor
  const WESAAddress = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // WESA address (your wrapped ESA)
  const nativeCurrencyLabelBytes = ethers.utils.formatBytes32String("ESA"); // Convert "ESA" to bytes32

  // Deploy the NonfungibleTokenPositionDescriptor with both constructor arguments
  const tokenDescriptor = await TokenDescriptor.deploy(WESAAddress, nativeCurrencyLabelBytes);

  await tokenDescriptor.deployed();
  console.log('NonfungibleTokenPositionDescriptor deployed to:', tokenDescriptor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
