const {_RouterFunction} = require("./commands.cjs")
class _FunctionABI {
    constructor(inputs, name, type) {
      this.inputs = inputs;
      this.name = name;
      this.type = type;
    }
  
    get_abi() {
      let result = {
        inputs: this.inputs,
        name: this.name,
        type: this.type
      };
      if (this.type === "tuple") {
        result.components = result.inputs;
        delete result.inputs;
      }
      return result;
    }
  
    get_full_abi() {
      return [this.get_abi()];
    }
  }
  
  class _FunctionDesc {
    constructor(fct_abi, selector) {
      this.fct_abi = fct_abi;
      this.selector = selector;
    }
  }
  const ABIMap = {_RouterFunction, _FunctionDesc}
  class _FunctionABIBuilder {
    constructor(fct_name, _type = "function") {
      this.abi = new _FunctionABI([], fct_name, _type);
    }
  
    add_address(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "address" });
      return this;
    }
  
    add_uint256(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "uint256" });
      return this;
    }
  
    add_int(arg_name) {
      return this.add_uint256(arg_name);
    }
  
    add_uint160(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "uint160" });
      return this;
    }
  
    add_uint48(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "uint48" });
      return this;
    }
  
    add_address_array(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "address[]" });
      return this;
    }
  
    add_bool(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "bool" });
      return this;
    }
  
    build() {
      return this.abi;
    }
  
    static create_struct(arg_name) {
      return new _FunctionABIBuilder(arg_name, "tuple");
    }
  
    add_struct(struct) {
      this.abi.inputs.push(struct.abi.get_abi());
      return this;
    }
  
    add_bytes(arg_name) {
      this.abi.inputs.push({ name: arg_name, type: "bytes" });
      return this;
    }
  }
  
  class _ABIBuilder {
    build_abi_map() {
      const abi_map = {
        [_RouterFunction.V3_SWAP_EXACT_IN]: this._add_mapping(this._build_v3_swap_exact_in),
        [_RouterFunction.V3_SWAP_EXACT_OUT]: this._add_mapping(this._build_v3_swap_exact_out),
        [_RouterFunction.V2_SWAP_EXACT_IN]: this._add_mapping(this._build_v2_swap_exact_in),
        [_RouterFunction.V2_SWAP_EXACT_OUT]: this._add_mapping(this._build_v2_swap_exact_out),
        [_RouterFunction.PERMIT2_PERMIT]: this._add_mapping(this._build_permit2_permit),
        [_RouterFunction.WRAP_ETH]: this._add_mapping(this._build_wrap_eth),
        [_RouterFunction.UNWRAP_WETH]: this._add_mapping(this._build_unwrap_weth),
        [_RouterFunction.SWEEP]: this._add_mapping(this._build_sweep),
        [_RouterFunction.PAY_PORTION]: this._add_mapping(this._build_pay_portion),
        [_RouterFunction.TRANSFER]: this._add_mapping(this._build_transfer)
      };
      return abi_map;
    }
  
    _add_mapping(build_abi_method) {
      const fct_abi = build_abi_method();
      const selector = function_abi_to_4byte_selector(fct_abi.get_abi());
      return new _FunctionDesc(fct_abi, selector);
    }
  
    _build_v2_swap_exact_in() {
      const builder = new _FunctionABIBuilder("V2_SWAP_EXACT_IN");
      builder
        .add_address("recipient")
        .add_int("amountIn")
        .add_int("amountOutMin")
        .add_address_array("path");
      return builder.add_bool("payerIsSender").build();
    }
  
    static _build_permit2_permit() {
        const builder = new _FunctionABIBuilder("PERMIT2_PERMIT");
        const inner_struct = builder.create_struct("details");
        inner_struct.add_address("token").add_uint160("amount").add_uint48("expiration").add_uint48("nonce");
        const outer_struct = builder.create_struct("struct");
        outer_struct.add_struct(inner_struct).add_address("spender").add_int("sigDeadline");
        return builder.add_struct(outer_struct).add_bytes("data").build();
    }
    
    static _build_unwrap_weth() {
        const builder = new _FunctionABIBuilder("UNWRAP_WETH");
        return builder.add_address("recipient").add_int("amountMin").build();
    }
    
    static _build_v3_swap_exact_in() {
        const builder = new _FunctionABIBuilder("V3_SWAP_EXACT_IN");
        builder.add_address("recipient").add_int("amountIn").add_int("amountOutMin").add_bytes("path");
        return builder.add_bool("payerIsSender").build();
    }
    
    static _build_wrap_eth() {
        const builder = new _FunctionABIBuilder("WRAP_ETH");
        return builder.add_address("recipient").add_int("amountMin").build();
    }
    
    static _build_v2_swap_exact_out() {
        const builder = new _FunctionABIBuilder("V2_SWAP_EXACT_OUT");
        builder.add_address("recipient").add_int("amountOut").add_int("amountInMax").add_address_array("path");
        return builder.add_bool("payerIsSender").build();
    }
    
    static _build_v3_swap_exact_out() {
        const builder = new _FunctionABIBuilder("V3_SWAP_EXACT_OUT");
        builder.add_address("recipient").add_int("amountOut").add_int("amountInMax").add_bytes("path");
        return builder.add_bool("payerIsSender").build();
    }
    
    static _build_sweep() {
        const builder = new _FunctionABIBuilder("SWEEP");
        return builder.add_address("token").add_address("recipient").add_int("amountMin").build();
    }
    
    static _build_pay_portion() {
        const builder = new _FunctionABIBuilder("PAY_PORTION");
        return builder.add_address("token").add_address("recipient").add_int("bips").build();
    }
    
    static _build_transfer() {
        const builder = new _FunctionABIBuilder("TRANSFER");
        return builder.add_address("token").add_address("recipient").add_uint256("value").build();
    }
}
 
module.exports={_ABIBuilder,ABIMap}