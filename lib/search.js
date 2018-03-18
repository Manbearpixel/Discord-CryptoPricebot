/* Libraries */
const Moment    = require('moment');
const async     = require('async');
const Crypto    = require('./schema/Crypto');
const CMC       = require('./cmc');
const db        = require('./db');

const MaxFresh  = 6;

/* Internal Methods */
let updateLocalStorage = (cryptos) => {
  let startUpdateTime = new Date();

  console.log('## Update Local Storage');
  return new Promise((resolve, reject) => {

    async.everySeries(cryptos, (currency, cb) => {
      console.log(`\nImport Check -- ${currency.id} ...`);

      Crypto.findOne({ 'coin_id': currency.id })
      .exec((err, crypto) => {
        if (err) {
          console.log(`!! Find Error -- ${currency.id}`);
          console.log(err);
          return cb(null, false);
        }

        if (crypto) {
          console.log(`## ${currency.id} found`);
          cb(null, true);
        }
        else {
          console.log(`## ${currency.id} not found, save to DB`);

          crypto = new Crypto();
          crypto.setCMCData(currency)
          .then(() => {
            cb(null, true);
          })
          .catch((err) => {
            return cb(null, false);
          });
        }
      });

    }, (err) => {
      if (err) {
        console.log(`!! Sync Error`);
        console.log(err);
        reject(`SYNC ERROR -- ${err}`);
      }

      let endUpdateTime = new Date() - startUpdateTime;
      console.log("fn:updateLocalStorage Execution time: %dms ...\n\n", endUpdateTime);
      resolve(cryptos);
    });
  });
};



/* Exposed Methods */

let empty = () => {
  console.log('## Empty Local Storage');
  return new Promise((resolve, reject) => {
    Crypto.remove({}, function(err) {
      if (err) {
        console.log(`!! Empty Error`);
        console.log(err);
        return reject(err);
      }

      console.log('## Local Storage Emptied...');
      resolve();
    });
  });
};

let search = (symbol) => {
  console.log(`## Search :: ${symbol}`);
  return new Promise((resolve, reject) => {

    Crypto.findBySymbol(symbol)
    .exec((err, cryptos) => {
      if (err) {
        console.log(`!! Find Error -- ${symbol.id}`);
        console.log(err);
        return reject('Connection Error');
      }

      if (!cryptos || !cryptos.length) {
        CMC.fetchAll()
        .then((currencies)=> {

          updateLocalStorage(currencies)
          .then((cryptos) => {
            Crypto.findBySymbol(symbol)
            .exec((err, cryptos) => {
              if (err) {
                console.log(`## ERR :: Bad Find (${symbol.id})`);
                console.log(err);
                return reject('Connection Error');
              }

              if (!cryptos || !cryptos.length) {
                return reject('Crypto not found');
              }
              else {
                return resolve(cryptos);
              }
            });
          })
        });
      }
      else {
        async.mapSeries(cryptos, (crypto, cb) => {
          let dateNow     = Moment().utc();
          let lastUpdate  = Moment.utc( (crypto.last_updated * 1000) );
          let mjsDuration = Moment.duration(dateNow.diff(lastUpdate));

          // console.log(`dateNow -- ${dateNow}`);
          // console.log(`lastUpdate -- ${lastUpdate}`);
          console.log(`Crypto Last Pull -- ${mjsDuration.asMinutes()} -- ${crypto.coin_id}`);

          if (mjsDuration.asMinutes() >= MaxFresh) {
            console.log('!! Crypto Refresh');

            crypto.update()
            .then((updatedCrypto) => {
              cb(null, updatedCrypto);
            })
            .catch((err) => {
              let _err = (err.message) ? err.message : err;
              console.log(`## ERR :: Bad Update (${crypto.coin_id})`);
              console.log(_err);
              cb(null, false);
            });
          }
          else {
            cb(null, crypto);
          }
        }, (err, results) => {
          if (err) {
            return reject('Sync Error');
          }
          return resolve(results);
        });
      }
    });
  });
};

module.exports = {
  crypto: search,
  empty: empty
};
