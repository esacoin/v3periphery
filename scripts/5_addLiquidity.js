// Import necessary libraries and load environment variables
require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  // ---------------------------
  // Configuration and Constants
  // ---------------------------
  const tokenA = '0xcDbBC3fC0466f35D102441E2216A5888A54Cb372'; // EsaCoin
  const tokenB = '0xe2C8bE486A82740406986Fc5Bd696e0A02cb852C'; // Wrapped ESA
  const positionManagerAddress = '0x9875eE1A8be25ca95164914a148dC04126ad1684';
  const factoryAddress = '0xF0f274EA0ad60FA7d75490f0Da58fF710ADea475';
  const feeTier = 3000;
  const tickLower = -60000;
  const tickUpper = 60000;
  const amountADesired = ethers.utils.parseEther('10'); // 10 TTN
  const amountBDesired = ethers.utils.parseEther('10'); // 20 TT2
  const slippage = 10; // 10%
  const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes
  const gasPrice = ethers.utils.parseUnits('20', 'gwei');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer Address:', deployer.address);

  // ---------------------------
  // Contract Instances
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
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  ];
  const INonfungiblePositionManager_ABI = [
    'function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256,uint128,uint256,uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ];

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
    console.log(`Token A Balance: ${formatAmount(balanceA, await getDecimals(tokenAContract))}`);
    console.log(`Token B Balance: ${formatAmount(balanceB, await getDecimals(tokenBContract))}`);
    if (balanceA.lt(amountADesired)) throw new Error('Insufficient Token A balance');
    if (balanceB.lt(amountBDesired)) throw new Error('Insufficient Token B balance');

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
    if (poolAddress === ethers.constants.AddressZero) throw new Error('Pool does not exist.');
    console.log('Pool Address:', poolAddress);

    const poolContract = await ethers.getContractAt(IUniswapV3Pool_ABI, poolAddress);
    const [token0, token1] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
    ]);
    console.log('Token0:', token0);
    console.log('Token1:', token1);

    const isTokenAFirst = tokenA.toLowerCase() === token0.toLowerCase();
    const sortedToken0 = isTokenAFirst ? tokenA : tokenB;
    const sortedToken1 = isTokenAFirst ? tokenB : tokenA;

    console.log(`Sorted Tokens - Token0: ${sortedToken0}, Token1: ${sortedToken1}`);

    // 4. Prepare Mint Parameters
    const mintParams = {
      token0: sortedToken0,
      token1: sortedToken1,
      fee: feeTier,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amountADesired,
      amount1Desired: amountBDesired,
      amount0Min: minAmount(amountADesired),
      amount1Min: minAmount(amountBDesired),
      recipient: deployer.address,
      deadline: deadline,
    };
    console.log('Mint Parameters:', mintParams);

    // 5. Estimate Gas
    let estimatedGas;
    try {
      console.log('Estimating gas...');
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
        gasLimit: estimatedGas.mul(110).div(100), // Add 10% buffer
        gasPrice,
      });
      console.log('Transaction sent. Hash:', tx.hash);

      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error('Transaction failed.');
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
