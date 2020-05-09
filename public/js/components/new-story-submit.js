var map = require('./map.js');

(function () {
  var newStory = {
    form: document.querySelector('.submit-location-and-timestamp'),
    timestampMin: document.querySelector('[name="timestamp-min"]'),
    timestampMax: document.querySelector('[name="timestamp-max"]'),
    init: function () {
      this.form.addEventListener('submit', (e) => {
        var data = {
          'valMin': this.timestampMin.value,
          'valMax': this.timestampMax.value,
          'wkt': map.inputCircle().wkt,
          'coords': map.inputCircle().coords
        };

        var http = new XMLHttpRequest();
        var url = '/create-story';

        http.open('post', url, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function () {
          if (http.readyState == 4 && http.status == 200) {
            console.log(http.responseURL);
            window.location = http.responseURL;
          }
        }
        http.send(JSON.stringify(data));
        e.preventDefault();
      });
    }
  };

  newStory.init();
})();
