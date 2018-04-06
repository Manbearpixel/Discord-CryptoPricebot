/* Libraries */
const Request   = require('request');
const CMCAPI    = 'https://api.coinmarketcap.com/v1/ticker';

// GET request for Coinmarketcap API price info
let cmcCoinDetails = (coin_id) => {
  let _opts = {
    url:            `${CMCAPI}/${coin_id}`,
    method:         "GET",
    timeout:        10000, // 10 second timeout
    followRedirect: true
  };

  return new Promise((resolve, reject) => {
    Request(_opts, (err, res, body) => {
      if(!err && res.statusCode == 200) {
        body = JSON.parse(body);

        // return first (only) entry object
        resolve(body[0]);
      }
      else {
        reject(`FN:cmcCoinDetails Rejected; ${err}`);
      }
    }).on('error', (e) => {
      console.log('Explicit Request Error', e);
      reject(`FN:cmcCoinDetails Rejected; ${e}`);
    }).end();
  });
};

// GET request for entire stored market on Coinmarketcap
let cmcImportMarket = () => {
  let _opts = {
    url:            `${CMCAPI}/?limit=0`,
    method:         "GET",
    timeout:        10000, // 10 second timeout
    followRedirect: true
  };

  return new Promise((resolve, reject) => {
    Request(_opts, (err, res, body) => {
      if(!err && res.statusCode == 200) {
        body = JSON.parse(body);

        // return first (only) entry object
        resolve(body);
      }
      else {
        reject(`FN:cmcImportMarket Rejected; ${err}`);
      }
    }).on('error', (e) => {
      console.log('Explicit Request Error', e);
      reject(`FN:cmcImportMarket Rejected; ${err}`);
    }).end();
  });
};

module.exports = {
  fetchCrypto: cmcCoinDetails,
  fetchAll: cmcImportMarket
};
