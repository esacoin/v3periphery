require("dotenv").config(); // Load environment variables from .env
const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;

    // Load private key from environment variable
    const privateKey = process.env.COPPER_PRIVATE_KEY;
    if (!privateKey) {
        console.error("COPPER_PRIVATE_KEY not found in environment variables.");
        process.exit(1);
    }

  const deployer = new ethers.Wallet(privateKey, provider);

  const nonce = 152; // Replace with the nonce of the pending transaction
  const gasPrice = ethers.utils.parseUnits("60", "gwei"); // Higher gas price

  const wesaAddress = "0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C"; // Replace with WESA contract address
  const amountToWrap = ethers.utils.parseEther("20"); // Replace with the desired ESA amount

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

  console.log("Replacing transaction with nonce:", nonce);

  try {
    const tx = await wesa.connect(deployer).deposit({
      value: amountToWrap,
      gasLimit: ethers.utils.hexlify(300000),
      gasPrice: gasPrice,
      nonce: nonce, // Ensure the nonce matches the pending transaction
    });

    console.log("Replacement transaction sent with hash:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("Transaction replaced successfully. Receipt:", receipt);
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
