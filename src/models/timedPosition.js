const Position = require("./position");
const roundDec = require("../utils/utils").roundDec;

const INTERPOLATION_DISTANCE = 30;

module.exports = class TimedPosition extends Position {
  constructor(obj) {
    super(obj);
    this.timestamp = obj.timestamp;
  }

  static generateTimedLinearSubsamples(
    timedPositionA,
    timedPositionB,
    subSamples = 20
  ) {
    let subsamplesTimedPositions = [];

    let slopeLat = (timedPositionB.lat - timedPositionA.lat) / subSamples;
    let slopeLon = (timedPositionB.lon - timedPositionA.lon) / subSamples;
    let slopeAlt = (timedPositionB.alt - timedPositionA.alt) / subSamples;
    let slopeTimestamp =
      (timedPositionB.timestamp - timedPositionA.timestamp) / subSamples;

    for (let i in [...Array(subSamples).keys()]) {
      let currVal = Number(i);

      let tpos = new TimedPosition({
        lat: roundDec(timedPositionA.lat + slopeLat * currVal, 7),
        lon: roundDec(timedPositionA.lon + slopeLon * currVal, 7),
        alt: Math.round(timedPositionA.alt + slopeAlt * currVal),
        timestamp: Math.round(
          timedPositionA.timestamp + slopeTimestamp * currVal
        )
      });

      subsamplesTimedPositions.push(tpos);
    }

    subsamplesTimedPositions.push(timedPositionB);

    return subsamplesTimedPositions;
  }

  static getMinimumDistanceToPosition(timedPositions, position) {
    let minDistance = Infinity;
    let minDistanceAccurate = Infinity;
    let minDTimestamp = 0;
    let minDAltitude = 0;
    let minDLat = 0;
    let minDLon = 0;

    timedPositions.forEach((timedPos, index, arr) => {
      if (index > 0) {
        let subs = TimedPosition.generateTimedLinearSubsamples(
          arr[index - 1],
          arr[index]
        );
        let distanceAccurate = position.minDistanceToLine3D(
          arr[index - 1],
          arr[index]
        );
        for (let subsample of subs) {
          let distance = subsample.distance3DFrom(position);
          if (distance < minDistance) {
            minDistance = distance;
            minDistanceAccurate = distanceAccurate;
            minDTimestamp = subsample.timestamp;
            minDAltitude = subsample.alt;
            minDLat = subsample.lat;
            minDLon = subsample.lon;
          }
        }
      }
    });

    return {
      minDistance,
      minDistanceAccurate,
      minDTimestamp,
      minDAltitude,
      minDLat,
      minDLon
    };
  }

  static getSubsampledPositions(
    timedPositions,
    distanceBetweenSamples = INTERPOLATION_DISTANCE
  ) {
    let allPoints = [];
    timedPositions.forEach((_, index, arr) => {
      if (index > 0) {
        // evenly distribute point based on distance
        let distance = arr[index - 1].distance3DFrom(arr[index]);
        let numPoints = Math.ceil(distance / distanceBetweenSamples);
        let subs = TimedPosition.generateTimedLinearSubsamples(
          arr[index - 1],
          arr[index],
          numPoints
        );

        if (subs.length > 0 && index !== arr.length - 1) {
          subs.pop(); // remove last element that will be the first in next iteration
        }

        allPoints = [...allPoints, ...subs];
      }
    });
    return allPoints;
  }
};
