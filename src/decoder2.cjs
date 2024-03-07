
const { _RouterConstant, _RouterFunction } = require('./commands.cjs');

const {Web3} = require('web3');
const {ethers} = require('ethers');
const { chain } = require('lodash');
const  _routerAbi = require('./UniversalRouter.json');
// const uniswapV3UniversalAddress = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';

const _ABIMap = require('./function.cjs'); // Assuming you have the _abi_builder module

const { toChecksumAddress } = require('web3-utils');



class Decoder {
  constructor(w3 = Web3, abiMap = _ABIMap) {
    this._w3 = w3;
    this._routerContract = new ethers.utils.Interface(_routerAbi);
    this._abiMap = abiMap;
  }

  async functionInput(inputData) {
    console.log(inputData)
    const { name: fctName, inputs: decodedInput } = this._routerContract.parseTransaction({data:inputData});
   console.log(decodedInput)
    const command = decodedInput?.commands;
    const commandInput = decodedInput?.inputs;
    const decodedCommandInput = [];
    for (let i = 0; i < command.length; i++) {
      const commandFunction = command[i] & _RouterConstant.COMMAND_TYPE_MASK;
      try {
        const abiMapping = this._abiMap[_RouterFunction[commandFunction]];
        const data = abiMapping.selector + commandInput[i];
        const subContract = new ethers.utils.Interface(abiMapping.fctAbi.getFullAbi());
        const revertOnFail = !(command[i] & _RouterConstant.FLAG_ALLOW_REVERT);
        decodedCommandInput.push(
          await subContract.parseTransaction({data}).concat([{ revertOnFail }])
        );
      } catch (error) {
        decodedCommandInput.push(commandInput[i].toString('hex'));
      }
    }
    decodedInput.inputs = decodedCommandInput;
    return [fctName, decodedInput];
  }

  async transaction(trxHash) {
    const trx = await this._getTransaction(trxHash);
    const [fctName, decodedInput] = this.functionInput(trx.input);
    const resultTrx = { ...trx };
    resultTrx.decodedInput = decodedInput;
    return resultTrx;
  }

  _getTransaction(trxHash) {
    return this._w3.eth.getTransaction(trxHash);
  }

  static v3Path(v3FnName, path) {
    const validFnNames = ['V3_SWAP_EXACT_IN', 'V3_SWAP_EXACT_OUT'];
    if (!validFnNames.includes(v3FnName.toUpperCase())) {
      throw new Error(`v3FnName must be one of ${validFnNames}`);
    }
    let pathStr = path;
    if (path instanceof Buffer) {
      pathStr = path.toString('hex');
    }
    pathStr = pathStr.startsWith('0x') ? pathStr.slice(2) : pathStr;
    const pathList = [pathStr.slice(0, 40)];
    const parsedRemainingPath = chain(pathStr.slice(40))
      .chunk(46)
      .map((chunk) => [
        parseInt(chunk.slice(0, 6), 16),
        this._w3.utils.toChecksumAddress(chunk.slice(6, 46))
      ])
      .value();
    pathList.push(...chain(parsedRemainingPath).flatten().value());

    if (v3FnName.toUpperCase() === 'V3_SWAP_EXACT_OUT') {
      pathList.reverse();
    }

    return pathList;
  }
}
async function main(){

  // Usage example
  const w3 = new Web3('https://goerli.infura.io/v3/1f08eb6050734553aadea8b5ffebc6a1');
  const decoder = new Decoder(w3);
  
  const inputData = '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000065e9de98000000000000000000000000000000000000000000000000000000000000000308000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000002a303fe4b53000000000000000000000000000000000000000000000000009f6a35e74aec3dbc2800000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000dd69db25f6d620a7bad3023c5d32761d353d3de9000000000000000000000000b4fbf271143f4fbf7b91a5ded31805e42b2208d600000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002386f26fc100000000000000000000000000000000000000000000000000085d1857fbbe37816d00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002bdd69db25f6d620a7bad3023c5d32761d353d3de9000bb8b4fbf271143f4fbf7b91a5ded31805e42b2208d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000a7c74e3f46aa753d95'; // Input data to decode
  const [fctName, decodedInput] = await decoder.functionInput(inputData);
  console.log('Function Name:', fctName);
  console.log('Decoded Input:', decodedInput);
  
}
main()