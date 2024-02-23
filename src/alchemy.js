// Installation: npm install alchemy-sdk
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";

const settings = {
  apiKey: "8u_Y-TzFMwVvoX5WDEFY5Eho7VFSUrJj", // Replace with your Alchemy API Key
  network: Network.ETH_GOERLI, // Replace with your network
};

const alchemy = new Alchemy(settings);

// Subscription for Alchemy's minedTransactions API
alchemy.ws.on(
    
  {
    method: AlchemySubscription.MINED_TRANSACTIONS,
    addresses: [
      {
        from: "0x6e0Ee480C539f7B78c8c3EE82DDEe4D48B26b1fd",
      },
    ],
    includeRemoved: false,
    hashesOnly: true,
  },
  (tx) => console.log(tx)
);