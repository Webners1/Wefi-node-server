const axios = require('axios');
const {
  abi: Token_ABI,
} = require('../contracts/interfaces/IERC20Extended.sol/IERC20Extended.json');
const { result } = require('lodash');
const { Web3 } = require('web3');

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/camelotlabs/camelot-amm';
async function fetchTokenData(tokenAddress) {
  const query = `
      {
        token(id: "${tokenAddress}") {
          derivedETH
          name
          decimals
          symbol
        }
      }
    `;

  // Make a request to your GraphQL endpoint with the above query
  try {
    const response = await axios.post(
      SUBGRAPH_URL,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const { data } = response.data;
    const token = data.token;
    return token;
  } catch (error) {
    console.error('Error fetching token data:', error);
  }
}

const ethPrice = async () => {
  try {
    const response = await axios.get(
      'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
    );
    return response.data.USD;
    // Handle the response data
  } catch (error) {
    // Handle the error
    console.log(error);
  }
};

const tokenPrice = async (ethPrice, token) => {
  const eth = parseInt(await ethPrice()) 
  const price =  await fetchTokenData(token)
  return eth * price.derivedETH;
};

const accurator = async (web3,account, token, mainAmount) => {
  const pricePerTokenInUSD = await tokenPrice(ethPrice,token);

  // const walletbalance = await walletBalance(account);
  // console.log({walletbalance})

  let factor = 0.5
  const tokenBalance = await walletTokenBalance0(web3, token,account);

  let minimumThreshold = 50
  const TradeSize = (mainAmount / 100) * factor;
  const PriceInUSD = (pricePerTokenInUSD * TradeSize)/ 10** parseInt(tokenBalance.decimal)
  // Check if the worth is less than $50

 let tradeAmount =
  PriceInUSD <= minimumThreshold
      ? pricePerTokenInUSD/minimumThreshold
      : TradeSize;

  return tokenBalance.balance >= tradeAmount ? tradeAmount : tokenBalance.balance;
};

const walletTokenBalance0 = async(web3,tokenAddress,walletAddress)=>{
   // Create a new instance of the token contract using the ABI and token address
   const tokenContract = new web3.eth.Contract(Token_ABI, tokenAddress);

   // Fetch the token balance of the wallet address
   const balance = await tokenContract.methods.balanceOf(walletAddress).call();
   const decimal = await tokenContract.methods.decimals().call();
   return {decimal,balance}
}
const walletTokenBalance = async (balance, token) => {
  const Token = await fetchTokenData(token);
  return Token
    ? (Token?.derivedETH * parseInt(balance)) / 10 ** Token?.decimals
    : 0;
};

const walletBalance = async (walletAddr) => {
  const network_id = 42161;
  const options = {
    url: `https://api.chainbase.online/v1/account/tokens?chain_id=${network_id}&address=${walletAddr}&limit=50&page=1`,
    method: 'GET',
    headers: {
      'x-api-key': '2daxKv4o8OjvAZrpNViAesddfhl', // Replace the field with your API key.
      accept: 'application/json',
    },
  };
  const result = await axios(options)
    .then((response) => response.data.data)
    .catch((error) => console.log(error));
  const EthPrice = await ethPrice();

  let totalBalance = await calculateTotalBalance(result);
  return Math.ceil(totalBalance.balance * EthPrice);
};

const walletBalancePerToken = async (walletAddr, tokenAddress) => {
  const network_id = 42161;
  const options = {
    url: `https://api.chainbase.online/v1/account/tokens?chain_id=${network_id}&address=${walletAddr}&contract_address=${tokenAddress}&limit=50&page=1`,
    method: 'GET',
    headers: {
      'x-api-key': '2daxKv4o8OjvAZrpNViAesddfhl', // Replace the field with your API key.
      accept: 'application/json',
    },
  };
  const result = await axios(options)
    .then((response) => response.data.data)
    .catch((error) => console.log(error));

  return parseInt(result.balance);
};
async function calculateTotalBalance(tok,result) {
  let balance = 0;
  let data = 0;

  if (result) {
    for (const token of result) {
      if(tok ==token.contract_address){
 data = {balance:token.balance,name:token.name,decimals:token.decimals}
      const tokenBalance = await walletTokenBalance(
        token.balance,
        token.contract_address,
      );
      balance += Number(tokenBalance);
    }
  }

  return {data,balance};
}
}
const infuraWsUrl = "https://ethereum-sepolia-rpc.publicnode.com"

// Create a new instance of the Web3 provider
const web3 = new Web3(infuraWsUrl);
accurator(web3,'0x48495a08bb9fa56ea121a6c1b7b93447b55c9ae3','0xaf88d065e77c8cc2239327c5edb3a432268e5831',"1000000000")
  .then((result) => console.log(result))
  .catch((error) => console.log(error));
module.exports = { accurator };
