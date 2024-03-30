const { execTransaction } = require('./server-function.cjs');
const {getTransactionDetails} = require('./transaction-check.cjs');

const {Web3} = require('web3');
const WebSocket = require('ws');

require('dotenv').config()

// Installation: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require("alchemy-sdk");
const { configDotenv } = require('dotenv');

const settings = {
  apiKey: "8u_Y-TzFMwVvoX5WDEFY5Eho7VFSUrJj", // Replace with your Alchemy API Key
  network: Network.ETH_SEPOLIA, // Replace with your network
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

// Create a new instance of the Web3 provider

const getEvents = async (txHash) => {
  //@error isv2 is false, but function type is specifying that the function name is V2_SWAP_EXACT_OUT, tiggering the v2 swap function.
  const data  = await getTransactionDetails(txHash);
  // const data = await getTransactionDetails(txHash.transaction.hash);
  execTransaction(data,data.isUniversal,data.isV2,data.result)

};

getEvents("0x7d9cadc686ed977b44a6199dabe8719ac17b6cd9564067b367c7e7ea93d17c9a")

