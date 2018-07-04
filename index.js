const utils = require('./src/utils/utils');
const Flight = require('./src/models/flight');
const Position = require('./src/models/position');
const TimedPosition = require('./src/models/timedPosition');

exports.printMsg = () => {
  console.log('Test message');
};

exports.utils = utils;
exports.Flight = Flight;
exports.Position = Position;
exports.TimedPosition = TimedPosition;
