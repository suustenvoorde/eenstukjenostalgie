const map = require('./components/map.js');
const instructionSlides = require('./components/instructionSlides.js');
const submitLocationTimestamp = require('./components/submitLocationTimestamp.js');

(function () {
  map.init();
  instructionSlides.init();
  submitLocationTimestamp.init();
}) ();
