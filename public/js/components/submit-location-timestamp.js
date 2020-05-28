var map = require('./map.js');
var loader = require('./loader.js');
var errors = require('./errors.js');

const submitLocationTimestamp = {
  form: document.querySelector('.location-timestamp'),
  init: function () {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      var formdata = new FormData(e.target);
      var data = {
        wkt: map.inputCircle.wkt,
        coords: map.inputCircle.coords
      };

      for (var key of formdata.keys()) {
        data[key] = formdata.get(key);
      }

      // Check for error with timestamp:
      if (data.startyear > data.endyear) {
        errors.fire('incorrectTimestamp');
        return;
      }

      var http = new XMLHttpRequest();
      var url = '/create-story';

      // Show the loader
      loader.show();

      http.open('post', url, true);
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
          console.log(http.responseURL);
          window.location = http.responseURL;
        }
      }
      http.send(JSON.stringify(data));
    });
  }
};

module.exports = submitLocationTimestamp;
