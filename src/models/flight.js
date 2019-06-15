const TimedPosition = require("./timedPosition");
const roundDec = require("../utils/utils").roundDec;

const MIN_DISTANCE = 10; // min distance to avoid storing same position
const INTERPOLATION_DISTANCE = 30;

module.exports = class Flight {
  constructor(obj) {
    this.icao = obj.icao;
    this.op = obj.op;
    this.model = obj.model;
    this.wakeTurbulence = obj.wakeTurbulence;
    this.from = obj.from;
    this.to = obj.to;
    this.timedPositions = [];
    this.flyingAtCreation = obj.flying;
    this.speedAtCreation = obj.speed;
    this.verticalSpeedAtCreation = obj.verticalSpeed;
  }

  addTimedPosition(timedPosition) {
    let lastPosition = this.getLastTimedPosition();
    if (lastPosition && timedPosition.distance3DFrom(lastPosition) < MIN_DISTANCE) {
      // could be API returned same position on different call (not updated)
      return;
    }
    this.timedPositions.push(timedPosition);
  }

  getFirstTimedPosition() {
    return this.timedPositions.length ? this.timedPositions[0] : null;
  }

  getLastTimedPosition() {
    return this.timedPositions.length
      ? this.timedPositions[this.timedPositions.length - 1]
      : null;
  }

  static generateLinearSubsamples(
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

  getMinimumDistanceToPosition(position) {
    let minDistance = Infinity;
    let minDistanceAccurate = Infinity;
    let minDTimestamp = 0;
    let minDAltitude = 0;
    let minDLat = 0;
    let minDLon = 0;

    this.timedPositions.forEach((timedPos, index, arr) => {
      if (index > 0) {
        let subs = Flight.generateLinearSubsamples(arr[index - 1], arr[index]);
        let distanceAccurate = position.minDistanceToLine3D(arr[index - 1], arr[index]);
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

    if (minDistance == Infinity) {
      minDistance = 0;
      minDistanceAccurate = 0;
    }

    return { minDistance, minDistanceAccurate, minDTimestamp, minDAltitude, minDLat, minDLon };
  }

  getSummary(position) {
    let summary = {};
    if (this.timedPositions.length > 0) {
      summary.icao = this.icao;
      summary.op = this.op;
      summary.samples = this.timedPositions.length;

      summary.startTime = this.timedPositions[0].timestamp;
      summary.startLat = this.timedPositions[0].lat;
      summary.startLon = this.timedPositions[0].lon;
      summary.startAltitude = this.timedPositions[0].alt;
      summary.flyingAtCreation = this.flyingAtCreation;
      summary.speedAtCreation = this.speedAtCreation;
      summary.verticalSpeedAtCreation = this.verticalSpeedAtCreation;

      summary.wakeTurbulence = this.wakeTurbulence;

      summary.from = this.from;
      summary.to = this.to;

      summary = {
        ...summary,
        ...this.getMinimumDistanceToPosition(position)
      };
      summary.timeMinDistanceFromStart =
        summary.minDTimestamp - summary.startTime;

      const lastEl = this.timedPositions[this.timedPositions.length - 1];
      summary.endTimeFromStart = lastEl.timestamp - summary.startTime;
      summary.endLat = lastEl.lat;
      summary.endLon = lastEl.lon;
      summary.endAltitude = lastEl.alt;
      summary.diffAltitude = summary.endAltitude - summary.startAltitude;
    }

    return summary;
  }

  getSubsampledPositions() {
    let allPoints = [];
    this.timedPositions.forEach((timedPos, index, arr) => {
      if (index > 0) {
        // evenly distribute point based on distance
        let distance = arr[index - 1].distance3DFrom(arr[index]);
        let numPoints =  Math.ceil(distance / INTERPOLATION_DISTANCE);
        let subs = Flight.generateLinearSubsamples(arr[index - 1], arr[index], numPoints);
        allPoints = [...allPoints, ...subs];
      }
    });
    return allPoints;
  }
};
