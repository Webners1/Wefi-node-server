import mongoose from 'mongoose';

const traderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wallet_address: { type: String, required: true },
  vault_address: { type: String, required: true },
});

export const Trader = mongoose.model('Trader', traderSchema);
