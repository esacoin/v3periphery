require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying NFTDescriptor with the account:', deployer.address);

  // Deploy the NFTDescriptor library
  const NFTDescriptor = await ethers.getContractFactory('NFTDescriptor');
  const nftDescriptor = await NFTDescriptor.deploy();

  await nftDescriptor.deployed();
  console.log('NFTDescriptor deployed to:', nftDescriptor.address);

  return nftDescriptor.address;
}

main()
  .then((address) => {
    console.log('NFTDescriptor library deployed at:', address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
