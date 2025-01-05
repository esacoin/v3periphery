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
  console.log("Using deployer account:", deployer.address);

  // Define the common transaction details
  const factoryAddress = "0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475"; // Replace with your factory address
  const gasLimit = 3000000; // Adjust if needed
  const newGasPrice = ethers.utils.parseUnits("50", "gwei"); // Higher gas price
  const chainId = (await provider.getNetwork()).chainId; // Automatically fetch chain ID

  // List of nonces to replace
  const nonces = [147, 148, 149];

  try {
    for (const nonce of nonces) {
      console.log(`Replacing transaction with nonce ${nonce}...`);

      const tx = {
        nonce, // Set the nonce to replace the transaction
        to: factoryAddress,
        gasLimit,
        gasPrice: newGasPrice,
        value: 0, // No value transfer
        data: "0x", // Assuming no specific calldata; adjust if needed
        chainId, // Add chain ID for replay protection
      };

      console.log(`Sending transaction with nonce ${nonce} at ${newGasPrice.toString()} gas price...`);

      // Sign and send the transaction
      const signedTx = await deployer.signTransaction(tx);
      const txHash = await provider.sendTransaction(signedTx);

      console.log(`Replacement transaction sent for nonce ${nonce}: ${txHash}`);
      console.log("Waiting for transaction to be mined...");
      await provider.waitForTransaction(txHash);

      console.log(`Transaction with nonce ${nonce} replaced and mined successfully.`);
    }
  } catch (error) {
    console.error("Error replacing transactions:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
