const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;

  const privateKey = process.env.COPPER_PRIVATE_KEY; // Load your private key from .env
  const deployer = new ethers.Wallet(privateKey, provider);

  const nonce = 153; // Nonce of the pending transaction you want to cancel
  const gasPrice = ethers.utils.parseUnits("50", "gwei"); // Higher gas price to prioritize this transaction

  const tx = {
    to: deployer.address, // Send to yourself (no-op)
    value: ethers.utils.parseEther("0"), // No ETH transferred
    gasLimit: ethers.utils.hexlify(21000), // Minimum gas limit
    gasPrice: gasPrice, // Ensure higher gas price
    nonce: nonce, // Use the same nonce as the pending transaction
    chainId: (await provider.getNetwork()).chainId, // Fetch the chain ID
  };

  console.log("Cancelling transaction with nonce:", nonce);

  try {
    const signedTx = await deployer.signTransaction(tx);
    const txHash = await provider.sendTransaction(signedTx);

    console.log("Cancellation transaction sent. Tx Hash:", txHash.hash);
    console.log("Waiting for confirmation...");
    const receipt = await txHash.wait();

    console.log("Transaction cancelled successfully. Receipt:", receipt);
  } catch (error) {
    console.error("Error cancelling the transaction:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
