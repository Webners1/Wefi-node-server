const { pack, } = require('@ethersproject/solidity');

/**
 * Converts a route to a hex encoded path
 * @param route the v3 path to convert to an encoded path
 * @param exactOutput whether the route should be encoded in reverse, for making exact output swaps
 */
function encodeRouteToPath(route, exactOutput) {
  const firstInputToken = route.input.wrapped;

  const { path, types } = route.pools.reduce(
    ({ inputToken, path, types }, pool, index) => {
      const outputToken = pool.token0.equals(inputToken) ? pool.token1 : pool.token0;
      if (index === 0) {
        return {
          inputToken: outputToken,
          types: ['address', 'uint24', 'address'],
          path: [inputToken.address, pool.fee, outputToken.address],
        };
      } else {
        return {
          inputToken: outputToken,
          types: [...types, 'uint24', 'address'],
          path: [...path, pool.fee, outputToken.address],
        };
      }
    },
    { inputToken: firstInputToken, path: [], types: [] }
  );

  return exactOutput ? pack(types.reverse(), path.reverse()) : pack(types, path);
}
function decodeRouteFromPath(encodedPath, exactOutput) {
 if(exactOutput){

 }

  return { types, path, pools };
}
module.exports = {
  encodeRouteToPath,decodeRouteFromPath
};