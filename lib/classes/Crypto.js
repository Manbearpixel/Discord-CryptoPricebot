/* Libraries */
const CMC = require('../cmc.js');

class CryptoClass {
  /* Properties */
  get info() {
    return `${this.coin_id}:${this.name}:${this.symbol}`;
  }

  /* Static Methods */
  static findBySymbol(symbol) {
    let regFind = new RegExp(`^${symbol}$`, 'i');
    return this.find({ 'symbol': regFind });
  }

  /* Class Methods */
  getInfo() {
    return `2${this.coin_id}:${this.name}:${this.symbol}`;
  }

  update() {
    return new Promise((resolve, reject) => {

      CMC.fetchCrypto(this.coin_id)
      .then((data) => {
        this.setCMCData(data)
        .then((updatedCrypto) => {
          resolve(updatedCrypto);
        })
        .catch((err) => {
          console.log(`!! Error updating crypto: ${this.coin_id}`);
          console.log(err);
          reject(err);
        })
      });
    });
  }

  setCMCData(cmcData) {
    console.log('...setCMCData');
    return new Promise((resolve, reject) => {

      let change1h  = parseFloat(cmcData.percent_change_1h)   || null;
      let change24h = parseFloat(cmcData.percent_change_24h)  || null;
      let change7d  = parseFloat(cmcData.percent_change_7d)   || null;

      let volumeUSD       = parseFloat(cmcData['24h_volume_usd']) || null;
      let marketcap       = Number(cmcData.market_cap_usd) || null;
      let totalSupply     = parseFloat(cmcData.total_supply) || null;
      let availableSupply = parseFloat(cmcData.available_supply) || null;

      this.coin_id              = cmcData.id;
      this.name                 = cmcData.name;
      this.symbol               = cmcData.symbol;
      this.usd                  = cmcData.price_usd;
      this.btc                  = cmcData.price_btc;
      this.rank                 = Number(cmcData.rank);
      this.volume_usd           = volumeUSD;
      this.marketcap            = marketcap;
      this.available_supply     = availableSupply;
      this.total_supply         = totalSupply;
      this.percent_change_1h    = change1h;
      this.percent_change_24h   = change24h;
      this.percent_change_7d    = change7d;
      this.last_updated         = Number(cmcData.last_updated);

      this.save((err) => {
        if (err) {
          console.log(`!! Error saving CMC data for crypto: ${this.coin_id}`);
          console.log(err);
          reject(err);
        }
        else {
          console.log(`CMC data saved for crypto: ${this.coin_id}`);
          resolve(this);
        }
      });
    });
  }
}

module.exports = CryptoClass;
