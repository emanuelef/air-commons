const utils = require('./src/utils/utils');

exports.printMsg = () => {
  console.log('Test message');
};

exports.utils = utils;

console.log(utils.feetToMetres(34));
