const { encodeRouteToPath } = require('./encodeRoutetoPath.cjs');


const { Web3 } = require('web3');
const ethers = require('ethers');
const {
  abi: PoolLogicAbi_ABI,
} = require('../contracts/PoolLogic.sol/PoolLogic.json'); // Replace with your contract's ABI
const {
  abi: Token_ABI,
} = require('../contracts/interfaces/IERC20Extended.sol/IERC20Extended.json');

const Qouter_ABI = require('../src/qouter.json'); // Replace with your contract's ABI

const UniswapV3RouterABI = require('./uniswapV3.json');

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
const {
  AlphaRouter,
  UniswapMulticallProvider,
  SwapType,
} = require('@uniswap/smart-order-router');
const {
  TradeType,
  ChainId,
  Token,
  CurrencyAmount,
} = require('@uniswap/sdk-core');
const { Protocol } = require('@uniswap/router-sdk');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { default: JSBI } = require('jsbi');
const { object } = require('joi');
const { QOUTER_V2, V3Router, V2Router } = require('./transaction-check.cjs');
require('dotenv').config();
// Connect to a web3 provider
const web3 = new Web3(process.env.RPC);

const PoolLogic_address =
  '0x6BbA366F2AB98D5B025776A15b8b26B5fdff092b';

const PoolLogic = new web3.eth.Contract(
  PoolLogicAbi_ABI,
  PoolLogic_address,
);

let quoter
// Set your account address and private key
const accountAddress = process.env.ACCOUNT // Replace with your account's address
const privateKey =process.env.PRIVATE_KEY
const provider = new JsonRpcProvider(
  process.env.RPC,
  ChainId.SEPOLIA,
);
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
  amount
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
  console.log({isApproved, allowance , amount})
  if (!isApproved) {
  const gasPrice = await web3.eth.getGasPrice();
    return encodeApproveData(
      tokenAddress,
      spender,
      ethers.constants.MaxUint256,
      gasPrice,
    );
  }
  console.log('Token Approved!!');
  return isApproved;
}

// const encodeUniversal = async (swap) => {
//   const { function: functionType, path } = swap;

//   const router = new AlphaRouter({
//     chainId: ChainId.SEPOLIA,
//     provider,
//   });
//   // const real_amount_factor = Math.round(await accurator(web3,PoolLogic_address,path[0],swap.amountIn)/swap?.amountIn)
//   const real_amount_factor = 1;
//   let amountIn = Math.round(
//     swap.amountIn * real_amount_factor,
//   ).toString();
//   let amountOut = Math.round(
//     swap.amountOut * real_amount_factor,
//   ).toString();
//   const tokenIn = new Token(ChainId.SEPOLIA, path[0], 18, 'MTKs');
//   const tokenOut = new Token(
//     ChainId.SEPOLIA,
//     path[path.length - 1],
//     18,
//     'MTKs',
//   );

//   const amount = CurrencyAmount.fromRawAmount(
//     tokenIn,
//     parseInt(amountIn),
//   );
//   const route = await router.route(
//     amount,
//     tokenOut,
//     functionType === 'V3_SWAP_EXACT_IN'
//       ? TradeType.EXACT_INPUT
//       : TradeType.EXACT_OUTPUT,
//   );

//   const tradeType = route.route[0].tradeType;
//   const AmountIn =
//     tradeType === TradeType.EXACT_INPUT
//       ? route.route[0].amount.quotient.toString()
//       : route.route[0].quote.quotient.toString();
//   const AmountOut =
//     tradeType === TradeType.EXACT_INPUT
//       ? route.route[0].quote.quotient.toString()
//       : route.route[0].amount.quotient.toString();

//   const pools =
//     route.route[0].protocol === Protocol.V2
//       ? route.route[0].route.pairs
//       : route.route[0].route.pools;
//   if (path.length > 2) {
//     const token_path = encodeRouteToPath(
//       route.route[0].route,
//       functionType !== 'V3_SWAP_EXACT_IN',
//     );
//     if (functionType === 'V3_SWAP_EXACT_IN') {
//       return {
//         isV2: false,
//         name: 'exactInput',
//         inputArray: [
//           [token_path, PoolLogic_address, AmountIn, AmountOut],
//         ],
//       };
//     } else {
//       return {
//         isV2: false,
//         name: 'exactOutput',
//         inputArray: [
//           [token_path, PoolLogic_address, AmountOut, AmountIn],
//         ],
//       };
//     }
//   }

//   if (path.length <= 2 && functionType === 'V3_SWAP_EXACT_IN') {
//     return {
//       isV2: false,
//       name: 'exactInputSingle',
//       inputArray: [
//         [
//           path[0],
//           path[1],
//           pools[0].fee || '3000',
//           PoolLogic_address,
//           AmountIn,
//           AmountOut || '0',
//           '0',
//         ],
//       ],
//     };
//   } else if (
//     path.length <= 2 &&
//     functionType === 'V3_SWAP_EXACT_OUT'
//   ) {
//     return {
//       isV2: false,
//       name: 'exactOutputSingle',
//       inputArray: [
//         [
//           path[0],
//           path[1],
//           pools[0].fee || '3000',
//           PoolLogic_address,
//           AmountOut || '0',
//           AmountIn,
//           pools[0].sqrtRatioX96.toString() || '0',
//         ],
//       ],
//     };
//   } else if (functionType === 'V2_SWAP_EXACT_IN') {
//     return {
//       isV2: true,
//       name: 'swapExactTokensForTokens',
//       inputArray: [
//         amountIn,
//         amountOut ?? '0',
//         [path[0], path[1]],
//         PoolLogic_address,
//         Math.floor(Date.now() / 1000) + 60 * 3,
//       ],
//     };
//   }
//   //@Fix the parameters of the function according to V2Router
//   else if (functionType === 'V2_SWAP_EXACT_OUT') {
//     return {
//       isV2: true,
//       name: 'swapTokensForExactTokens',
//       inputArray: [
//         amountOut ?? '0',
//         amountIn,
//         [path[0], path[1]],
//         PoolLogic_address,
//         Math.floor(Date.now() / 1000) + 60 * 3,
//       ],
//     };
//   } else {
//     throw new Error('Invalid function type');
//   }
// };
const encodeUniversal = async (swap) => {
  const { function: functionType, path, amountIn, amountOut } = swap;
  const router = new AlphaRouter({ chainId: ChainId.SEPOLIA, provider });
  const real_amount_factor = 1; // Assuming real_amount_factor is always 1
  const tokenIn = new Token(ChainId.SEPOLIA, path[0], 18, 'MTKs');
  const tokenOut = new Token(ChainId.SEPOLIA, path[path.length - 1], 18, 'MTKs');

  const amount = CurrencyAmount.fromRawAmount(tokenIn, parseInt(amountIn));
  const tradeType = functionType === 'V3_SWAP_EXACT_IN' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT;
  const route = await router.route(amount, tokenOut, tradeType);

  const tradeTypeFromRoute = route.route[0].tradeType;
  const AmountIn = tradeTypeFromRoute === TradeType.EXACT_INPUT ? route.route[0].amount.quotient.toString() : route.route[0].quote.quotient.toString();
  const AmountOut = tradeTypeFromRoute === TradeType.EXACT_INPUT ? route.route[0].quote.quotient.toString() : route.route[0].amount.quotient.toString();
  const pools = route.route[0].protocol === Protocol.V2 ? route.route[0].route.pairs : route.route[0].route.pools;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 3;
  const recipient = PoolLogic_address;
console.log({path})

  const {
    amountOut: quote
  } = await quoter.methods.quoteExactInputSingle({
    tokenIn: path[0],
    tokenOut: path[path.length - 1],
    fee: pools[0].fee,
    amountIn: amountIn,
    // -2%
    sqrtPriceLimitX96: 0,
  }).call()

  if (path.length > 2) {
    const token_path = encodeRouteToPath(route.route[0].route, functionType !== 'V3_SWAP_EXACT_IN');
    return {
      isV2: false,
      name: functionType === 'V3_SWAP_EXACT_IN' ? 'exactInput' : 'exactOutput',
      inputArray: [[token_path, recipient, functionType === 'V3_SWAP_EXACT_IN' ? AmountIn : quote.toString(),  AmountOut]],
    };
  }
  if (path.length <= 2) {
    const [tokenA, tokenB] = path;
    const fee = pools[0].fee || '3000';

    if (functionType === 'V3_SWAP_EXACT_IN') {
      return {
        isV2: false,
        name: 'exactInputSingle',
        // inputArray: [[tokenA, tokenB, fee, recipient, AmountIn, AmountOut || '0', '0']],
        inputArray: [[tokenA, tokenB, fee, recipient, AmountIn,  '0', '0']],
      };
    } else {
      return {
        isV2: false,
        name: 'exactOutputSingle',
        inputArray: [[tokenA, tokenB, fee, recipient,quote.toString(), AmountOut, '0']],
      };
    }
  }

  if (functionType === 'V2_SWAP_EXACT_IN') {
    return {
      isV2: true,
      name: 'swapExactTokensForTokens',
      inputArray: [amountIn, amountOut || '0', path, recipient, deadline],
    };
  }

  if (functionType === 'V2_SWAP_EXACT_OUT') {
    return {
      isV2: true,
      name: 'swapTokensForExactTokens',
      inputArray: [amountOut || '0', amountIn, path, recipient, deadline],
    };
  }

  throw new Error('Invalid function type');
};


function deconstructTransactionDescription(txDescription) {
  let {
    args,
    functionFragment,
    name,
    value,
    inputs: realinput
  } = txDescription;

  const v2FunctionNames = [
    'swapExactTokensForTokens',
    'swapTokensForExactTokens',
    'swapExactETHForTokens',
    'swapTokensForExactETH',
    'swapExactTokensForETH',
    'swapETHForExactTokens',
    'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    'swapExactETHForTokensSupportingFeeOnTransferTokens',
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
// const v2Paramater = async(name, array) => {
  

//   await isContractApproved(
//     array.path[0],
//     V2Router,
//     PoolLogic_address,
//     array?.amountIn
//   );
//   if (
//     name === 'swapExactTokensForTokens' ||
//     'swapExactETHForTokens'
//   ) {
//     return {
//       name: 'swapTokensForExactTokens',
//       inputArray: [
//         array?.amountIn ?? '0',
//         array?.amountOut ?? '0',
//         array.path,
//         PoolLogic_address,
//         Math.floor(Date.now() / 1000) + 60 * 3,
//       ],
//     };
//   }
//   //@Fix the parameters of the function according to V2Router
//   else if (
//     name === 'swapTokensForExactTokens' ||
//     'swapETHForExactTokens'
//   ) {
//     return {
//       name: 'swapTokensForExactTokens',
//       inputArray: [
//         array?.amountOut ?? '0',
//         array?.amountIn ?? '0',
//         array.path,
//         PoolLogic_address,
//         Math.floor(Date.now() / 1000) + 60 * 3,
//       ],
//     };

//     // return array.filter(item => typeof item == 'object' || item._isBigNumber);
//   } else if (
//     name ===
//       'swapExactTokensForTokensSupportingFeeOnTransferTokens' ||
//     'swapExactETHForTokensSupportingFeeOnTransferTokens'
//   ) {
//     return {
//       name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
//       inputArray: [
//         array?.amountOut ?? '0',
//         array.path,
//         PoolLogic_address,
//         Math.floor(Date.now() / 1000) + 60 * 3,
//       ],
//     };
//   }
// };

const v2Parameter = async (name, array,value) => {
  const { path, amountIn, amountOut } = array;

  await isContractApproved(path[0], V2Router, PoolLogic_address, amountIn ?? value);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 3;
  const recipient = PoolLogic_address;

  switch (name) {
    case 'swapExactTokensForTokens':
    case 'swapExactETHForTokens':
    case 'swapExactTokensForTokensSupportingFeeOnTransferTokens':
    case 'swapExactETHForTokensSupportingFeeOnTransferTokens':
    case 'swapExactTokensForETHSupportingFeeOnTransferTokens':
      return {
        name: 'swapExactTokensForTokens',
        inputArray: [amountIn?? value , amountOut || '0', path, recipient, deadline],
      };

    case 'swapTokensForExactTokens':
    case 'swapETHForExactTokens':
    case 'swapTokenForExactETH':
      return {
        name: 'swapTokensForExactTokens',
        inputArray: [amountOut || '0', amountIn?? value?? (array.amountInMax).toString() , path, recipient, deadline],
      };

    default:
      throw new Error(`Unsupported function name: ${name}`);
  }
};
const unpackPath = (path, isOutput) => {
  const TOKEN_IN = isOutput
    ? `0x${path.slice(-40)}`
    : path.slice(0, 42);
  const TOKEN_OUT = isOutput
    ? path.slice(0, 42)
    : `0x${path.slice(-40)}`;

  return { TOKEN_IN, TOKEN_OUT };
};
// const v3Parameter = async (name, swap) => {
//   let real_amount_factor = 1;
//   let TOKEN_OUT;
//   let TOKEN_IN;
//   if (name.toLowerCase().includes('single')) {
//     TOKEN_IN = swap.tokenIn;
//     TOKEN_OUT = swap.tokenOut;
//   } else {
//     if (name.toLowerCase().includes('output')) {
//       [TOKEN_IN, TOKEN_OUT] = unpackPath(swap.path, true);
//     } else {
//       [TOKEN_IN, TOKEN_OUT] = unpackPath(swap.path, false);
//     }
//   }
//   const router = new AlphaRouter({
//     chainId: ChainId.SEPOLIA,
//     provider,
//   });
//   let amountIn = Math.round(
//     swap.amountIn * real_amount_factor,
//   ).toString();

//   await isContractApproved(
//     TOKEN_IN,
//     V3Router,
//     PoolLogic_address,
//     amountIn  );

//   //@WRITE A FUNCTION TO GET TOKENS IN AND OUT FROM PATH
//   const tokenIn = new Token(ChainId.SEPOLIA, TOKEN_IN, 18, 'MTKs');
//   const tokenOut = new Token(ChainId.SEPOLIA, TOKEN_OUT, 18, 'MTKs');

//   const amount = CurrencyAmount.fromRawAmount(
//     tokenIn,
//     parseInt(amountIn),
//   );
//   const route = await router.route(
//     amount,
//     tokenOut,
//     name === 'exactInput' || 'exactInputSingle'
//       ? TradeType.EXACT_INPUT
//       : TradeType.EXACT_OUTPUT,
//   );

//   const tradeType = route.route[0].tradeType;
//   const AmountIn =
//     tradeType === TradeType.EXACT_INPUT
//       ? route.route[0].amount.quotient.toString()
//       : route.route[0].quote.quotient.toString();
//   const AmountOut =
//     tradeType === TradeType.EXACT_INPUT
//       ? route.route[0].quote.quotient.toString()
//       : route.route[0].amount.quotient.toString();

//   const pools =
//     route.route[0].protocol === Protocol.V2
//       ? route.route[0].route.pairs
//       : route.route[0].route.pools;

//   if (name === 'exactInputSingle') {
//     return [
//       [
//         TOKEN_IN,
//         TOKEN_OUT,
//         swap.fee || '3000',
//         PoolLogic_address,
//         AmountIn,
//          '0',
//         '0',
//       ],
//     ];
//   } else if (name === 'exactOutputSingle') {
//     return [
//       [
//         TOKEN_IN,
//         TOKEN_OUT,
//         swap.fee || '3000',
//         PoolLogic_address,
//         AmountOut || '0',
//         AmountIn,
//         pools[0].sqrtRatioX96.toString() || '0',
//       ],
//     ];
//   } else if (name === 'exactInput') {
//     const token_path = encodeRouteToPath(
//       route.route[0].route,
//       name === 'exactInput',
//     );
//     return [
//       [
//         token_path,
//         PoolLogic_address,
//         AmountIn,
//         AmountOut || '0',
//         '0',
//       ],
//     ];
//   } else if (name === 'exactOutput') {
//     const token_path = encodeRouteToPath(
//       route.route[0].route,
//       name === 'exactInput',
//     );
//     return [
//       [
//         token_path,
//         PoolLogic_address,
//         AmountOut || '0',
//         AmountIn,
//         '0',
//       ],
//     ];
//   }
// };
const v3Parameter = async (name, swap) => {
  let TOKEN_IN, TOKEN_OUT;
  let real_amount_factor = 1;

  if (name.toLowerCase().includes('single')) {
    TOKEN_IN = swap.tokenIn;
    TOKEN_OUT = swap.tokenOut;
  } else {
    const [tokenInAddress, tokenOutAddress] = unpackPath(swap.path, name.toLowerCase().includes('output'));
    TOKEN_IN = tokenInAddress;
    TOKEN_OUT = tokenOutAddress;
  }

  console.log('Token In:', TOKEN_IN, 'Token Out:', TOKEN_OUT);
  const router = new AlphaRouter({ chainId: ChainId.SEPOLIA, provider });
  let amountIn = Math.round(swap.amountIn ?? swap.amountInMaximum * real_amount_factor).toString();

  console.log('Amount In:', amountIn);

  await isContractApproved(TOKEN_IN, V3Router, PoolLogic_address, amountIn);

  const tokenIn = new Token(ChainId.SEPOLIA, TOKEN_IN, 18, 'MTKs');
  const tokenOut = new Token(ChainId.SEPOLIA, TOKEN_OUT, 18, 'MTKs');

  const amount = CurrencyAmount.fromRawAmount(tokenIn, parseInt(amountIn));
  const tradeType = name === 'exactInput' || name === 'exactInputSingle' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT;


  const route = await router.route(amount, tokenOut, tradeType);


  const tradeTypeFromRoute = route.route[0].tradeType;
  const AmountIn = tradeTypeFromRoute === TradeType.EXACT_INPUT ? route.route[0].amount.quotient.toString() : route.route[0].quote.quotient.toString();
  const AmountOut = tradeTypeFromRoute === TradeType.EXACT_INPUT ? route.route[0].quote.quotient.toString() : route.route[0].amount.quotient.toString();

  const pools = route.route[0].protocol === Protocol.V2 ? route.route[0].route.pairs : route.route[0].route.pools;

  console.log('Amount In:', AmountIn, 'Amount Out:', AmountOut);

  if (name === 'exactInputSingle') {
    return [[TOKEN_IN, TOKEN_OUT, swap.fee || '3000', PoolLogic_address, AmountIn, '0', '0']];
  } else if (name === 'exactOutputSingle') {
    return [[TOKEN_IN, TOKEN_OUT, swap.fee || '3000', PoolLogic_address, AmountIn , AmountOut,  '0']];
  } else if (name === 'exactInput') {
    const token_path = encodeRouteToPath(route.route[0].route, true);
    return [[token_path, PoolLogic_address, AmountIn,  '0', '0']];
  } else if (name === 'exactOutput') {
    const token_path = encodeRouteToPath(route.route[0].route, false);
    return [[token_path, PoolLogic_address, AmountIn, AmountOut, '0']];
  }
};
const encodeMulticall = (name, data) => {
  const SWAP_ROUTER = new ethers.utils.Interface(UniswapRouterV3_ABI);
  return SWAP_ROUTER.encodeFunctionData(name, data);
};
const decodeMulticall = async (calls) => {
  const v2FunctionNames = [
    'swapExactTokensForTokens',
    'swapTokensForExactTokens',
    'swapExactETHForTokens',
    'swapTokensForExactETH',
    'swapExactTokensForETH',
    'swapETHForExactTokens',
    'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    'swapExactETHForTokensSupportingFeeOnTransferTokens',
  ];

  const v3FunctionNames = [
    'exactInput',
    'exactInputSingle',
    'exactOutput',
    'exactOutputSingle',
    'multicall',
  ];
  console.log({calls})
  const abiInterface = new ethers.utils.Interface(UniswapV3RouterABI);
  const data = []; // Initialize data as an empty array

  // Use Promise.all to wait for all promises to resolve
  const decodedCalls = await Promise.all(
    calls.map(async (call) => {
      try {
        const func = call.slice(0, 10);
        const decodedArgs = abiInterface.decodeFunctionData(
          func,
          call,
        );
        const functionName = abiInterface.getFunction(func).name;
          console.log({functionName})
        if (v2FunctionNames.includes(functionName)) {
          // Use push instead of append

          data.push(
            encodeMulticall(
              functionName,
              await v2Parameter(functionName, decodedArgs[0]),
            ),
          );
        } else if (v3FunctionNames.includes(functionName)) {
          const params = await v3Parameter(
            functionName,
            decodedArgs[0],
          );
            console.log({params})
          const cal = encodeMulticall(functionName, params);
          data.push(cal);
        }

        return data; // Return the updated data array
      } catch (ex) {
        console.log(ex);
        return []; // Return an empty array if an error occurs
      }
    }),
  );

  return decodedCalls.flat(); // Flatten the nested arrays
};

// async function execTransaction(isUniversal, isV2, data) {
//   if (data.name === 'multicall') {
//     var inputArray = await decodeMulticall(data.args[1]);
     
//     inputArray = [Math.floor(Date.now() / 1000) + 60 * 3,inputArray];

//     console.log('decde', inputArray);
//     var name = 'multicall';
//   } else if (data.name !== 'multicall' && !isUniversal) {
//     let {
//       name: functionName,
//       inputs,
//       value: val,
//     } = deconstructTransactionDescription(data);
//     name = functionName;
//     value = val;

//     var name,
//       inputArray = v2Paramater(functionName, inputs);
//     if (!isV2) {
//       const necessaryValues = inputs[0];
//       var inputArray = await v3Parameter(
//         functionName,
//         necessaryValues,
//       );
//     }
//   } else {
//     var { isV2, name, inputArray } = await encodeUniversal(data);
//   }



//   const to = isV2 ? V2Router : V3Router;
//   const iUniswapRouter = isV2
//     ? new ethers.utils.Interface(UniswapRouterV2_ABI)
//     : new ethers.utils.Interface(UniswapRouterV3_ABI);
//   swapABI = iUniswapRouter.encodeFunctionData(name, inputArray);
//   const gasPrice = await web3.eth.getGasPrice();

//   //Test Transaction

//   const txObject = PoolLogic.methods.execTransaction(to, swapABI);
//   console.log('Transaction Built');
//   //@Check for Error here i have deployed the contract on goerli regarding Fund,manager the private key used is the Manager
//   const gasEstimate = await txObject.estimateGas({
//     gasPrice,
//   });
//   const txParams = {
//     from: accountAddress,
//     to: PoolLogic_address,
//     data: txObject.encodeABI(),
//     gasEstimate,
//     gasPrice: gasPrice,
//   };

//   console.log('Transaction Sent');

//   const signedTx = await web3.eth.accounts.signTransaction(
//     txParams,
//     privateKey,
//   );

//   const receipt = await web3.eth.sendSignedTransaction(
//     signedTx.rawTransaction,
//   );
//   // console.log('Transaction successful!');
//   console.log('Transaction successful! of copy trade');

//   // console.log('Receipt:', receipt);

//   return true;
// }

async function execTransaction(qouter,isUniversal, isV2, data) {
  try {
    let name, inputArray, value;
     if(!isV2){quoter = new web3.eth.Contract(
      Qouter_ABI,
      qouter.qouter,
    )}
    if (data.name === 'multicall') {
      console.log('Decoding multicall data...');
      inputArray = await decodeMulticall(data.args[1]);
      inputArray = [Math.floor(Date.now() / 1000) + 60 * 3, inputArray];
      console.log('Decoded multicall data:', inputArray);
      name = 'multicall';
    } else if (data.name !== 'multicall' && !isUniversal) {
      console.log('Deconstructing transaction description...');
      const { name: functionName, inputs,value:val} = deconstructTransactionDescription(data);
      name = functionName;
      value = val
      if (isV2) {
        console.log('Encoding V2 parameters...');
         const {name:functionNam,inputArray:input} = await v2Parameter(functionName, inputs,value);
      inputArray = input
      name = functionNam
        } else {
        console.log('Encoding V3 parameters...');
        const necessaryValues = inputs[0];
        inputArray = await v3Parameter(functionName, necessaryValues);
      }
    } else {
      console.log('Encoding universal transaction...');
      const { isV2: isV2Encoded, name: encodedName, inputArray: encodedInputArray } = await encodeUniversal(data);
      isV2 = isV2Encoded;
      name = encodedName;
      inputArray = encodedInputArray;
    }

    console.log("data",name,inputArray)
    const to = isV2 ? V2Router : V3Router;
    const iUniswapRouter = isV2
      ? new ethers.utils.Interface(UniswapRouterV2_ABI)
      : new ethers.utils.Interface(UniswapRouterV3_ABI);
    const swapABI = iUniswapRouter.encodeFunctionData(name, inputArray);
    

    const gasPrice = await web3.eth.getGasPrice();

    console.log('Building transaction...');
    const txObject = PoolLogic.methods.execTransaction(to, swapABI);
    console.log('Transaction built');

    console.log('Estimating gas...');
    const gasEstimate = await txObject.estimateGas({ gasPrice });
    const txParams = {
      from: accountAddress,
      to: PoolLogic_address,
      data: txObject.encodeABI(),
      gasEstimate,
      gasPrice,
    };

    console.log('Signing transaction...');
    const signedTx = await web3.eth.accounts.signTransaction(txParams, privateKey);

    console.log('Sending transaction...');
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction successful! of copy trade');

    return true;
  } catch (error) {
    console.error('Error executing transaction:', error);
    return false;
  }
}
// Example usage:
module.exports = { execTransaction };
