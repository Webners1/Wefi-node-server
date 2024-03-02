const { CommandType, RoutePlanner } = require('./commandType.cjs');

const { Web3 } = require('web3');
const ethers = require('ethers');
const {
  abi: PoolLogicAbi_ABI,
} = require('../contracts/PoolLogic.sol/PoolLogic.json'); // Replace with your contract's ABI
const {
  abi: PoolManagerLogic_ABI,
} = require('../contracts/PoolManagerLogic.sol/PoolManagerLogic.json'); // Replace with your contract's ABI
const {
  abi: PoolLogic_ABI,
} = require('../contracts/PoolLogic.sol/PoolLogic.json'); // Replace with your contract's ABI
const {
  abi: PoolFactory_ABI,
} = require('../contracts/PoolFactory.sol/PoolFactory.json'); // Replace with your contract's ABI
const UniswapRouterV3_ABI = require('./uniswapV3.json'); // Replace with your contract's ABI
const UniswapRouterV2_ABI = require('./uniswapV2.json'); // Replace with your contract's ABI
const Universal_ABI = require('./UniversalRouter.json'); // Replace with your contract's ABI
const {
  abi: WETH_ABI,
} = require('../contracts/interfaces/IWETH.sol/IWETH.json'); // Replace with your contract's ABI
const { arrayify } = require('ethers/lib/utils');

// Connect to a web3 provider
const web3 = new Web3('https://ethereum-goerli-rpc.publicnode.com');
const PoolManagerLogic_address =
  '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const PoolLogic_address =
  '0x10f11aA5C924C8D1384CC5bE5E695322C21aEb49';
const V2Router = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const V3Router = '0xe592427a0aece92de3edee1f18e0157c05861564';
const UNIVERSALRouter = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
// Create a contract instance
const PoolManagerLogic = new web3.eth.Contract(
  PoolManagerLogic_ABI,
  PoolManagerLogic_address,
);
const PoolLogic = new web3.eth.Contract(
  PoolLogicAbi_ABI,
  PoolLogic_address,
);

const V2Logic = new web3.eth.Contract(UniswapRouterV2_ABI, V2Router);
let swapABI;
let isUniversal = true;
let isV2;
let name;
let value;

// Set your account address and private key
const accountAddress = '0x7a491dA575A00b14A88DC4B9914E0c2323A1eFd3'; // Replace with your account's address
const privateKey =
  '0xa204996d053cf1e9abb3bd6001158a91e736c3fce1ab278765f676fce0c07f23'; // Replace with your account's private key

function functionNameToNumericCommandType(functionName) {
  // Remove the leading "V3_" from the function name

  // Convert the command type name to PascalCase
  // const pascalCaseCommandType = functionName.replace(/_[a-z]/g, (match) => match.slice(1).toUpperCase());

  // Get the numeric value of the command type
  const numericCommandType = CommandType[functionName].valueOf();

  return Number('0x0' + numericCommandType.toString(16));
}
function convertBigNumbersToNumbers(array) {
  return array.map((item) => {
    if (item instanceof ethers.BigNumber) {
      return Number(item).toString();
    } else {
      return item;
    }
  });
}

function deconstructTransactionDescription(txDescription) {
  let {
    args,
    functionFragment,
    name,
    value,
    inputs: realinput,
    signature,
  } = txDescription;

  const v2FunctionNames = [
    'swapExactTokensForTokens',
    'swapTokensForExactTokens',
    'swapExactETHForTokens',
    'swapTokensForExactETH',
    'swapExactTokensForETH',
    'swapETHForExactTokens',
  ];

  const v3FunctionNames = [
    'exactInput',
    'exactInputSingle',
    'exactOutput',
    'exactOutputSingle',
    'multicall',
  ];
  const inputs = args;

  const outputs = [];
  for (const output of functionFragment.outputs) {
    outputs.push({
      name: output.name,
      type: output.type,
    });
  }

  const functionName = name;

  if (v2FunctionNames.includes(functionName)) {
    isV2 = true;
  } else if (v3FunctionNames.includes(functionName)) {
    isV2 = false;
  } else {
    throw new Error(`Unknown function name: ${functionName}`);
  }
  value = value?.toNumber().toString();
  return {
    name,
    inputs,
    value,
  };
}

function modifyAndConvertInput(input) {
  // Get the keys of the input object
  const keys = Object.keys(input);

  // Iterate over the keys and modify the variables
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = input[key];

    if (typeof value === 'string') {
      input[key] = value.toLowerCase();
    } else if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        if (typeof value[j] === 'string') {
          value[j] = value[j].toLowerCase();
        } else if (
          typeof value[j] === 'object' &&
          value[j]._isBigNumber
        ) {
          value[j] = value[j].toString();
        }
      }
    } else if (typeof value === 'object' && value._isBigNumber) {
      input[key] = value.toString();
    }
  }

  // Convert the input into an array
  const inputArray = Object.values(input);

  return inputArray;
}
async function execTransaction(isUniversal, isV2, data) {
  const to =
    isV2 && !isUniversal
      ? V2Router
      : !isV2 && !isUniversal
      ? V3Router
      : UNIVERSALRouter;

  if (!isUniversal) {
    let {
      name: functionName,
      inputs,
      value: val,
    } = deconstructTransactionDescription(data);
    name = functionName;
value = val
    const necessaryKeys = Object.keys(inputs).filter(
      (key) => typeof key !== 'string',
    );
    const necessaryValues = isV2
      ? necessaryKeys.map((key) => inputs[key]) // Remove last 8 elements to get only the params array
      : inputs[0];
    const InputObject = isV2
      ? Object.assign({}, ...necessaryValues, {
          amountOutMin: '0',
          path: inputs['1'],
          to: accountAddress,
          deadline: (
            Math.floor(Date.now() / 1000) +
            60 * 3
          ).toString(),
        })
      : necessaryValues.filter(
          (item) => typeof item !== 'object' || item._isBigNumber,
        );

    inputArray = Object.values(InputObject);
    inputArray = convertBigNumbersToNumbers(inputArray);
    console.log(inputArray);
  } else {
    const {
      function: functionName,
      recipient,
      amountIn,
      path,
      payerIsUser,
    } = data;
    let planner = new RoutePlanner();
    
    const arrayData = [
      accountAddress,
      amountIn,
      "1",
    path,
      payerIsUser,
    ]
    planner.addCommand(functionNameToNumericCommandType(functionName), arrayData);
    const { commands, inputs } = planner;
    deadline = Math.floor(Date.now() / 1000) + 60 * 3;
    inputArray = [commands, inputs, deadline];

    name = 'execute';
  }
  const iUniswapRouter =
    isV2 && !isUniversal
      ? new ethers.utils.Interface(UniswapRouterV2_ABI)
      : !isV2 && !isUniversal
      ? new ethers.utils.Interface(UniswapRouterV3_ABI)
      : new ethers.utils.Interface(Universal_ABI);
  console.log(name, [inputArray]);

  swapABI = iUniswapRouter.encodeFunctionData(name, inputArray);
  const txObject = PoolLogic.methods.execTransaction(to, swapABI);

  const gasPrice = await web3.eth.getGasPrice();
  // const gasEstimate = await txObject.estimateGas({
  //   gasPrice,
  // });
  const txParams = {
    from: accountAddress,
    to: PoolLogic_address,
    data: txObject.encodeABI(),
    // gas: gasEstimate,
    gasPrice: gasPrice,
    value: value,
  };

  const signedTx = await web3.eth.accounts.signTransaction(
    txParams,
    privateKey,
  );

  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
  );
  console.log('Transaction successful!');
  // console.log('Receipt:', receipt);

  return true;
}

// Example usage:
module.exports = { execTransaction };
