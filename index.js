const utils = require('./src/utils/utils');
const Flight = require('./src/models/flight');
const Position = require('./src/models/position');
const TimedPosition = require('./src/models/timedPosition');
const mysql = require('./src/db/mysql');

exports.printMsg = () => {
  console.log('Test message');
};


exports.utils = utils;
exports.Flight = Flight;
exports.Position = Position;
exports.TimedPosition = TimedPosition;
exports.mysql = mysql;
