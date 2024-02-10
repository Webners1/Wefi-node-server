const {Web3} = require('web3');
const WebSocket = require('ws');

// Replace YOUR_WALLET_ADDRESS with the address you want to monitor
const monitoredWalletAddress = '0x6e0Ee480C539f7B78c8c3EE82DDEe4D48B26b1fd';
const infuraWsUrl = "wss://goerli.infura.io/ws/v3/cf77df1152df471f965637545140303d"

// Create a new instance of the Web3 provider
const web3 = new Web3(infuraWsUrl);
const ws = new WebSocket(infuraWsUrl);
// Set the confirmation threshold
const confirmationThreshold = 3;

let transactionHash;

const getEvents = async () => {
  const ws = new WebSocket(infuraWsUrl);


  ws.on('open', () => {
    // Subscribe to new pending transactions
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: ['newPendingTransactions'],
      })
    );

    // Subscribe to new blocks
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_subscribe',
        params: ['newBlocks'],
      })
    );
  });

  ws.on('message', async(message) => {
    const data = JSON.parse(message);
    console.log(data)

    // Check if the message is a pending transaction event
    if (data.method === 'eth_subscription' && data.params && data.params.result && data.params.subscription === 1) {
      // Get the transaction hash from the event data
      transactionHash = data.params.result;
      console.log(transactionHash)

      // Use the Web3 library to get the transaction details
      web3.eth.getTransaction(transactionHash).then((transaction) => {
        // Check if the transaction is made by the monitored wallet
        if (transaction.from === monitoredWalletAddress) {
          // Process the transaction details as needed
          console.log(`Transaction made by monitored wallet detected: ${transactionHash}`);
        }
      });
    }

    // Check if the message is a new block event
    if (data.method === 'eth_subscription' && data.params && data.params.result && data.params.subscription === 2) {
      const blockNumber = data.params.result.number;

      // Get all transactions for the new block
      const transactions = await web3.eth.getBlock(blockNumber, true);

      // Iterate through the transactions in the block
      for (const transaction of transactions.transactions) {
        console.log(transaction)
        // Check if the transaction is made by the monitored wallet
        if (transaction.from === monitoredWalletAddress) {
          // Check the number of confirmations for the transaction
          web3.eth.getTransactionReceipt(transactionHash).then((receipt) => {
            const confirmations = receipt.blockNumber ? blockNumber - receipt.blockNumber + 1 : 0;

            // Check if the transaction has reached the confirmation threshold
            if (confirmations >= confirmationThreshold) {
              console.log(`Transaction ${transactionHash} confirmed with ${confirmations} confirmations`);

              // Run the `getTransaction` function here
              getTransaction(transactionHash);
            }
          });
        }
      }
    }
  });
};

// Define the `getTransaction` function
const getTransaction = async (transactionHash) => {
  // Use the Web3 library to get the transaction details
  const transaction = await web3.eth.getTransaction(transactionHash);

  // Process the transaction details as needed
  console.log(`Transaction details: ${JSON.stringify(transaction)}`);
};

getEvents();

