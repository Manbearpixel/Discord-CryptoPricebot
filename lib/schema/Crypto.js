/* Libraries */
const Mongoose    = require('mongoose');
const Schema      = Mongoose.Schema;
const CryptoClass = require('../classes/Crypto');

/* Mongoose (MongoDB) Model Schema */
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

  marketcap:        Number,
  volume_usd:       Number,
  total_supply:     Number,
  available_supply: Number,

  percent_change_1h:  Number,
  percent_change_24h: Number,
  percent_change_7d:  Number,

  last_updated: Number
};

// Load the CryptoClass into the Mongoose Model
const CryptoSchema = new Schema(cryptoSchema);
CryptoSchema.loadClass(CryptoClass);

module.exports = Mongoose.model('Crypto', CryptoSchema);
