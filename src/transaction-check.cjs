
const { decodeExecute } = require('./decoder.cjs');

const  {execTransaction}  = require('./server-function.cjs');
const {Web3} = require('web3');
const UniswapV2RouterABI = require('./uniswapV2.json');
const UniswapV3RouterABI = require('./uniswapV3.json');
const UniversalRouterABI = require('./UniversalRouter.json');
const web3 = new Web3(process.env.RPC);
const uniswapV2RouterAddress = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';
const uniswapV3RouterAddress = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E';
const uniswapV3UniversalAddress = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const { decodeParameters } = require('web3-eth-abi');
const { ethers } = require('ethers');

require('dotenv').config()
let decodedInput
let router
 async function getTransactionDetails(txHash) {
  try {
    // Get transaction from node
    const tx = await web3.eth.getTransaction(txHash);
  //   const receipt = await web3.eth.getTransactionReceipt(txHash);
  
  // console.log("receipt",receipt.logs)  // Check if transaction is to Uniswap V2 Router
    if (tx.to === (uniswapV2RouterAddress).toLowerCase()) {
      // Decode input data using Uniswap V2 Router ABI
      // const router = new web3.eth.Contract(UniswapV2RouterABI, uniswapV2RouterAddress);
      //  inputData = tx.input;
       router =new ethers.utils.Interface(UniswapV2RouterABI);
       decodedInput = router.parseTransaction({ data: tx.data, value: tx.value});
  
      return {isUniversal:false,isV2 : true,result :decodedInput}
    } else if (tx.to === (uniswapV3RouterAddress).toLowerCase()) {
      return {isUniversal: false,isV2 : false,result : decodeUniswapV3Transaction(tx)}
      
    } else if (tx.to.toLowerCase() === uniswapV3UniversalAddress.toLowerCase()) {
decodedInput =  decodeExecute(tx.data)
     return {isUniversal: true, isV2 :false,result :decodedInput}
    } else {
      console.log('Not a Uniswap transaction');
    }
  } catch (error) {
    console.error('Error fetching transaction details:', error);
  }
}

function decodeUniswapV3Transaction(tx) {
  const routers =new ethers.utils.Interface(UniswapV3RouterABI);
  const decodedInput = routers.parseTransaction({ data: tx.data, value: tx.value});

return decodedInput
}



module.exports = { getTransactionDetails}
