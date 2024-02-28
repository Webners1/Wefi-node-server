import joi from 'joi';
import { isAddress } from 'web3-validator';

const traderSchema = joi.object().keys({
  name: joi.string().required(),
  wallet_address: joi
    .string()
    .required()
    .custom((value, helper) => {
      if (!isAddress(value)) {
        return helper.message('`wallet_address` is not valid');
      } else {
        return true;
      }
    }),
  vault_address: joi
    .string()
    .required()
    .custom((value, helper) => {
      if (!isAddress(value)) {
        return helper.message('`vault_address` is not valid');
      } else {
        return true;
      }
    }),
});

export { traderSchema };
