const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Using deployer account:", deployer.address);

  // Define the common transaction details
  const factoryAddress = "0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475"; // Replace with your factory address
  const gasLimit = 3000000; // Adjust if needed
  const newGasPrice = ethers.utils.parseUnits("50", "gwei"); // Higher gas price

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
      };

      console.log(`Sending transaction with nonce ${nonce} at ${newGasPrice.toString()} gas price...`);

      // Sign and send the transaction
      const signedTx = await deployer.signTransaction(tx);
      const txHash = await ethers.provider.sendTransaction(signedTx);

      console.log(`Replacement transaction sent for nonce ${nonce}: ${txHash}`);
      console.log("Waiting for transaction to be mined...");
      await ethers.provider.waitForTransaction(txHash);

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
