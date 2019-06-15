const Position = require("./position");

module.exports = class TimedPosition extends Position {
  constructor(obj) {
    super(obj);
    this.timestamp = obj.timestamp;
  }

  // http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
  static minDistancePointLine(timedPositionA, timedPositionB, fromPosition) {
    let tA = new TimedPosition({
      lat: 51.464996,
      lon: -0.410725,
      alt: 410,
      timestamp: 1530192001
    });
    return this.euclideanDistance(7, 5);
  }
};
