const {
    feetToMetres,
    metresToFeet,
    euclideanDistance,
    distFrom
} = require('../utils/utils');

module.exports = class Position {
    constructor(obj) {
        this.lat = obj.lat;
        this.lon = obj.lon;
        this.alt = obj.alt; // Altitude in metres
    }

    static distance3D(posA, posB) {
        const distance2D = distFrom({
            latitude: posA.lat,
            longitude: posA.lon
        }, {
            latitude: posB.lat,
            longitude: posB.lon
        });

        return euclideanDistance(distance2D, posA.alt - posB.alt);
    }

    static minDistancePointToLine3D(startPosition, endPosition, posA) {


        return 1;
    }

    distance3DFrom(position) {
        return Position.distance3D(this, position);
    }
}
