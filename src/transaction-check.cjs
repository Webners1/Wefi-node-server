const {Web3} = require('web3');
const UniswapV2RouterABI = require('./uniswapV2.json');
const UniswapV3RouterABI = require('./uniswapV3.json');
const UniversalRouterABI = require('./UniversalRouter.json');
const web3 = new Web3('https://ethereum-goerli-rpc.publicnode.com');
const uniswapRouterAddress = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const uniswapV3RouterAddress = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const uniswapV3UniversalAddress = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const { decodeParameters } = require('web3-eth-abi');
 async function getTransactionDetails(txHash) {
  try {
    // Get transaction from node
    const tx = await web3.eth.getTransaction(txHash);

    // Check if transaction is to Uniswap V2 Router
    if (tx.to === (uniswapRouterAddress).toLowerCase()) {
      // Decode input data using Uniswap V2 Router ABI
      const router = new web3.eth.Contract(UniswapV2RouterABI, uniswapRouterAddress);
      const inputData = tx.input;
      const { methodName, args } = router.decodeFunctionData(inputData);
    
      if (methodName === 'swapExactTokensForTokens') {
        // Extract token addresses and other relevant values
        const [amountIn, amountOutMin, path, to, deadline] = args;
        const inputToken = path[0];
        const outputToken = path[path.length - 1];
    
        console.log('Uniswap V2 Swap:');
        console.log('Amount In:', amountIn);
        console.log('Amount Out Minimum:', amountOutMin);
        console.log('Input Token:', inputToken);
        console.log('Output Token:', outputToken);
        console.log('To:', to);
        console.log('Deadline:', deadline);
      } else if (methodName === 'addLiquidity') {
        // Extract token addresses and other relevant values
        const [tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline] = args;
    
        console.log('Uniswap V2 Add Liquidity:');
        console.log('Token A:', tokenA);
        console.log('Token B:', tokenB);
        console.log('Amount A Desired:', amountADesired);
        console.log('Amount B Desired:', amountBDesired);
        console.log('Amount A Minimum:', amountAMin);
        console.log('Amount B Minimum:', amountBMin);
        console.log('To:', to);
        console.log('Deadline:', deadline);
      } else if (methodName === 'removeLiquidity') {
        // Extract token addresses and other relevant values
        const [tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline] = args;
    
        console.log('Uniswap V2 Remove Liquidity:');
        console.log('Token A:', tokenA);
        console.log('Token B:', tokenB);
        console.log('Liquidity:', liquidity);
        console.log('Amount A Minimum:', amountAMin);
        console.log('Amount B Minimum:', amountBMin);
        console.log('To:', to);
        console.log('Deadline:', deadline);
      }
    } else if (tx.to === (uniswapV3RouterAddress).toLowerCase()) {
      const router = new web3.eth.Contract(UniswapV3RouterABI, uniswapV3RouterAddress);
      decodeUniswapV3Transaction(tx, router);
    } else if (tx.to.toLowerCase() === uniswapV3UniversalAddress.toLowerCase()) {
      const router = new web3.eth.Contract(UniversalRouterABI, uniswapV3UniversalAddress);
      const inputData = tx.input;
      const methodId = inputData.slice(0, 10);
      console.log("tx", inputData);

      if (methodId === "0x3593564c") {
        // Decode execute method  
        console.log("multicall")
        const values = web3.eth.abi.decodeParameters(
          ['bytes', 'bytes[]', 'uint256'],
          inputData
        );
        console.log("execute method called:", values);
      } else if (methodId === "0x24856bc3") {
        // Decode onERC1155BatchReceived method
        const values = web3.eth.abi.decodeParameters(['address', 'address', 'uint256[]', 'uint256[]', 'bytes'], inputData);
        console.log("onERC1155BatchReceived methodcalled:", values);
      } else if (methodId === "0x2e0c2a96") {
        // Decode onERC1155Received method
        const values = web3.eth.abi.decodeParameters(['address', 'address', 'uint256', 'uint256', 'bytes'],inputData );
        console.log("onERC1155Received method called:", values);
      }
    } else {
      console.log('Not a Uniswap transaction');
    }
  } catch (error) {
    console.error('Error fetching transaction details:', error);
  }
}

function decodeUniswapV3Transaction(tx, router) {
  const inputData = tx.input;
  const methodId = inputData.slice(0, 10);

  if (methodId === '0x414bf389') {
    // exactInputSingle
    decodeExactInputSingle(inputData, router);
  } else if (methodId === '0xc04b8d59') {
    // exactInput
    decodeExactInput(inputData, router);
  } else if (methodId === '0xf28c0498') {
    // exactOutputSingle
    decodeExactOutputSingle(inputData, router);
  } else if (methodId === '0xf28c0498') {
    // exactOutput
    decodeExactOutput(inputData, router);
  } else if (methodId === '0xac9650d8') {
    // multicall
    decodeMulticall(inputData, router);
  }
}

function decodeExactInputSingle(inputData, router) {
  const sig = router.methods.exactInputSingle();
  const {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96
  } = sig.decodeABI([inputData]);

  console.log({
    method: 'exactInputSingle',
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96
  });
}

function decodeExactOutputSingle(inputData, router) {
  const sig = router.methods.exactOutputSingle();
  const {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96
  } = sig.decodeABI([inputData]);

  console.log({
    method: 'exactOutputSingle',
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountIn,
amountOutMinimum,
    sqrtPriceLimitX96
  });
}

function decodeExactInput(inputData, router) {
  const sig = router.methods.exactInput();
  const {
    path,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum
  } = sig.decodeABI([inputData]);

  console.log({
    method: 'exactInput',
    path,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum
  });
}

function decodeExactOutput(inputData, router) {
  const sig = router.methods.exactOutput();
  const {
    path,
    recipient,
    deadline,
    amountOut,
    amountInMaximum
  } = sig.decodeABI([inputData]);

  console.log({
    method: 'exactOutput',
    path,
    recipient,
    deadline,
    amountOut,
    amountInMaximum
  });
}

function decodeMulticall(inputData, router) {
  const sig = router.methods.multicall();
  const {
    data
  } = sig.decodeABI([inputData]);

  console.log({
    method: 'multicall',
    data
  });
}
getTransactionDetails("0x224c5a48ba329abff867afc28224d5d3cd8a7eca5bd15952e60633fbaff7ca31")