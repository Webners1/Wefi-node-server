const {Web3} = require('web3');
const WebSocket = require('ws');

const privatekey = "a204996d053cf1e9abb3bd6001158a91e736c3fce1ab278765f676fce0c07f23"

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
 console.log(txHash)
  const tx = await getTransaction(txHash.transaction.hash)
  await write(tx)
};

// Define the `getTransaction` function
const getTransaction = async (transactionHash) => {
  // Use the Web3 library to get the transaction details
  const transaction = await web3.eth.getTransaction(transactionHash);

  // Process the transaction details as needed
  // console.log(`Transaction details: ${JSON.stringify(transaction)}`);
return transaction
};


const write = async(transaction)=>{
 try{ const inputData = transaction.input;

  // Get the transaction value
  const value = transaction.value;

  // Get the transaction gas price
  const gasPrice = transaction.gasPrice;

  // Get the transaction gas limit
  const gasLimit = transaction.gasLimit;

  // Get the transaction to address
  const to = transaction.to;

  // Create a new transaction object
  const newTransaction = {
    from: transaction.from,
    to: to,
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    data: inputData,
  };
console.log(newTransaction)
  // Sign the transaction
  await web3.eth.accounts.signTransaction(newTransaction, privatekey, async(err, signedTransaction) => {
    if (err) {
      console.error(err);
      return;
    }

    // Send the transaction
   await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction, (err, txHash) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log('Transaction sent:', txHash);
    });
  });
}catch(e){
console.log(e)
}
}