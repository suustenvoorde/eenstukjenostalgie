var map = require('./map.js');

(function () {
  const submitLocationTimestamp = {
    form: document.querySelector('.location-timestamp'),
    init: function () {
      this.form.addEventListener('submit', (e) => {
        var formdata = new FormData(e.target);
        var data = {
          wkt: map.inputCircle().wkt,
          coords: map.inputCircle().coords
        };

        for (var key of formdata.keys()) {
          data[key] = formdata.get(key);
        }

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

  submitLocationTimestamp.init();
}) ();
