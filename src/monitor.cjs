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
const monitoredWalletAddress = '0x6e0Ee480C539f7B78c8c3EE82DDEe4D48B26b1fd';

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
// Set the confirmation threshold
const confirmationThreshold = 3;

let transactionHash;

const getEvents = async (txHash) => {
  
  // const result = await getTransactionDetails(txHash);
  const result = await getTransactionDetails(txHash.transaction.hash);
  execTransaction(result)

};

// getEvents("0xa72955977af89ac8d29f6912ce6062ab68f2605ea020d15657d8a1cccadc8564")

