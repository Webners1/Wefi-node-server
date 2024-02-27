const Web3 = require('web3');
const contractAbi = require('./contract_abi.json'); // Replace with your contract's ABI
const contractAddress = '0x123456789abcdef'; // Replace with your contract's address

// Connect to a web3 provider
const web3 = new Web3('http://localhost:8545');

// Create a contract instance
const contract = new web3.eth.Contract(contractAbi, contractAddress);

// Set your account address and private key
const accountAddress = '0xabcdef123456789'; // Replace with your account's address
const privateKey = 'your_private_key'; // Replace with your account's private key

async function execTransaction(to, data) {
  try {
    const txObject = contract.methods.execTransaction(to, data);

    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await txObject.estimateGas({ from: accountAddress, gasPrice });

    const txParams = {
      from: accountAddress,
      to: contractAddress,
      data: txObject.encodeABI(),
      gas: gasEstimate,
      gasPrice,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txParams, privateKey);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction successful!');
    console.log('Receipt:', receipt);

    return true;
  } catch (error) {
    console.error('Transaction failed:', error);
    return false;
  }
}

// Example usage:
execTransaction('0x123456789abcdef', '0x123456789abcdef');