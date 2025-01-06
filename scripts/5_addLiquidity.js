// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  // ---------------------------
  // Configuration and Constants
  // ---------------------------

  // Token Addresses
  const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin Token
  const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA WESA

  // Nonfungible Position Manager Address
  const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684'; // Update as needed

  // Uniswap V3 Factory Address
  const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475'; // Replace with your Factory address

  // Fee Tier for the Pool (e.g., 3000 for 0.3%)
  const feeTier = 3000;

  // Tick Ranges (must be divisible by 10)
  const tickLower = -60000;
  const tickUpper = 60000;

  // Desired Token Amounts
  const amountADesired = '10'; // 10 TTN
  const amountBDesired = '20'; // 20 TT2

  // Slippage Parameters (e.g., 10% slippage)
  const slippagePercentage = 10;

  // Deadline (e.g., 20 minutes from now)
  const deadlineMinutes = 20;

  // Gas Configuration
  const gasPriceGwei = '20'; // 20 Gwei
  const gasLimit = 8000000; // Adjust as necessary

  // ---------------------------
  // Initialize Signer
  // ---------------------------

  const [deployer] = await ethers.getSigners();
  console.log('Deployer Address:', deployer.address);

  // ---------------------------
  // Contract Instances
  // ---------------------------

  // Updated IERC20_ABI to include 'allowance'
  const IERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function allowance(address owner, address spender) external view returns (uint256)',
  ];

  // Uniswap V3 Factory ABI
  const IUniswapV3Factory_ABI = [
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  ];

  // Uniswap V3 Pool ABI
  const IUniswapV3Pool_ABI = [
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  ];

  // Nonfungible Position Manager ABI with Transfer event
  const INonfungiblePositionManager_ABI = [
    'function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ];

  // Create Contract Instances
  const tokenAContract = await ethers.getContractAt(IERC20_ABI, tokenA);
  const tokenBContract = await ethers.getContractAt(IERC20_ABI, tokenB);
  const factoryContract = await ethers.getContractAt(IUniswapV3Factory_ABI, factoryAddress);
  const positionManager = await ethers.getContractAt(INonfungiblePositionManager_ABI, positionManagerAddress);

  // ---------------------------
  // Helper Functions
  // ---------------------------

  /**
   * Converts a number string to BigNumber with specified decimals.
   * @param {string} amount - The amount as a string.
   * @param {number} decimals - The number of decimals.
   * @returns {BigNumber} - The parsed amount as a BigNumber.
   */
  const parseAmount = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

  /**
   * Calculates minimum amounts based on slippage percentage.
   * @param {BigNumber} desired - Desired amount.
   * @param {number} slippage - Slippage percentage.
   * @returns {BigNumber} - Minimum amount after slippage.
   */
  const calculateMinAmount = (desired, slippage) => desired.mul(100 - slippage).div(100);

  /**
   * Fetches token decimals.
   * @param {Contract} tokenContract - The token contract instance.
   * @returns {number} - Decimals of the token.
   */
  const getTokenDecimals = async (tokenContract) => {
    try {
      const decimals = await tokenContract.decimals();
      return decimals;
    } catch (error) {
      throw new Error(`Failed to fetch token decimals: ${error.message}`);
    }
  };

  /**
   * Formats BigNumber to human-readable format.
   * @param {BigNumber} amount - The amount as BigNumber.
   * @param {number} decimals - Number of decimals.
   * @returns {string} - Formatted amount.
   */
  const formatAmount = (amount, decimals) => ethers.utils.formatUnits(amount, decimals);

  // ---------------------------
  // Comprehensive Checks
  // ---------------------------

  console.log('--- Starting Liquidity Addition Process ---');

  try {
    // 1. Fetch Token Decimals
    const decimalsA = await getTokenDecimals(tokenAContract);
    const decimalsB = await getTokenDecimals(tokenBContract);
    console.log(`Token A (${tokenA}) Decimals:`, decimalsA);
    console.log(`Token B (${tokenB}) Decimals:`, decimalsB);

    // 2. Parse Desired Amounts
    const amountA = parseAmount(amountADesired, decimalsA);
    const amountB = parseAmount(amountBDesired, decimalsB);
    console.log(`Desired Amount A (TTN):`, formatAmount(amountA, decimalsA));
    console.log(`Desired Amount B (TT2):`, formatAmount(amountB, decimalsB));

    // 3. Calculate Minimum Amounts Based on Slippage
    const amountAMin = calculateMinAmount(amountA, slippagePercentage);
    const amountBMin = calculateMinAmount(amountB, slippagePercentage);
    console.log(`Minimum Amount A (TTN) after ${slippagePercentage}% slippage:`, formatAmount(amountAMin, decimalsA));
    console.log(`Minimum Amount B (TT2) after ${slippagePercentage}% slippage:`, formatAmount(amountBMin, decimalsB));

    // 4. Check Token Balances
    const balanceA = await tokenAContract.balanceOf(deployer.address);
    const balanceB = await tokenBContract.balanceOf(deployer.address);
    console.log(`Deployer Balance A (TTN):`, formatAmount(balanceA, decimalsA));
    console.log(`Deployer Balance B (TT2):`, formatAmount(balanceB, decimalsB));

    if (balanceA.lt(amountA)) {
      throw new Error(`Insufficient balance for Token A (TTN). Required: ${formatAmount(amountA, decimalsA)}, Available: ${formatAmount(balanceA, decimalsA)}`);
    }

    if (balanceB.lt(amountB)) {
      throw new Error(`Insufficient balance for Token B (TT2). Required: ${formatAmount(amountB, decimalsB)}, Available: ${formatAmount(balanceB, decimalsB)}`);
    }

    // 5. Check Approvals
    const allowanceA = await tokenAContract.allowance(deployer.address, positionManagerAddress);
    const allowanceB = await tokenBContract.allowance(deployer.address, positionManagerAddress);
    console.log(`Current Allowance A (TTN):`, formatAmount(allowanceA, decimalsA));
    console.log(`Current Allowance B (TT2):`, formatAmount(allowanceB, decimalsB));

    if (allowanceA.lt(amountA)) {
      console.log(`Approving Position Manager to spend Token A (TTN)...`);
      const approveA = await tokenAContract.approve(positionManagerAddress, ethers.constants.MaxUint256);
      await approveA.wait();
      console.log('Token A (TTN) approval successful.');
    } else {
      console.log('Sufficient Token A (TTN) allowance already granted.');
    }

    if (allowanceB.lt(amountB)) {
      console.log(`Approving Position Manager to spend Token B (TT2)...`);
      const approveB = await tokenBContract.approve(positionManagerAddress, ethers.constants.MaxUint256);
      await approveB.wait();
      console.log('Token B (TT2) approval successful.');
    } else {
      console.log('Sufficient Token B (TT2) allowance already granted.');
    }

    // 6. Verify Pool Existence
    const poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
    if (poolAddress === ethers.constants.AddressZero) {
      throw new Error('The specified pool does not exist. Please ensure the pool is created.');
    }
    console.log(`Pool Address for Token A (TTN) and Token B (TT2) with fee tier ${feeTier}:`, poolAddress);

    // 7. Connect to the Pool and Fetch Details
    const poolContract = await ethers.getContractAt(IUniswapV3Pool_ABI, poolAddress);

    const [token0, token1] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
    ]);
    console.log('Token0:', token0);
    console.log('Token1:', token1);

    // Ensure token0 and token1 are correctly ordered
    const isTokenAFirst = tokenA.toLowerCase() === token0.toLowerCase();
    const sortedToken0 = isTokenAFirst ? tokenA : tokenB;
    const sortedToken1 = isTokenAFirst ? tokenB : tokenA;

    console.log(`Sorted Tokens - Token0: ${sortedToken0}, Token1: ${sortedToken1}`);

    // 8. Fetch Current Pool State
    const slot0 = await poolContract.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    const currentTick = slot0.tick;
    console.log('Current sqrtPriceX96:', sqrtPriceX96.toString());
    console.log('Current Tick:', currentTick);

    // 9. Calculate Current Price
    const priceX96 = sqrtPriceX96;
    const price = priceX96.mul(priceX96).div(ethers.BigNumber.from(2).pow(192));
    const priceFormatted = ethers.utils.formatUnits(price, 18);
    console.log('Current Price (Token0 / Token1):', priceFormatted);

    // 10. Validate Tick Ranges
    if (tickLower % 10 !== 0 || tickUpper % 10 !== 0) {
      throw new Error('Tick values must be divisible by 10.');
    }
    console.log('Tick ranges are valid and divisible by 10.');

    // 11. Check Deadline Validity
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    if (deadline <= Math.floor(Date.now() / 1000)) {
      throw new Error('Deadline must be in the future.');
    }
    console.log(`Transaction Deadline set to ${deadline} (${new Date(deadline * 1000).toLocaleString()})`);

    // 12. Prepare Mint Parameters
    const amount0Desired = isTokenAFirst ? amountA : amountB;
    const amount1Desired = isTokenAFirst ? amountB : amountA;
    const amount0Min = isTokenAFirst ? amountAMin : amountBMin;
    const amount1Min = isTokenAFirst ? amountBMin : amountAMin;

    console.log('Mint Parameters:');
    console.log(`  Token0 Desired: ${formatAmount(amount0Desired, decimalsA)}`);
    console.log(`  Token1 Desired: ${formatAmount(amount1Desired, decimalsB)}`);
    console.log(`  Token0 Min: ${formatAmount(amount0Min, decimalsA)}`);
    console.log(`  Token1 Min: ${formatAmount(amount1Min, decimalsB)}`);

    // 13. Simulate the Transaction (Optional but Recommended)
    console.log('Simulating the liquidity addition transaction...');
    try {
      const simulatedTx = await positionManager.callStatic.mint({
        token0: sortedToken0,
        token1: sortedToken1,
        fee: feeTier,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0Desired,
        amount1Desired: amount1Desired,
        amount0Min: amount0Min,
        amount1Min: amount1Min,
        recipient: deployer.address,
        deadline: deadline,
      }, {
        gasLimit: gasLimit,
        gasPrice: ethers.utils.parseUnits(gasPriceGwei, 'gwei'),
      });
      console.log('Simulation successful. Transaction is likely to succeed.');
    } catch (simulationError) {
      console.error('Simulation failed. Transaction will likely revert.');
      throw simulationError;
    }

    // 14. Add Liquidity
    console.log('Sending transaction to add liquidity...');
    const tx = await positionManager.mint({
      token0: sortedToken0,
      token1: sortedToken1,
      fee: feeTier,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: amount0Min,
      amount1Min: amount1Min,
      recipient: deployer.address,
      deadline: deadline,
    }, {
      gasLimit: gasLimit,
      gasPrice: ethers.utils.parseUnits(gasPriceGwei, 'gwei'),
    });

    console.log('Transaction sent. Waiting for confirmation...');
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('Transaction failed. Please check the transaction details.');
    }

    console.log('Liquidity added successfully!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed.toString());

    // 15. Post-Transaction Verification (Optional)
    console.log('Verifying liquidity position...');

    // Define the Transfer event interface
    const TransferEvent = positionManager.interface.getEvent('Transfer');
    const transferTopic = positionManager.interface.getEventTopic(TransferEvent);

    // Filter logs for Transfer events
    const transferLogs = receipt.logs.filter(log => log.topics[0] === transferTopic);

    // Find the Transfer event where 'from' is zero address (indicating minting)
    let tokenId;
    for (const log of transferLogs) {
      try {
        const parsedLog = positionManager.interface.parseLog(log);
        if (
          parsedLog.args.from === ethers.constants.AddressZero &&
          parsedLog.args.to.toLowerCase() === deployer.address.toLowerCase()
        ) {
          tokenId = parsedLog.args.tokenId;
          break;
        }
      } catch (parseError) {
        // Ignore logs that do not match the Transfer event signature
        continue;
      }
    }

    if (tokenId) {
      console.log(`Liquidity Position Token ID: ${tokenId.toString()}`);
      // Optional: Fetch and display more details about the liquidity position
      // Example:
      // const position = await positionManager.positions(tokenId);
      // console.log('Position Details:', position);
    } else {
      console.log('Transfer event not found for minting a new liquidity position.');
      // Optionally, implement a retry mechanism or manual retrieval steps
    }

  } catch (error) {
    console.error('--- Error Encountered ---');
    console.error(error);
    process.exit(1); // Exit with failure
  }

  console.log('--- Liquidity Addition Process Completed ---');
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected Error:', error);
    process.exit(1);
  });
