import Web3 from 'web3';
const web3 = new Web3('https://ethereum-goerli.publicnode.com');
import UniswapV2RouterABI from './uniswapV2.json'
import UniswapV3RouterABI from './uniswapV3.json';
import UniversalRouterABI from './UniversalRouter.json';
const uniswapRouterAddress = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const uniswapV3RouterAddress = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const uniswapV3UniversalAddress = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';

export async function getTransactionDetails(txHash) {

  // Get transaction from node
  const tx = await web3.eth.getTransaction(txHash);
console.log("tx",tx)
  // Check if transaction is to uniswap router
  if(tx.to === uniswapRouterAddress) {

    // Decode input data using uniswap router ABI
    const router = new web3.eth.Contract(UniswapV2RouterABI, uniswapRouterAddress);
    const inputData = tx.input;
    const {methodName, args} = router.decodeMethod(inputData);

    if(methodName === 'swapExactTokensForTokens') {
      console.log('Uniswap V2 Swap:', args);
    } else if(methodName === 'addLiquidity') {
      console.log('Uniswap V2 Add Liquidity:', args);  
    } else if(methodName === 'removeLiquidity') {
      console.log('Uniswap V2 Remove Liquidity:', args);
    }

  }else if(tx.to === uniswapV3RouterAddress) {

    const router = new web3.eth.Contract(UniswapV3RouterABI, uniswapV3RouterAddress);

    decodeUniswapV3Transaction(tx, router);

  } 
  else if(tx.to === uniswapV3UniversalAddress){
    if(methodId === "0x3593564c") {
      console.log("execute method called"); 
    }
  
    else if(methodId === "0x24856bc3") {
      console.log("onERC1155BatchReceived method called");
    }
  }
   else {
    console.log('Not a Uniswap transaction'); 
  }

}
function decodeUniswapV2Transaction(tx, router) {

  const inputData = tx.input;

  const {methodName, args} = router.decodeMethod(inputData);

  if(methodName === 'swapExactTokensForTokens') {
    console.log('Uniswap V2 Swap:', args);
  } else if(methodName === 'addLiquidity') {
    console.log('Uniswap V2 Add Liquidity:', args);  
  } else if(methodName === 'removeLiquidity') {
    console.log('Uniswap V2 Remove Liquidity:', args);
  }

}

function decodeUniswapV3Transaction(tx, router) {

  const inputData = tx.input;
const methodId = inputData.slice(0, 10)
  if(methodId === '0x414bf389') {

    // exactInputSingle
    decodeExactInputSingle(inputData, router);

  } else if(methodId === '0xc04b8d59') {

    // exactInput
    decodeExactInput(inputData, router);

  } else if(methodId === '0xf28c0498') {

    // exactOutputSingle
    decodeExactOutputSingle(inputData, router);

  } else if(methodId === '0xf28c0498') {

    // exactOutput 
    decodeExactOutput(inputData, router);

  } else if(methodId === '0xac9650d8') {

    // multicall
    decodeMulticall(inputData, router);

  }
  // if(inputData.slice(0,4) === '0x38ed1739') { // swap method id

  //   const sig = router.interface.functions.swap(
  //     'tokenIn', 
  //     'tokenOut',
  //     'fee', 
  //     'recipient',
  //     'deadline',
  //     'amountIn', 
  //     'amountOutMinimum',
  //     'sqrtPriceLimitX96'
  //   );
  //   const params = sig.decode(inputData);

  //   console.log('Uniswap V3 Swap:', params);

  // } else if(inputData.slice(0,4) === '0x02fef9dc') { // add liquidity method id

  //   const sig = router.interface.functions.addLiquidity(
  //     'tokenA',
  //     'tokenB',  
  //     'fee',
  //     'recipient',
  //     'deadline',
  //     'amountADesired',
  //     'amountBDesired', 
  //     'amountAMinimum',
  //     'amountBMinimum'  
  //   );

  //   const params = sig.decode(inputData);
  
  //   console.log('Uniswap V3 Add Liquidity:', params);

  // } else if(inputData.slice(0,4) === '0x22005cfe') { // remove liquidity method id

  //   const sig = router.interface.functions.removeLiquidity(
  //     'tokenA',
  //     'tokenB',
  //     'fee', 
  //     'recipient',
  //     'deadline',
  //     'liquidity',
  //     'amountAMinimum',
  //     'amountBMinimum'
  //   );
  //   const params = sig.decode(inputData);

  //   console.log('Uniswap V3 Remove Liquidity:', params);

  // }

}

function decodeExactInputSingle(inputData, router) {

  const sig = router.interface.functions.exactInputSingle();

  const {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,  
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96    
  } = sig.decode(inputData);

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

  const sig = router.interface.functions.exactInputSingle();

  const {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,  
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96    
  } = sig.decode(inputData);

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
function decodeMulticall(inputData, router) {

  const sig = router.interface.functions.multicall();

  const { calls } = sig.decode(inputData);

  

  console.log({method: 'multicall'});

}
getTransactionDetails('0x657019528152385b4128ff62a9cf8184959b66375229398d8706132efa2c03b2');
