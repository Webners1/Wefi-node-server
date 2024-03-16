const { CommandType, RoutePlanner } = require('./commandType.cjs');

const { Web3 } = require('web3');
const ethers = require('ethers');
const {
  abi: PoolLogicAbi_ABI,
} = require('../contracts/PoolLogic.sol/PoolLogic.json'); // Replace with your contract's ABI
const {
  abi: Token_ABI,
} = require('../contracts/interfaces/IERC20Extended.sol/IERC20Extended.json');
const {
  abi: PoolManagerLogic_ABI,
} = require('../contracts/PoolManagerLogic.sol/PoolManagerLogic.json'); // Replace with your contract's ABI
const {
  abi: PoolLogic_ABI,
} = require('../contracts/PoolLogic.sol/PoolLogic.json'); // Replace with your contract's ABI
const {
  abi: PoolFactory_ABI,
} = require('../contracts/PoolFactory.sol/PoolFactory.json'); // Replace with your contract's ABI
const UniswapRouterV3_ABI = require('./uniswapV3.json'); // Replace with your contract's ABI
const UniswapRouterV2_ABI = require('./uniswapV2.json'); // Replace with your contract's ABI
const Universal_ABI = require('./UniversalRouter.json'); // Replace with your contract's ABI
const {
  abi: WETH_ABI,
} = require('../contracts/interfaces/IWETH.sol/IWETH.json'); // Replace with your contract's ABI
const { arrayify } = require('ethers/lib/utils');
const { accurator } = require('./accurator.cjs');
const { AlphaRouter, UniswapMulticallProvider, SwapType } = require('@uniswap/smart-order-router');
const { TradeType, ChainId, Token, CurrencyAmount } = require('@uniswap/sdk-core');
const { Protocol } = require('@uniswap/router-sdk');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { default: JSBI } = require('jsbi');
require('dotenv').config()
// Connect to a web3 provider
const web3 = new Web3(process.env.RPC);
const PoolManagerLogic_address =
  '0xacd5d3d49502eade3f9f7b20524a6f1e3a14fdb7';
const PoolLogic_address =
  '0x6BbA366F2AB98D5B025776A15b8b26B5fdff092b';
const V2Router = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';
const V3Router = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E';
const UNIVERSALRouter = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
// Create a contract instance
const PoolManagerLogic = new web3.eth.Contract(
  PoolManagerLogic_ABI,
  PoolManagerLogic_address,
);
const PoolLogic = new web3.eth.Contract(
  PoolLogicAbi_ABI,
  PoolLogic_address,
);

const V2Logic = new web3.eth.Contract(UniswapRouterV2_ABI, V2Router);
let swapABI;
let isUniversal = true;
let isV2;
let name;
let value;
const wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';

// Set your account address and private key
const accountAddress = '0x7a491dA575A00b14A88DC4B9914E0c2323A1eFd3'; // Replace with your account's address
const privateKey =
  '0xa204996d053cf1e9abb3bd6001158a91e736c3fce1ab278765f676fce0c07f23'; // Replace with your account's private key

async function encodeApproveData(
  tokenAddress,
  spenderAddress,
  amount,
  gasPrice,
) {
  // Connect to Ethereum network using Web3 provider

  // Load the contract ABI for the token

  // Create a new instance of the token contract using the ABI and token address
  const tokenContract = new ethers.utils.Interface(Token_ABI);

  // Prepare the function parameters

  // Encode the function data for the `approve` function
  const approveData = tokenContract.encodeFunctionData('approve', [
    spenderAddress,
    amount.toString(),
  ]);
  const txObject = PoolLogic.methods.execTransaction(
    tokenAddress,
    approveData,
  );
  const txParams = {
    from: accountAddress,
    to: PoolLogic_address,
    data: txObject.encodeABI(),
    gasPrice: gasPrice,
  };

  const signedTx = await web3.eth.accounts.signTransaction(
    txParams,
    privateKey,
  );

  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
  );
  return receipt;
}
async function isContractApproved(
  tokenAddress,
  spender,
  owner,
  amount,
  gasPrice,
) {
  // Connect to Ethereum network using Web3 provider

  // Load the contract ABI for the token
  // Create a new instance of the token contract using the ABI and token address
  const tokenContract = new web3.eth.Contract(
    Token_ABI,
    tokenAddress,
  );

  // Prepare the function parameters

  // Call the allowance function on the token contract to check the approval status
  const allowance = await tokenContract.methods
    .allowance(owner, spender)
    .call();

  // Check if the allowance is greater than zero
  const isApproved = allowance > amount;
  console.log('allowa', Number(allowance), amount);
  if (!isApproved) {
    return encodeApproveData(
      tokenAddress,
      spender,
      ethers.constants.MaxUint256,
      gasPrice,
    );
  }
  return isApproved;
}



const encodeUniversal = async(swap) => {
  const { function: functionType, path } = swap;
  const provider = new JsonRpcProvider(process.env.RPC,ChainId.SEPOLIA)
  const router = new AlphaRouter({ chainId: ChainId.SEPOLIA ,provider});
  // const real_amount_factor = Math.round(await accurator(web3,PoolLogic_address,path[0],swap.amountIn)/swap?.amountIn)
  const real_amount_factor = 0.5
  let amountIn = Math.round(swap.amountIn * real_amount_factor).toString()
  let amountOut = Math.round(swap.amountOut* real_amount_factor).toString()
const tokenIn = ( new Token(ChainId.SEPOLIA,path[0],18,'MTKs'))
const tokenOut = ( new Token(ChainId.SEPOLIA,path[1],18,'MTKs'))
const amount = CurrencyAmount.fromRawAmount(tokenIn, (parseInt(amountIn)))
  const route = await router.route(amount,tokenOut, TradeType.EXACT_OUTPUT)
  const realamountout = (parseInt(route.route[0].rawQuote)).toString()
 console.log("rote",)
 console.log("rote",realamountout)
  if (functionType === 'V3_SWAP_EXACT_IN') {
    return {
      isV2: false,
      name: 'exactInputSingle',
      inputArray: [
        [
          path[0],
          path[1],
          swap.fee || '3000',
          PoolLogic_address,
          amountIn,
          realamountout || '0',
          swap.sqrtPriceLimitX96 || '0',
        ],
      ],
    };
  } else if (functionType === 'V3_SWAP_EXACT_OUT') {
    return {
      isV2: false,
      name: 'exactOutputSingle',
      inputArray: [
        [
          path[0],
          path[1],
          swap.fee || '3000',
          PoolLogic_address,
          realamountout || '0',
          amountIn,
          swap.sqrtPriceLimitX96 || '0',
        ],
      ],
    };
  } else if (functionType === 'V2_SWAP_EXACT_IN') {
    return {
      isV2: true,
      name: 'swapExactTokensForTokens',
      inputArray: [
        amountIn,
        amountOut ?? '0',
        [path[0], path[1]],
        PoolLogic_address,
        Math.floor(Date.now() / 1000) + 60 * 3,
      ],
    };
  }
  //@Fix the parameters of the function according to V2Router
  else if (functionType === 'V2_SWAP_EXACT_OUT') {
    return {
      isV2: true,
      name: 'swapTokensForExactTokens',
      inputArray: [
        amountOut ?? '0',
        amountIn,
        [path[0], path[1]],
        PoolLogic_address,
        Math.floor(Date.now() / 1000) + 60 * 3,
      ],
    };
  } else {
    throw new Error('Invalid function type');
  }
};
function convertBigNumbersToNumbers(array) {
  return array.map((item) => {
    if (item instanceof ethers.BigNumber) {
      return Number(item).toString();
    } else {
      return item;
    }
  });
}

function deconstructTransactionDescription(txDescription) {
  let {
    args,
    functionFragment,
    name,
    value,
    inputs: realinput,
    signature,
  } = txDescription;

  const v2FunctionNames = [
    'swapExactTokensForTokens',
    'swapTokensForExactTokens',
    'swapExactETHForTokens',
    'swapTokensForExactETH',
    'swapExactTokensForETH',
    'swapETHForExactTokens',
  ];

  const v3FunctionNames = [
    'exactInput',
    'exactInputSingle',
    'exactOutput',
    'exactOutputSingle',
    'multicall',
  ];
  const inputs = args;

  const outputs = [];
  for (const output of functionFragment.outputs) {
    outputs.push({
      name: output.name,
      type: output.type,
    });
  }

  const functionName = name;

  if (v2FunctionNames.includes(functionName)) {
    isV2 = true;
  } else if (v3FunctionNames.includes(functionName)) {
    isV2 = false;
  } else {
    throw new Error(`Unknown function name: ${functionName}`);
  }
  value = Number(value)?.toString();
  return {
    name,
    inputs,
    value,
  };
}

async function execTransaction(isUniversal, isV2, data) {
  console.log(data);

  if (!isUniversal) {
    let {
      name: functionName,
      inputs,
      value: val,
    } = deconstructTransactionDescription(data);
    name = functionName;
    value = val;
    const necessaryKeys = Object.keys(inputs).filter(
      (key) => typeof key !== 'string',
    );
    const necessaryValues = isV2
      ? necessaryKeys.map((key) => inputs[key]) // Remove last 8 elements to get only the params array
      : inputs[0];
    const InputObject = isV2
      ? Object.assign({}, ...necessaryValues, {
          amountOutMin: '0',
          path: inputs[1],
          to: PoolLogic_address,
          deadline: (
            Math.floor(Date.now() / 1000) +
            60 * 3
          ).toString(),
        })
      : necessaryValues.filter(
          (item) => typeof item !== 'object' || item._isBigNumber,
        );
    inputArray = Object.values(InputObject);
    inputArray = convertBigNumbersToNumbers(inputArray);
    if(!isV2){
      inputArray[3] = PoolLogic_address;
    inputArray = [inputArray]
  }

  } else {
    var { isV2, name, inputArray } = await encodeUniversal(data);
console.log("inp",inputArray)
 
  }
  const to = isV2 ? V2Router : V3Router;
  const iUniswapRouter = isV2
    ? new ethers.utils.Interface(UniswapRouterV2_ABI)
    : new ethers.utils.Interface(UniswapRouterV3_ABI);
  swapABI = iUniswapRouter.encodeFunctionData(name, inputArray);
  const gasPrice = await web3.eth.getGasPrice();

  const approved = await isContractApproved(
    data?.path ? data.path[0] : data.args.params[0],
    to,
    PoolLogic_address,
    data?.amountIn
      ? data?.amountIn
      : Number(data?.args.params.amountIn),
    gasPrice,
  );




  //Test Transaction


  const txObject = PoolLogic.methods.execTransaction(to, swapABI);
console.log(swapABI)
  //@Check for Error here i have deployed the contract on goerli regarding Fund,manager the private key used is the Manager
  const gasEstimate = await txObject.estimateGas({
    gasPrice,
  });
  const txParams = {
    from: accountAddress,
    to: PoolLogic_address,
    data: txObject.encodeABI(),
    gasEstimate,
    gasPrice: gasPrice,
  };

  // const txParams = {
  //   from: accountAddress,
  //   to: V2Router,
  //   data: txObject.encodeABI(),
  //   gasPrice: gasPrice,
  // };

  const signedTx = await web3.eth.accounts.signTransaction(
    txParams,
    privateKey,
  );

  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
  );
  // console.log('Transaction successful!');
  console.log('Transaction successful! of copy trade');

  // console.log('Receipt:', receipt);

  return true;
}

// Example usage:
module.exports = { execTransaction };
