const TimedPosition = require("./timedPosition");

const MIN_DISTANCE = 10; // min distance to avoid storing same position

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
    if (
      lastPosition &&
      timedPosition.distance3DFrom(lastPosition) < MIN_DISTANCE
    ) {
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

  getMinimumDistanceToPosition(position) {
    return TimedPosition.getMinimumDistanceToPosition(
      this.timedPositions,
      position
    );
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

  getSubsampledPositions(distanceBetweenSamples) {
    return TimedPosition.getSubsampledPositions(
      this.timedPositions,
      distanceBetweenSamples
    );
  }
};
