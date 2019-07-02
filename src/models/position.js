const {
  feetToMetres,
  metresToFeet,
  euclideanDistance,
  distFrom
} = require("../utils/utils");

module.exports = class Position {
  constructor(obj) {
    this.lat = obj.lat;
    this.lon = obj.lon;
    this.alt = obj.alt; // Altitude in metres
  }

  distance3DFrom(position) {
    return Position.distance3D(this, position);
  }

  minDistanceToLine3D(startPosition, endPosition) {
    return Position.minDistancePointToLine3D(startPosition, endPosition, this);
  }

  static distance3D(posA, posB) {
    const distance2D = distFrom(
      {
        latitude: posA.lat,
        longitude: posA.lon
      },
      {
        latitude: posB.lat,
        longitude: posB.lon
      }
    );

    return euclideanDistance(distance2D, posA.alt - posB.alt);
  }

  // http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
  static minDistancePointToLine3D(startPosition, endPosition, posA) {
    const AB = startPosition.distance3DFrom(endPosition);
    const BC = endPosition.distance3DFrom(posA);
    const AC = posA.distance3DFrom(startPosition);

    const p = (AB + BC + AC) / 2; // half-perimeter
    const Area = Math.sqrt(p * (p - AB) * (p - BC) * (p - AC)); // Heron's formula

    return (2 * Area) / AB;
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
};
