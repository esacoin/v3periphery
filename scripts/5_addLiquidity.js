require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  // ---------------------------
  // Configuration and Constants
  // ---------------------------
  const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // Example ESA
  const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Example Wrapped ESA
  const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684';
  const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475';

  // Uniswap V3 fee tier
  const feeTier = 3000;

  // Ticks for your price range (make sure these are valid for your target price)
  const tickLower = -60000;
  const tickUpper = 60000;

  // Desired amounts (adjust to your needs)
  const amountADesired = ethers.utils.parseEther('10');
  const amountBDesired = ethers.utils.parseEther('10');

  // Slippage in percent
  const slippage = 10; // 10%

  // Deadline (20 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

  // Gas price (adjust as needed)
  const gasPrice = ethers.utils.parseUnits('20', 'gwei');

  // ---------------------------
  // Setup Signer
  // ---------------------------
  const [deployer] = await ethers.getSigners();
  console.log('Deployer Address:', deployer.address);

  // ---------------------------
  // Contract ABIs
  // ---------------------------
  const IERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function allowance(address owner, address spender) external view returns (uint256)',
  ];

  const IUniswapV3Factory_ABI = [
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)',
  ];

  const IUniswapV3Pool_ABI = [
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)',
  ];

  const INonfungiblePositionManager_ABI = [
    'function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256,uint128,uint256,uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ];

  // ---------------------------
  // Instances
  // ---------------------------
  const tokenAContract = await ethers.getContractAt(IERC20_ABI, tokenA);
  const tokenBContract = await ethers.getContractAt(IERC20_ABI, tokenB);
  const factoryContract = await ethers.getContractAt(IUniswapV3Factory_ABI, factoryAddress);
  const positionManager = await ethers.getContractAt(INonfungiblePositionManager_ABI, positionManagerAddress);

  // ---------------------------
  // Helper Functions
  // ---------------------------
  const getDecimals = async (contract) => contract.decimals();
  const formatAmount = (amount, decimals) => ethers.utils.formatUnits(amount, decimals);
  const minAmount = (desired) => desired.mul(100 - slippage).div(100);

  // ---------------------------
  // Step-by-Step Execution
  // ---------------------------
  try {
    // 1. Check Token Balances
    const balanceA = await tokenAContract.balanceOf(deployer.address);
    const balanceB = await tokenBContract.balanceOf(deployer.address);

    console.log(
      `Token A Balance: ${formatAmount(balanceA, await getDecimals(tokenAContract))}`
    );
    console.log(
      `Token B Balance: ${formatAmount(balanceB, await getDecimals(tokenBContract))}`
    );

    if (balanceA.lt(amountADesired)) {
      throw new Error('Insufficient Token A balance');
    }
    if (balanceB.lt(amountBDesired)) {
      throw new Error('Insufficient Token B balance');
    }

    // 2. Approve Tokens if Necessary
    const approveIfNeeded = async (contract, amount, spender) => {
      const allowance = await contract.allowance(deployer.address, spender);
      if (allowance.lt(amount)) {
        console.log(`Approving ${spender} to spend tokens...`);
        const tx = await contract.approve(spender, ethers.constants.MaxUint256);
        await tx.wait();
        console.log('Approval successful.');
      }
    };

    await approveIfNeeded(tokenAContract, amountADesired, positionManagerAddress);
    await approveIfNeeded(tokenBContract, amountBDesired, positionManagerAddress);

    // 3. Validate Pool Existence
    const poolAddress = await factoryContract.getPool(tokenA, tokenB, feeTier);
    if (poolAddress === ethers.constants.AddressZero) {
      throw new Error('Pool does not exist for this pair and fee tier.');
    }
    console.log('Pool Address:', poolAddress);

    // 4. Check Pool Initialization
    const poolContract = await ethers.getContractAt(IUniswapV3Pool_ABI, poolAddress);
    const [sqrtPriceX96, currentTick] = (await poolContract.slot0());
    console.log(`Current sqrtPriceX96: ${sqrtPriceX96.toString()}`);
    console.log(`Current Tick: ${currentTick}`);

    if (sqrtPriceX96.eq(0)) {
      throw new Error(
        'This pool is not initialized (sqrtPriceX96=0). You must initialize the pool before adding liquidity.'
      );
    }

    // Identify token0, token1 from the pool
    const poolToken0 = await poolContract.token0();
    const poolToken1 = await poolContract.token1();

    console.log('Pool token0:', poolToken0);
    console.log('Pool token1:', poolToken1);

    // Determine which token is token0 vs token1
    const isTokenAFirst = poolToken0.toLowerCase() === tokenA.toLowerCase();
    const sortedToken0 = isTokenAFirst ? tokenA : tokenB;
    const sortedToken1 = isTokenAFirst ? tokenB : tokenA;

    // IMPORTANT: Align amounts with token0/token1
    const amount0Desired = isTokenAFirst ? amountADesired : amountBDesired;
    const amount1Desired = isTokenAFirst ? amountBDesired : amountADesired;

    const amount0Min = isTokenAFirst
      ? minAmount(amountADesired)
      : minAmount(amountBDesired);
    const amount1Min = isTokenAFirst
      ? minAmount(amountBDesired)
      : minAmount(amountADesired);

    // Prepare Mint Parameters
    const mintParams = {
      token0: sortedToken0,
      token1: sortedToken1,
      fee: feeTier,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient: deployer.address,
      deadline,
    };

    console.log('Mint Parameters:', mintParams);

    // 5. Estimate Gas
    let estimatedGas;
    try {
      estimatedGas = await positionManager.estimateGas.mint(mintParams, {
        gasPrice,
      });
      console.log('Estimated Gas:', estimatedGas.toString());
    } catch (gasError) {
      console.error('Gas Estimation Failed:', gasError);
      throw new Error('Gas estimation failed. Check contract state or parameters.');
    }

    // 6. Execute Mint Transaction
    try {
      console.log('Sending mint transaction...');
      const tx = await positionManager.mint(mintParams, {
        gasLimit: estimatedGas.mul(110).div(100), // 10% buffer
        gasPrice,
      });
      console.log('Transaction sent. Hash:', tx.hash);

      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        throw new Error('Transaction failed.');
      }
      console.log('Liquidity added successfully!');
      console.log('Transaction Hash:', receipt.transactionHash);
    } catch (txError) {
      console.error('Transaction Failed:', txError);
      throw txError;
    }
  } catch (error) {
    console.error('--- Error Encountered ---');
    console.error(error);
    process.exit(1);
  }

  console.log('--- Liquidity Addition Process Completed ---');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected Error:', error);
    process.exit(1);
  });
