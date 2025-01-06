require("dotenv").config();
const { ethers } = require("hardhat");

async function approveToken(tokenAddress, spenderAddress, amount, deployer) {
  const token = await ethers.getContractAt("IERC20", tokenAddress);

  console.log(`Approving ${spenderAddress} to spend ${ethers.utils.formatEther(amount)} of token ${tokenAddress}...`);

  const tx = await token.connect(deployer).approve(spenderAddress, amount);
  console.log("Transaction Sent:", tx.hash);

  const receipt = await tx.wait();
  console.log(`Approval Successful for token ${tokenAddress}. Receipt:`, receipt);
}

async function main() {
  const provider = ethers.provider;
  const privateKey = process.env.COPPER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("COPPER_PRIVATE_KEY is not set in the environment variables.");
    process.exit(1);
  }
  const deployer = new ethers.Wallet(privateKey, provider);

  const positionManagerAddress = "0x9875eE1A8be25ca95164914a148dC04126ad1684"; // Position Manager address
  const tokenAAddress = "0xcDbBC3fC0466f35D102441E2216A5888A54Cb372"; // EsaCoin Token (TTN)
  const tokenBAddress = "0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C"; // WESA Token
  const amountToApprove = ethers.utils.parseEther("1000"); // Approve 1000 tokens for each

  //await approveToken(tokenAAddress, positionManagerAddress, amountToApprove, deployer);
  await approveToken(tokenBAddress, positionManagerAddress, amountToApprove, deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
