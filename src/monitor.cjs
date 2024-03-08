const { execTransaction } = require('./server-function.cjs');
const {getTransactionDetails} = require('./transaction-check.cjs');

const {Web3} = require('web3');
const WebSocket = require('ws');


// Installation: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require("alchemy-sdk");

const settings = {
  apiKey: "8u_Y-TzFMwVvoX5WDEFY5Eho7VFSUrJj", // Replace with your Alchemy API Key
  network: Network.ETH_GOERLI, // Replace with your network
};
const monitoredWalletAddress = '0xbE7167396cF48578186FF088d6a978081b205b5d';

const alchemy = new Alchemy(settings);

// Subscription for Alchemy's minedTransactions API
alchemy.ws.on(
    
  {
    method: AlchemySubscription.MINED_TRANSACTIONS,
    addresses: [
      {
        from: monitoredWalletAddress,
      },
    ],
    includeRemoved: false,
    hashesOnly: true,
  },
  (tx) => getEvents(tx)
);

// Replace YOUR_WALLET_ADDRESS with the address you want to monitor
const infuraWsUrl = "https://goerli.infura.io/v3/1f08eb6050734553aadea8b5ffebc6a1"

// Create a new instance of the Web3 provider
const web3 = new Web3(infuraWsUrl);

const getEvents = async (txHash) => {
  //@error isv2 is false, but function type is specifying that the function name is V2_SWAP_EXACT_OUT, tiggering the v2 swap function.
  const data  = await getTransactionDetails(txHash);
  console.log(isUniversal,isV2,result)
  // const result = await getTransactionDetails(txHash.transaction.hash);
  execTransaction(data.isUniversal,data.isV2,data.result)

};

<<<<<<< HEAD
getEvents("0x61e5e093e97d16260982885e6225380239a618b45bd080daacfa8a2bfbcb8563")
=======
getEvents("0xc327d5f7c768cb12c6616262700351aa7733be050319d794f1a5c1e4a88a8e70")
>>>>>>> 3074816dc970db0a3eac5740f6b91a313a36b936

