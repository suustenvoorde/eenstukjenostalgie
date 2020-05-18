var map = require('./components/map.js');
var instructionSlides = require('./components/instruction-slides.js');
var submitLocationTimestamp = require('./components/submit-location-timestamp.js');

const main = {
  init: function () {
    map.init();
    instructionSlides.init();
    submitLocationTimestamp.init();
  }
};

main.init();
