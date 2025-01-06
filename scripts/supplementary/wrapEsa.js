require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;

  // Load private key from environment variables
  const privateKey = process.env.COPPER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("COPPER_PRIVATE_KEY not found in environment variables.");
    process.exit(1);
  }

  const deployer = new ethers.Wallet(privateKey, provider);

  const wesaAddress = "0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C"; // WESA contract address
  const amountToWrap = ethers.utils.parseEther("20"); // Amount of ESA to wrap (20 ESA)
  const nonce = await provider.getTransactionCount(deployer.address, "pending"); // Get pending nonce
  const gasPrice = ethers.utils.parseUnits("60", "gwei"); // Gas price

  console.log("Deployer Address:", deployer.address);
  console.log("Replacing transaction with nonce:", nonce);

  // Minimal ABI for the WESA contract
  const wesa = await ethers.getContractAt(
    [
      {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
      },
    ],
    wesaAddress
  );

  try {
    const tx = await wesa.connect(deployer).deposit({
      value: amountToWrap, // ESA to wrap
      gasLimit: ethers.utils.hexlify(300000), // Increased gas limit
      gasPrice: gasPrice, // Higher gas price
      nonce: nonce, // Use the correct nonce
    });

    console.log("Transaction Sent:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("Transaction replaced successfully. Receipt:", receipt);
    console.log("Successfully wrapped ESA into WESA.");
  } catch (error) {
    console.error("Error replacing the transaction:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
