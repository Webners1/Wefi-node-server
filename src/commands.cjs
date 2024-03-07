// import { toChecksumAddress } from "ethereumjs-util";
const { toChecksumAddress } = require('web3-utils');

const _RouterFunction = {
    V3_SWAP_EXACT_IN: 0,
    V3_SWAP_EXACT_OUT: 1,
    SWEEP: 4,
    TRANSFER: 5,
    PAY_PORTION: 6,
    V2_SWAP_EXACT_IN: 8,
    V2_SWAP_EXACT_OUT: 9,
    PERMIT2_PERMIT: 10,
    WRAP_ETH: 11,
    UNWRAP_WETH: 12
};

const _FunctionRecipient = {
    SENDER: "recipient is transaction sender",
    ROUTER: "recipient is universal router",
    CUSTOM: "recipient is custom"
};

const _RouterConstant = {
    MSG_SENDER: toChecksumAddress("0x0000000000000000000000000000000000000001"),
    ADDRESS_THIS: toChecksumAddress("0x0000000000000000000000000000000000000002"),
    ROUTER_BALANCE: "0x" + (BigInt(2) ** BigInt(255)).toString(16),
    FLAG_ALLOW_REVERT: 0x80,
    COMMAND_TYPE_MASK: 0x3f
};

module.exports={_RouterConstant,_RouterFunction,_FunctionRecipient}