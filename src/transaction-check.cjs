
const { decodeExecute } = require('./decoder.cjs');

const  {execTransaction}  = require('./server-function.cjs');
const {Web3} = require('web3');
const UniswapV2RouterABI = require('./uniswapV2.json');
const UniswapV3RouterABI = require('./uniswapV3.json');
const UniversalRouterABI = require('./UniversalRouter.json');
const ADDRESS_LIST = require('./ExchangesAddress/addresses_testnet.json');
require('dotenv').config()
const web3 = new Web3(process.env.RPC);
const { decodeParameters } = require('web3-eth-abi');
const { ethers } = require('ethers');

let V2Router = process.env.ROUTERV2;
let V3Router = process.env.ROUTERV3;
let UNIVERSAL = process.env.UNIVERSALROUTER;
let router;

let QOUTER_V2;
const getAddress = (address) => {
  for (const item of ADDRESS_LIST) {
    for (const key in item) {
      if (item[key] === address && key.includes("V2")) {
        return {isUniversal:false,isV2:true, address: item[key], key: key };
      }
      if (item[key] === address && key.includes("V3")) {
        return {Qouter:item["QouterV2"], isUniversal:false,isV2:false,address: item[key], key: key };
      }
      else{
        return { Qouter:item["QouterV2"], isUniversal:true,isV2:false,address: item[key], key: key };

      }
    }
  }

  throw new Error("Address not found in list");
};
 async function getTransactionDetails(txHash) {
  try {
    // Get transaction from node
    const tx = await web3.eth.getTransaction(txHash);

  var {Qouter,isV2, isUniversal}= getAddress(tx.to)
  QOUTER_V2 = !isV2 ? Qouter:""
  console.log({QOUTER_V2})
  // console.log("receipt",receipt.logs)  // Check if transaction is to Uniswap V2 Router
    if (isV2) {
      // Decode input data using Uniswap V2 Router ABI
      // const router = new web3.eth.Contract(UniswapV2RouterABI, uniswapV2RouterAddress);
      //  inputData = tx.input;
      V2Router = tx.to

       router =new ethers.utils.Interface(UniswapV2RouterABI);
       decodedInput = router.parseTransaction({ data: tx.data, value: tx.value});
  
      return {isUniversal,isV2,result :decodedInput}
    }  
    else if (!isV2 && !isUniversal) {
      V3Router = tx.to
      return {qouter:QOUTER_V2,isUniversal,isV2,result : decodeUniswapV3Transaction(tx)}
      
    } else if (isUniversal) {
      UNIVERSAL = tx.to
decodedInput =  decodeExecute(tx.data)
     return {qouter:QOUTER_V2,isUniversal, isV2,result :decodedInput}
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

console.log({QOUTER_V2})

module.exports = { getTransactionDetails,QOUTER_V2,V2Router,V3Router,UNIVERSAL}
