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
const monitoredWalletAddress = '0x7a491dA575A00b14A88DC4B9914E0c2323A1eFd3';

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
  // const data  = await getTransactionDetails(txHash);
  const data = await getTransactionDetails(txHash.transaction.hash);
  if(data){

    execTransaction(data,data.isUniversal,data.isV2,data.result)
  }

};

// getEvents("0xd3c7c3b9f4da7c3cae246454f9f1cda1dc7d621ad52c21dc2ec52c4e7ee64993")

