const { encodeRouteToPath } = require('./encodeRoutetoPath.cjs');

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
require('dotenv').config();
// Connect to a web3 provider
const web3 = new Web3(process.env.RPC);
const PoolManagerLogic_address =
  '0xacd5d3d49502eade3f9f7b20524a6f1e3a14fdb7';
const PoolLogic_address =
  '0x6BbA366F2AB98D5B025776A15b8b26B5fdff092b';
const V2Router = process.env.ROUTERV2;
const V3Router = process.env.ROUTERV3;
const UNIVERSALRouter = process.env.ROUTERV2V3;
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
  if (!isApproved) {
    return encodeApproveData(
      tokenAddress,
      spender,
      ethers.constants.MaxUint256,
      gasPrice,
    );
  }
  console.log("Token Approved!!")
  return isApproved;
}

const encodeUniversal = async (swap) => {
  const { function: functionType, path } = swap;
  
  const router = new AlphaRouter({
    chainId: ChainId.SEPOLIA,
    provider,
  });
  // const real_amount_factor = Math.round(await accurator(web3,PoolLogic_address,path[0],swap.amountIn)/swap?.amountIn)
  const real_amount_factor = 1;
  let amountIn = Math.round(
    swap.amountIn * real_amount_factor,
  ).toString();
  let amountOut = Math.round(
    swap.amountOut * real_amount_factor,
  ).toString();
  const tokenIn = new Token(ChainId.SEPOLIA, path[0], 18, 'MTKs');
  const tokenOut = new Token(
    ChainId.SEPOLIA,
    path[path.length - 1],
    18,
    'MTKs',
  );

  const amount = CurrencyAmount.fromRawAmount(
    tokenIn,
    parseInt(amountIn),
  );
  const route = await router.route(
    amount,
    tokenOut,
    functionType === 'V3_SWAP_EXACT_IN'
      ? TradeType.EXACT_INPUT
      : TradeType.EXACT_OUTPUT,
  );

  const tradeType = route.route[0].tradeType;
  const AmountIn =
    tradeType === TradeType.EXACT_INPUT
      ? route.route[0].amount.quotient.toString()
      : route.route[0].quote.quotient.toString();
  const AmountOut =
    tradeType === TradeType.EXACT_INPUT
      ? route.route[0].quote.quotient.toString()
      : route.route[0].amount.quotient.toString();

  const pools =
    route.route[0].protocol === Protocol.V2
      ? route.route[0].route.pairs
      : route.route[0].route.pools;
  if (path.length > 2) {
    const token_path = encodeRouteToPath(
      route.route[0].route,
      functionType !== 'V3_SWAP_EXACT_IN',
    );
    if (functionType === 'V3_SWAP_EXACT_IN') {
      return {
        isV2: false,
        name: 'exactInput',
        inputArray: 
        [  [
            token_path,
            PoolLogic_address,
            AmountIn,
            AmountOut,
          ]]
      
      };
    } else {
      return {
        isV2: false,
        name: 'exactOutput',
        inputArray: [
          [
            token_path,
            PoolLogic_address,
            AmountOut,
            AmountIn,
          ],
        ],
      };
    }
  }

  if (path.length <= 2 && functionType === 'V3_SWAP_EXACT_IN') {
    return {
      isV2: false,
      name: 'exactInputSingle',
      inputArray: [
        [
          path[0],
          path[1],
          pools[0].fee || '3000',
          PoolLogic_address,
          AmountIn,
          AmountOut || '0',
          '0',
        ],
      ],
    };
  } else if (
    path.length <= 2 &&
    functionType === 'V3_SWAP_EXACT_OUT'
  ) {
    return {
      isV2: false,
      name: 'exactOutputSingle',
      inputArray: [
        [
          path[0],
          path[1],
          pools[0].fee || '3000',
          PoolLogic_address,
          AmountOut || '0',
          AmountIn,
          pools[0].sqrtRatioX96.toString() || '0',
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
const v2Paramater = (name,array)=>{
  console.log(array)
   if (name === 'swapExactTokensForTokens' || 'swapExactETHForTokens') {
    return {
      name:'swapTokensForExactTokens',
      inputArray: [
        array?.amountIn ?? '0',
        array?.amountOut ?? '0',
        array.path,
        PoolLogic_address,
        Math.floor(Date.now() / 1000) + 60 * 3,
      ],
    };
  }
  //@Fix the parameters of the function according to V2Router
  else if (name === 'swapTokensForExactTokens' || 'swapETHForExactTokens') {
    return {
      name:'swapTokensForExactTokens',
      inputArray: [
        array?.amountOut ?? '0',
        array?.amountIn ?? '0',
        array.path,
        PoolLogic_address,
        Math.floor(Date.now() / 1000) + 60 * 3,
      ],
    };
  
  // return array.filter(item => typeof item == 'object' || item._isBigNumber);
}
else if(name === 'swapExactTokensForTokensSupportingFeeOnTransferTokens' || 'swapExactETHForTokensSupportingFeeOnTransferTokens'){
  return {
    name:'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    inputArray: [
      array?.amountOut ?? '0',
      array.path,
      PoolLogic_address,
      Math.floor(Date.now() / 1000) + 60 * 3,
    ],
  }
}
}
const unpackPath = (path,isOutput)=>{
  const TOKEN_IN = isOutput ? `0x${path.slice(-40)}` : path.slice(0, 42);
  const TOKEN_OUT = isOutput ? path.slice(0, 42) :`0x${path.slice(-40)}` ;

  return { TOKEN_IN, TOKEN_OUT };
}
const v3Parameter = async(name,swap)=>{
let TOKEN_OUT;
let TOKEN_IN;
if(name.toLowerCase().includes('single')){
  TOKEN_IN = swap.tokenIn
  TOKEN_OUT =swap.tokenOut
}else{
  if(name.toLowerCase().includes('output')){
      
    [TOKEN_IN,TOKEN_OUT] =  unpackPath(swap.path,true)
    
  }
  else{
    [TOKEN_IN,TOKEN_OUT] =  unpackPath(swap.path,false)

  }
}
      const router = new AlphaRouter({
        chainId: ChainId.SEPOLIA,
        provider,
      });
      let amountIn = Math.round(
        swap.amountIn * real_amount_factor,
      ).toString();
//@WRITE A FUNCTION TO GET TOKENS IN AND OUT FROM PATH
      const tokenIn = new Token(ChainId.SEPOLIA, TOKEN_IN, 18, 'MTKs');
      const tokenOut = new Token(
        ChainId.SEPOLIA,
        TOKEN_OUT,
        18,
        'MTKs',
      );
    
      const amount = CurrencyAmount.fromRawAmount(
        tokenIn,
        parseInt(amountIn),
      );
      const route = await router.route(
        amount,
        tokenOut,
        name === 'exactInput' || 'exactInputSingle'
          ? TradeType.EXACT_INPUT
          : TradeType.EXACT_OUTPUT,
      );
    
      const tradeType = route.route[0].tradeType;
      const AmountIn =
        tradeType === TradeType.EXACT_INPUT
          ? route.route[0].amount.quotient.toString()
          : route.route[0].quote.quotient.toString();
      const AmountOut =
        tradeType === TradeType.EXACT_INPUT
          ? route.route[0].quote.quotient.toString()
          : route.route[0].amount.quotient.toString();
    
      const pools =
        route.route[0].protocol === Protocol.V2
          ? route.route[0].route.pairs
          : route.route[0].route.pools;
        
      if ( name === 'exactInputSingle') {
        return {
          inputArray: [
            [
              TOKEN_IN,
              TOKEN_OUT,
              swap.fee || '3000',
              PoolLogic_address,
              AmountIn,
              AmountOut || '0',
              '0',
            ],
          ],
        };
      } else if (
        name === 'exactOutputSingle'
      ) {
        return {
          inputArray: [
            [
              TOKEN_IN,
              TOKEN_OUT,
              swap.fee || '3000',
              PoolLogic_address,
              AmountOut || '0',
              AmountIn,
              pools[0].sqrtRatioX96.toString() || '0',
            ],
          ],
        };
      }
      else if (
        name === 'exactInput'
      ) {
        const token_path = encodeRouteToPath(
          route.route[0].route,
          name === 'exactInput' || 'exactInputSingle'
        );
        return {
          inputArray: [
            [
              
              token_path,
              PoolLogic_address,
              AmountIn,
              AmountOut || '0',
               '0',
            ],
          ],
        };
      }
      else if (
        name === 'exactOutput'
      ) {
        const token_path = encodeRouteToPath(
          route.route[0].route,
          name === 'exactInput' || 'exactInputSingle'
        );
        return {
          inputArray: [
            [
              
              token_path,
              PoolLogic_address,
              AmountOut || '0',
              AmountIn,
              '0',
            ],
          ],
        };
      }

}

const encodeMulticall=(name,data)=>{

  const SWAP_ROUTER =  new ethers.utils.Interface(UniswapRouterV3_ABI)
  return SWAP_ROUTER.encodeFunctionData(name,data)
}
const decodeMulticall= (calls)=>{
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
    const abiInterface = new ethers.utils.Interface(UniswapV3RouterABI);
   data = []
    return calls.map(call => {
      try {
        const func = call.slice(0, 10);
        const decodedArgs = abiInterface.decodeFunctionData(func, call)
        const functionName = abiInterface.getFunction(func).name
        if(v2FunctionNames.includes(functionName)){
// data.append(encodeMulticall(functionName,v2Paramater(functionName,decodedArgs[0].args.params)))
        }
        else if(v3FunctionNames.includes(functionName)){
          data.append(encodeMulticall(functionName,v3Parameter(functionName,decodedArgs[0].args.params)))

        }
        return decodedArgs[0];

      }
      catch (ex) {
        return; // you could return a type here to indicate it was not parsed
      }
    })
}
async function execTransaction(isUniversal, isV2, data) {
if(data.name ==="multicall"){
  console.log("decocde",decodeMulticall(data.args[1]))
  return;
var name = 'multicall'
inputArray =data.args.filter((args)=> args !== object)
inputArray[0] = Math.floor(Date.now() / 1000) + 60 * 3
inputArray = inputArray
}
  else if (data.name !=="multicall" && !isUniversal) {
    let {
      name: functionName,
      inputs,
      value: val,
    } = deconstructTransactionDescription(data);
    name = functionName;
    value = val;
   
    var name, inputArray = (v2Paramater(functionName,inputs))
    if (!isV2) {
      const necessaryValues = inputs[0];
    const InputObject =  necessaryValues.filter(
          (item) => typeof item !== 'object' || item._isBigNumber,
        );
    inputArray = Object.values(InputObject);
    inputArray = convertBigNumbersToNumbers(inputArray);
      inputArray[3] = PoolLogic_address;
      inputArray = [inputArray];
    }
  } else {
    var { isV2, name, inputArray } = await encodeUniversal(data);
  }
  console.log(name,inputArray)
  const to = isV2 ? V2Router : V3Router;
  const iUniswapRouter = isV2
    ? new ethers.utils.Interface(UniswapRouterV2_ABI)
    : new ethers.utils.Interface(UniswapRouterV3_ABI);
  swapABI = iUniswapRouter.encodeFunctionData(name, inputArray);
  const gasPrice = await web3.eth.getGasPrice();
if(name !== 'multicall'){

  const approved = await isContractApproved(
    data?.path ? data.path[0] : data.args.params[0],
    to,
    PoolLogic_address,
    data?.amountIn
    ? data?.amountIn
    : Number(data?.args.params.amountIn),
    gasPrice,
    );
    
  }
  //Test Transaction

  const txObject = PoolLogic.methods.execTransaction(to, swapABI);
  console.log('Transaction Built');
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
  console.log('Transaction Sent');

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
