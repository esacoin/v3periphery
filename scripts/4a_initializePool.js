const { ethers } = require("hardhat");

async function createOrInitializePool() {
  const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684';
  const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin Token
  const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA WESA
  const feeTier = 3000; // Example fee tier (0.3%)

  // Define the initial price as a sqrtPriceX96.
  // For a 1:1 price ratio between tokenA and tokenB (same decimals):
  // sqrtPriceX96 = 1 * 2^96
  const sqrtPriceX96 = ethers.BigNumber.from("79228162514264337593543950336");

  // Setup signer
  const [deployer] = await ethers.getSigners();
  
  // Minimal ABI for NonfungiblePositionManager
  const INonfungiblePositionManager_ABI = [
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)"
  ];
  const positionManager = await ethers.getContractAt(
    INonfungiblePositionManager_ABI,
    positionManagerAddress,
    deployer
  );

  // Create or initialize the pool
  const tx = await positionManager.createAndInitializePoolIfNecessary(
    tokenA,
    tokenB,
    feeTier,
    sqrtPriceX96,
    nonce: 157,
    {
      // for EIP-1559 networks:
      maxFeePerGas: ethers.utils.parseUnits("60", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
      gasLimit: 9000000 // or a higher guess
    }
  );
  const receipt = await tx.wait();
  console.log("Pool creation/initialization tx hash:", receipt.transactionHash);

  // The event logs (or the return value) will give you the pool address
  console.log("Pool Address:", await positionManager.callStatic.createAndInitializePoolIfNecessary(
    tokenA,
    tokenB,
    feeTier,
    sqrtPriceX96
  ));
}

createOrInitializePool()
  .then(() => console.log("Pool created/initialized successfully."))
  .catch(console.error);
