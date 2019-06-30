const Position = require("./position");

module.exports = class TimedPosition extends Position {
  constructor(obj) {
    super(obj);
    this.timestamp = obj.timestamp;
  }
};
