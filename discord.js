/* Libraries */
const Discord = require("discord.js");
const Async   = require('async');
const Search  = require('./lib/search');

// Discord Bot/Client user
const client = new Discord.Client();

// Config and settings
const config    = require("./config.json");
const settings  = require("./settings.json");

// Primary crypto refresh time (7 minutes)
// CMC data is refreshed ~5 minutes
const RefreshTime = (7 * 60 * 1000);


/*  Internal Methods */

let allowedChannels = [];
let setupChannelRestrictons = () => {
  if (settings.allowedChannels) {
    if (typeof settings.allowedChannels === 'string') {
      allowedChannels.push(settings.allowedChannels);
    }
    else {
      for (let channel of settings.allowedChannels) {
        allowedChannels.push(channel);
      }
    }

    console.log(`## Restricted usage to only: ${allowedChannels.join(',')}`);
  }
};

let isAllowedChannel = (channelName) => {
  if (!allowedChannels.length) return true;

  let regFind = new RegExp(`^${channelName}$`, 'i');
  for(let channel of allowedChannels) {
    if (regFind.test(channel) === true) {
      return true;
    }
  }

  return false;
};

let updateStatusID = null;
let updateStatus = (status) => {
  client.user.setPresence({ game: { name: status, type: 0 } });
};

let updateUsername = (nickname) => {
  client.user.setUsername(nickname)
  .then(() => {
    console.log('!! Username set');
  })
  .catch((err) => {
    console.log('!! Unable to set guild username');
    console.log(err.message);
  })
};

let updatePrice = () => {
  updateStatus('Pricebot Updating...');
  console.log('!! Updating Pricebot primaryCrypto...');

  Search.crypto(settings.primaryCrypto)
  .then((crypto) => {
    crypto = crypto[0];
    updateStatus(`${crypto.symbol} $${crypto.usd.toFixed(3)}`);
    console.log('!! Pricebot updated');

    setTimeout(() => {
      updatePrice();
    }, RefreshTime);
  })
  .catch((crypto) => {
    console.log(`!! ERR :: Could not fetch primary crypto '${settings.primaryCrypto}'`);
    updateStatus('Pricebot Active');
  });
};

let simpleVolume = (amount) => {
  amount = parseFloat(amount);

  if (amount < 1e3) {
    return amount;
  }
  else if (amount < 1e6) {
    return (amount / 1e3).toFixed(1) + ' K';
  }
  else if (amount < 1e9) {
    return (amount / 1e6).toFixed(1) + ' M';
  }
  else if (amount < 1e12) {
    return (amount / 1e9).toFixed(1) + ' B';
  }
};

let buildCryptoPost = (crypto) => {
  return `*#${crypto.rank}* - **${crypto.symbol} | ${crypto.name}** ` +
  `\`${crypto.btc} BTC\` / \`$${crypto.usd.toFixed(4)}\` ` +
  `|| Cap: \`$${simpleVolume(crypto.marketcap)}\` ` +
  `|| 24h Vol: \`$${simpleVolume(crypto.volume_usd)}\` ` +
  `|| 1h: \`${crypto.percent_change_1h}%\` ` +
  `|| 24h: \`${crypto.percent_change_24h}%\` ` +
  `|| 7d: \`${crypto.percent_change_7d}%\``;
};


/*  Internal Events */

// This event will run if the bot starts, and logs in, successfully.
client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  if (settings.primaryCrypto && settings.primaryCrypto.length) {
    updateUsername(`${settings.primaryCrypto} | Price Bot`);
  }
  updateStatus('Pricebot Loading...');

  setTimeout(() => {
    updatePrice();
  }, (10 * 1000));
});

// This event triggers when the bot joins a guild.
client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

// this event triggers when the bot is removed from a guild.
client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

// This event will run on every single message received, from any channel or DM.
client.on("message", async message => {

  // ignore other bot messages
  if(message.author.bot) return;

  // ignore messages not starting with prefix
  if(message.content.indexOf(config.prefix) !== 0) return;

  // ignore messages from unapproved channels
  if(!isAllowedChannel(message.channel.name)) return;

  // Here we separate the "command" and optional "arguments"
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === 'help') {
    message.channel.send(`*beep-boop* I am a **Bot**! I can grab the latest price and stats for a specified crypto-currency from CoinMarketCap. please type \`$symbol\` to query! *($btc)*`);
  }
  else if (command === '!empty') {
    return false;

    // Not good for production!!
    Search.empty()
    .then(() => {
      message.channel.send('Collection Emptied').then((Message) => {
        Message.react("🔥");
      });
    })
    .catch((err) => {
      message.channel.send('Collection had an error').then((Message) => {
        Message.react("💩");
      });
    });
  }
  else {
    let cryptoArr = [];
    cryptoArr.push(command);
    for (crypto of args) {
      if (crypto[0] === '$') {
        cryptoArr.push(crypto.substr(1));
      }
    }

    console.log(`## Price Request For -- ${cryptoArr.join(',')}`);

    Async.mapSeries(cryptoArr, (crypto, cb) => {
      Search.crypto(crypto)
      .then((results) => {

        let cryptoStatus = '';
        for (crypto of results) {
          cryptoStatus += `${buildCryptoPost(crypto)}\n`;
        }

        cb(null, cryptoStatus);
      })
      .catch((err) => {
        console.log('!! Error grabbing prices');

        let errMessage = err.message || err;
        cb(errMessage);
      })
    }, (err, results) => {

      if (err) {
        console.log(`## ERR :: Async Err`);
        console.log(err);

        if (err === 'Crypto not found') {
          message.channel.send('*beep-boop* I was unable to locate information about your requested crypto!');
        }
        else {
          message.channel.send(`*beep-boop* An error occurred while processing your request! -- ${err}`);
        }
      }
      else {
        let channelName = (message.channel.name) ? message.channel.name : '??';
        let guildName = (message.channel.parent.name) ? message.channel.parent.name : '??';

        console.log(`>> Positng result to ${guildName}::${channelName}`);
        try {
          console.log(JSON.stringify(results + '\n'));
        } catch (err) { }

        let reply = '';
        for (res of results) {
          reply += res;
        }
        message.channel.send(reply);
      }
    });
  }
});

client.login(config.token);
setupChannelRestrictons();
