var map = require('./components/map.js');
var instructionSlides = require('./components/instructionSlides.js');
var submitLocationTimestamp = require('./components/submitLocationTimestamp.js');

const main = {
  init: function () {
    map.init();
    instructionSlides.init();
    submitLocationTimestamp.init();
  }
};

main.init();
