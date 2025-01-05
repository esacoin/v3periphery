const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);

  const wesaAddress = "0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C"; // Replace with your WESA contract address
  const amountToWrap = ethers.utils.parseEther("20"); // Amount of ESA to wrap (20 ESA)

  // Attach to the WESA contract
  const wesa = await ethers.getContractAt(
    [
      {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
      },
      {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
      },
      {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function",
      },
    ],
    wesaAddress
  );

  // Deposit ESA to mint WESA
  const tx = await wesa.deposit({
    value: amountToWrap, // Send native ESA
  });
  console.log("Transaction Sent:", tx.hash);

  // Wait for confirmation
  await tx.wait();
  console.log("Successfully wrapped ESA into WESA.");

  // Check WESA balance
  const wesaBalance = await wesa.balanceOf(deployer.address);
  console.log("WESA Balance:", ethers.utils.formatEther(wesaBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error wrapping ESA into WESA:", error);
    process.exit(1);
  });
