const geolib = require("geolib");

const FEET_TO_METRES_FACTOR = 0.3048;

exports.feetToMetres = feet => Math.round(feet * FEET_TO_METRES_FACTOR);
exports.metresToFeet = metres => Math.round(metres / FEET_TO_METRES_FACTOR);
exports.euclideanDistance = (a, b) => Math.round(Math.sqrt(a ** 2 + b ** 2));
exports.distFrom = (a, b) => geolib.getPreciseDistance(a, b);

exports.roundDec = (num, prec) => Math.round(num * 10 ** prec) / 10 ** prec;

exports.degToCompass = num => {
  var val = Math.floor(num / 22.5 + 0.5);
  var arr = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW"
  ];
  return arr[val % 16];
};

exports.getBoundsOfDistance = (lat, lon, distanceMetres) => {
  return geolib.getBoundsOfDistance(
    { latitude: lat, lon: -lon },
    distanceMetres
  );
};

exports.secsFromMidnight = epochms => {
  const newDate = new Date(epochms);

  const hours = newDate.getUTCHours() * (60 * 60);
  const minutes = newDate.getUTCMinutes() * 60;
  const seconds = newDate.getUTCSeconds();
  const secsSinceMidnight = hours + minutes + seconds;

  return secsSinceMidnight;
};

exports.getLastString = el =>
  el
    ? el
        .split(",")
        .pop()
        .trim()
    : "";

exports.cleanOperator = el => (el ? el.replace(",", "").trim() : "");

exports.icaoAirport = el => (el && el.length >= 4 ? el.substring(0, 4) : "");
