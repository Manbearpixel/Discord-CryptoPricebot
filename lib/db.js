/* Libraries */
const Mongoose  = require('mongoose');
const Settings  = require("../settings.json");

// Get the default connection
let db      = Mongoose.connection;
let mongoDB = `mongodb://127.0.0.1/${Settings.dbName}`;

Mongoose.connect(mongoDB, {
  useMongoClient: true
});

// Get Mongoose to use the global promise library
Mongoose.Promise = global.Promise;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error'));

//Bind connection to error event (to get notification of connection errors)
db.on('open', console.log.bind(console, 'MongoDB connection success'));

module.exports = db;
