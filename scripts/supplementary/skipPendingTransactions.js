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
  const gasLimit = ethers.utils.hexlify(3000000); // Convert to hex
  const newGasPrice = ethers.utils.parseUnits("50", "gwei"); // Higher gas price
  const chainId = (await provider.getNetwork()).chainId; // Automatically fetch chain ID

  // List of nonces to replace (only pending ones)
  const nonces = [148, 149];

  try {
    for (const nonce of nonces) {
      console.log(`Replacing transaction with nonce ${nonce}...`);

      const tx = {
        nonce, // Set the nonce to replace the transaction
        to: factoryAddress,
        gasLimit, // Ensure gasLimit is properly formatted
        gasPrice: newGasPrice,
        value: "0x0", // Set to 0x0 in hex
        data: "0x", // Assuming no specific calldata
        chainId, // Add chain ID for replay protection
      };

      console.log(`Signing transaction with nonce ${nonce}...`);

      // Sign and send the transaction
      const signedTx = await deployer.signTransaction(tx);
      console.log(`Signed transaction: ${signedTx}`);

      const txResponse = await provider.sendTransaction(signedTx);
      console.log(`Replacement transaction sent for nonce ${nonce}, tx hash: ${txResponse.hash}`);

      console.log("Waiting for transaction to be mined...");
      const receipt = await txResponse.wait();
      console.log(`Transaction with nonce ${nonce} replaced and mined successfully. Receipt:`, receipt);
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
