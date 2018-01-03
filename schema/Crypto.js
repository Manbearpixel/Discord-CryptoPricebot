const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const CryptoClass = require('../classes/Crypto');

let cryptoSchema  = {
  coin_id: {
    type:     String,
    unique:   true,
    required: true,
    index:    true
  },

  name: {
    type:     String,
    required: true,
    index:    true
  },

  symbol: {
    type:     String,
    required: true,
    index:    true
  },

  usd:  Number,
  btc:  Number,
  rank: Number,

  marketcap: Number,
  available_supply: Number,
  total_supply: Number,

  percent_change_1h:  Number,
  percent_change_24h: Number,
  percent_change_7d:  Number,

  last_updated: Number
};

const CryptoSchema = new Schema(cryptoSchema);
CryptoSchema.loadClass(CryptoClass);

module.exports = mongoose.model('Crypto', CryptoSchema);
