const axios = require('axios');
const {
  abi: Token_ABI,
} = require('../contracts/interfaces/IERC20Extended.sol/IERC20Extended.json');
const { result } = require('lodash');

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
  return ethPrice * (await fetchTokenData(token))?.derivedETH;
};

const accurator = async (account, token, mainAmount) => {
  const pricePerTokenInUSD = await tokenPrice(token);
  const walletBalance = await walletTokenBalance(account);
  const tokenBalance = walletBalancePerToken(account, token);
  const minTradeSize = (walletBalance / 100) * 5;
  mainPriceInUSD = (pricePerToken * mainAmount) / 10 ** 18;
  let amountInUSD = (mainPriceInUSD / 100) * 5;
  let tradeAmount;
  // Check if the worth is less than $50

  tradeAmount =
    amountInUSD <= minTradeSize
      ? minTradeSize / pricePerTokenInUSD
      : amountInUSD / pricePerTokenInUSD;
  return tokenBalance >= tradeAmount ? tradeAmount : tokenBalance;
};

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
  return Math.ceil(totalBalance * EthPrice);
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
async function calculateTotalBalance(result) {
  let balance = 0;

  if (result) {
    for (const token of result) {
      const tokenBalance = await walletTokenBalance(
        token.balance,
        token.contract_address,
      );
      balance += Number(tokenBalance);
    }
  }

  return balance;
}

walletBalance('0x48495a08bb9fa56ea121a6c1b7b93447b55c9ae3')
  .then((result) => console.log(result))
  .catch((error) => console.log(error));
module.exports = { accurator };
