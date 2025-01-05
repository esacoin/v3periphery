const { ethers } = require("hardhat");

async function main() {
  const tokenAAddress = "0xcDbBC3fC0466f35D102441E2216A5888A54Cb372"; // EsaCoin Token
  const tokenBAddress = "0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C"; // Token B (WESA)
  const positionManagerAddress = "0x9875eE1A8be25ca95164914a148dC04126ad1684"; // Replace with the position manager address
  const deployerAddress = "0x9636470f2e7093F324A745e6971342c150b4B5a9"; // Deployer address

  const tokenA = await ethers.getContractAt("IERC20", tokenAAddress);
  const tokenB = await ethers.getContractAt("IERC20", tokenBAddress);

  const allowanceA = await tokenA.allowance(deployerAddress, positionManagerAddress);
  const allowanceB = await tokenB.allowance(deployerAddress, positionManagerAddress);

  console.log(`Allowance for Token A (TTN): ${ethers.utils.formatEther(allowanceA)} TTN`);
  console.log(`Allowance for Token B (WESA): ${ethers.utils.formatEther(allowanceB)} WESA`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
