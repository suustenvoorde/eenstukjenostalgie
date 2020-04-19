(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
function toRadians(angleInDegrees) {
  return angleInDegrees * Math.PI / 180;
}

function toDegrees(angleInRadians) {
  return angleInRadians * 180 / Math.PI;
}

function offset(c1, distance, bearing) {
  var lat1 = toRadians(c1[1]);
  var lon1 = toRadians(c1[0]);
  var dByR = distance / 6378137; // distance divided by 6378137 (radius of the earth) wgs84
	var dByR2 = (distance * 1.65) / 6378137; // distance divided by 6378137 (radius of the earth) wgs84
  var lat = Math.asin(
    Math.sin(lat1) * Math.cos(dByR2) +
    Math.cos(lat1) * Math.sin(dByR2) * Math.cos(bearing));
  var lon = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
  return [toDegrees(lon), toDegrees(lat)];
}

module.exports = function circleToPolygon(center, radius, numberOfSegments) {
  var n = numberOfSegments ? numberOfSegments : 32;
  var flatCoordinates = [];
  var coordinates = [];
  for (var i = 0; i < n; ++i) {
    flatCoordinates.push.apply(flatCoordinates, offset(center, radius, 2 * Math.PI * i / n));
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);

  for (var i = 0, j = 0; j < flatCoordinates.length; j += 2) {
    coordinates[i++] = flatCoordinates.slice(j, j + 2);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates.reverse()]
  };
};

},{}],2:[function(require,module,exports){
'use strict';

(function () {

  var imageDetail = {
    trigger: document.querySelectorAll('.openDetail'),
    detail: document.querySelector('.detail'),
    init: function () {
      this.detailImg = this.detail.getElementsByTagName('img')[0];
      this.detailText = this.detail.getElementsByTagName('p')[0];
      this.detailCloseBtn = this.detail.querySelector('.popupCloseButton');

      this.trigger.forEach(elem => {
        elem.addEventListener('click', (e) => {
          this.openDetail(elem.dataset.image, elem.dataset.text);
          e.preventDefault();
        });
      });

      this.detailCloseBtn.addEventListener('click', (e) => {
        this.closeDetail();
        e.preventDefault();
      });

      this.detail.addEventListener('click', (e) => {
        this.closeDetail();
        e.preventDefault();
      });
    },
    openDetail: function (img, text = '') {
      // Add image to popup:
      this.detailImg.src = img;
      this.detailImg.alt = text;
      this.detailText.textContent = text;

      // Show the popup:
      this.detail.classList.add('show');
    },
    closeDetail: function () {
      this.detail.classList.remove('show');
    }
  };

  imageDetail.init();
})();

},{}],3:[function(require,module,exports){
// Require JS files:
var circleToPolygon = require('./circletopolygon.js');
var toWKT = require('./towkt.js');
var search = require('./search.js');

// Set global wkt variable:
var inputCircle;

(function(){

	"use strict";

	var map = {
		searchbar: document.querySelector('[name="searchLocation"]'),
		selectRadius: document.getElementById('radius-selected'),
		mapboxAccessToken: 'pk.eyJ1IjoibWF4ZGV2cmllczk1IiwiYSI6ImNqZWZydWkyNjF3NXoyd28zcXFqdDJvbjEifQ.Dl3DvuFEqHVAxfajg0ESWg',
		map: L.map('map', {
			zoomControl: false
		}),
		circle: L.circle({
			color: '#DA121A',
			fillColor: '#DA121A',
			fillOpacity: 0.4,
			radius: 500/2
		}),
		polygon: L.polygon({
			color: '#DA121A'
		}),
		geoJSON: L.geoJSON(),
		centerPoint: [
			52.370216,
			4.895168
		],
		startPos: { x: 0, y: 0 },
		currentPos: { x: 0, y: 0 },
		init: async function () {
			// Set the original view of the map:
			this.map.setView(this.centerPoint, 14);

			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + this.mapboxAccessToken, {
				minZoom: 11,
				maxZoom: 20,
				id: 'mapbox.light'
			}).addTo(this.map);

			L.control.zoom({
				position: 'bottomright'
			}).addTo(this.map);

			// Initialize the circle:
			this.circle
				.setLatLng(this.centerPoint)
				.setRadius(250)
				.addTo(this.map);

			// Initialize circle events:
			this.changeRadius();

			// Create the polygon, with the centerPoint as coords:
			this.createPolygon(this.centerPoint);

			// Get all the streets:
			var allStreets = await this.getAllStreets();

			// Map the street names from allStreets for search:
			var streetNames = allStreets.map(street => street.properties.name);

			// Initialize the autocomplete search:
			search.init(this.searchbar, streetNames);

			// Add the streets data to geoJSON:
			this.geoJSON.addData(allStreets);

			// Dragging the circle:
			var draggable = new L.Draggable(this.circle._path);
			draggable.enable();

			this.startPos.x = this.circle._point.x;
			this.startPos.y = this.circle._point.y;

			// Calculate the new center:
			draggable.on('drag', (e) => {
				this.currentPos.x = e.sourceTarget._newPos.x;
				this.currentPos.y = e.sourceTarget._newPos.y;
				this.moveCircle();
			});

			this.map.on('zoom', (e) => {
				var newZoomLevel = Number(e.sourceTarget._animateToZoom);
				var layerPoint = this.map.latLngToLayerPoint(this.centerPoint);
				this.map.setView(this.centerPoint, newZoomLevel);
				this.startPos.x = layerPoint.x - this.currentPos.x;
				this.startPos.y = layerPoint.y - this.currentPos.y;
				this.moveCircle();
			});
		},
		getAllStreets: async function () {
			return fetch('/js/streets.json')
				.then(res => res.json())
				.catch(err => {
					console.log(err);
				});
		},
		changeRadius: function () {
			this.selectRadius.addEventListener('change', (e) => {
				var latlng = this.circle.getLatLng();
				var meters = (e.target.value / 2) * 1000;
				this.createCircle(Object.values(latlng), meters);
				this.createPolygon(this.centerPoint, meters);
			});
		},
		moveCircle: function () {
			var x = this.startPos.x + this.currentPos.x;
			var y = this.startPos.y + this.currentPos.y;
			var point = { x: x, y: y };
			var latlng = this.map.layerPointToLatLng(point);
			var radius = this.circle.getRadius();

			// Create the new polygon:
			this.centerPoint = Object.values(latlng);
			this.createCircle(Object.values(latlng), radius);
			this.createPolygon(Object.values(latlng), radius);
			L.DomUtil.setTransform(this.circle._path, { x: 0, y: 0 });
		},
		createCircle: function (coords, radius = this.circle.getRadius()) {
			this.circle.setLatLng(coords);
			this.circle.setRadius(radius);
		},
		createPolygon: function (coords, radius = this.circle.getRadius(), numberOfEdges = 10) {
			//leaflet polygon to wkt
			var polygonCoords = circleToPolygon(coords, radius, numberOfEdges);

			// Set the new coords:
			this.polygon
				.setLatLngs(polygonCoords.coordinates[0]);

			// Create a wkt from the polygon:
			inputCircle = {
				wkt: toWKT(this.polygon),
				coords: coords
			};
		}
	};

	map.init();

	exports.selectedStreet = function (streetName) {
		map.geoJSON.eachLayer(layer => {
			if (layer.feature.properties.name === streetName) {
				var bounds = layer.getBounds();
				var center = bounds.getCenter();

				var layerPoint = map.map.latLngToLayerPoint([center.lat, center.lng]);
				map.map.setView([center.lat, center.lng], 14);

				map.startPos.x = layerPoint.x - map.currentPos.x;
				map.startPos.y = layerPoint.y - map.currentPos.y;

				map.moveCircle();
				map.createCircle([center.lat, center.lng]);
				map.createPolygon([center.lat, center.lng]);
			}
		});
	}
})();

exports.inputCircle = function () {
	return inputCircle;
}

},{"./circletopolygon.js":1,"./search.js":5,"./towkt.js":6}],4:[function(require,module,exports){
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

},{"./map.js":3}],5:[function(require,module,exports){
var map = require('./map.js');

(function () {

  'use strict';

  var search = {
    currentFocus: 0,
    init: function (searchbar, data) {
      // Add the given searchbar to this object:
      this.searchbar = searchbar;

      // Event listener for input value:
      this.searchbar.addEventListener('input', (e) => {
        this.closeList();
        if (!e.target.value) return false;
        this.currentFocus = -1;
        this.getAutocomplete(data, e.target.value);
      });

      // Event listener for keyboard functions:
      this.searchbar.addEventListener('keydown', (e) => {
        var list = document.querySelector('.autocomplete-items');

        if (list) list = list.querySelectorAll('li');

        switch (e.keyCode) {
          case 40:
            this.currentFocus++;
            this.addActive(list);
            break;
          case 38:
            this.currentFocus--;
            this.addActive(list);
            break;
          case 13:
            e.preventDefault();
            if (this.currentFocus > -1) {
              if (list) list[this.currentFocus].children[0].click();
            }
        }
      });

      // Event for clicking search button:
      this.searchbar.parentNode.addEventListener('submit', (e) => {
        var val = this.searchbar.value;
        this.getAutocomplete(data, val);

        var results = data.filter(str => str.toUpperCase() == val.toUpperCase());
        if (results.length) map.selectedStreet(results[0]);

        e.preventDefault();
      });

      // Event listener when clicking the document:
      document.addEventListener('click', (e) => {
        this.closeList(e.target);
      });
    },
    getAutocomplete: function (data, val) {
      // Check what data matches the search query:
      var results = data.filter(str => str.substr(0, val.length).toUpperCase() == val.toUpperCase());
      this.setAutocomplete(results);
    },
    setAutocomplete: function (results) {
      var autocomplete = document.querySelector('.autocomplete');
      var ul = document.createElement('ul');
      var li = document.createElement('li');
      var a = document.createElement('a');
      var fragment = document.createDocumentFragment();

      ul.classList.add('autocomplete-items');
      fragment.appendChild(ul);

      results.forEach((result, i) => {
        if (i < 10) {
          var cloneLi = li.cloneNode(true);
          var cloneA = a.cloneNode(true);

          ul.appendChild(cloneLi);

          cloneA.textContent = result;
          cloneA.href = '#';
          cloneLi.appendChild(cloneA);

          cloneLi.addEventListener('click', (e) => {
            this.searchbar.value = e.target.textContent;
            this.closeList();
            map.selectedStreet(e.target.textContent);
            e.preventDefault();
          });
        }
      });
      autocomplete.appendChild(fragment);
    },
    addActive: function (list) {
      if (!list) return false;
      this.removeActive(list);
      if (this.currentFocus >= list.length) this.currentFocus = 0;
      if (this.currentFocus < 0) this.currentFocus = (list.length - 1);
      this.searchbar.value = list[this.currentFocus].children[0].textContent;
      list[this.currentFocus].children[0].classList.add('autocomplete-active');
    },
    removeActive: function (list) {
      for (var i = 0; i < list.length; i++) {
        list[i].children[0].classList.remove('autocomplete-active');
      }
    },
    closeList: function (elem) {
      var lists = document.querySelectorAll('.autocomplete-items');

      for (var i = 0; i < lists.length; i++) {
        if (elem != lists[i] && elem != this.searchbar) {
          lists[i].parentNode.removeChild(lists[i]);
        }
      }
    }
  };

  module.exports = search;

})();

},{"./map.js":3}],6:[function(require,module,exports){
module.exports = function toWKT (layer) {
		var lng, lat, coords = [];
		if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
			var latlngs = layer.getLatLngs();
		for (var i = 0; i < latlngs.length; i++) {
				var latlngs1 = latlngs[i];
				if (latlngs1.length){
				for (var j = 0; j < latlngs1.length; j++) {
					coords.push(latlngs1[j].lng + " " + latlngs1[j].lat);
					if (j === 0) {
						lng = latlngs1[j].lng;
						lat = latlngs1[j].lat;
					}
				}}
				else
				{
					coords.push(latlngs[i].lng + " " + latlngs[i].lat);
					if (i === 0) {
						lng = latlngs[i].lng;
						lat = latlngs[i].lat;
					}}
		};
			if (layer instanceof L.Polygon) {
				return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
			} else if (layer instanceof L.Polyline) {
				return "LINESTRING(" + coords.join(",") + ")";
			}
		} else if (layer instanceof L.Marker) {
			return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
		}
	};

},{}]},{},[1,2,3,4,5,6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvanMvY2lyY2xldG9wb2x5Z29uLmpzIiwicHVibGljL2pzL2ltYWdlLWRldGFpbC5qcyIsInB1YmxpYy9qcy9tYXAuanMiLCJwdWJsaWMvanMvbmV3LXN0b3J5LXN1Ym1pdC5qcyIsInB1YmxpYy9qcy9zZWFyY2guanMiLCJwdWJsaWMvanMvdG93a3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gdG9SYWRpYW5zKGFuZ2xlSW5EZWdyZWVzKSB7XG4gIHJldHVybiBhbmdsZUluRGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIHRvRGVncmVlcyhhbmdsZUluUmFkaWFucykge1xuICByZXR1cm4gYW5nbGVJblJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBvZmZzZXQoYzEsIGRpc3RhbmNlLCBiZWFyaW5nKSB7XG4gIHZhciBsYXQxID0gdG9SYWRpYW5zKGMxWzFdKTtcbiAgdmFyIGxvbjEgPSB0b1JhZGlhbnMoYzFbMF0pO1xuICB2YXIgZEJ5UiA9IGRpc3RhbmNlIC8gNjM3ODEzNzsgLy8gZGlzdGFuY2UgZGl2aWRlZCBieSA2Mzc4MTM3IChyYWRpdXMgb2YgdGhlIGVhcnRoKSB3Z3M4NFxuXHR2YXIgZEJ5UjIgPSAoZGlzdGFuY2UgKiAxLjY1KSAvIDYzNzgxMzc7IC8vIGRpc3RhbmNlIGRpdmlkZWQgYnkgNjM3ODEzNyAocmFkaXVzIG9mIHRoZSBlYXJ0aCkgd2dzODRcbiAgdmFyIGxhdCA9IE1hdGguYXNpbihcbiAgICBNYXRoLnNpbihsYXQxKSAqIE1hdGguY29zKGRCeVIyKSArXG4gICAgTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihkQnlSMikgKiBNYXRoLmNvcyhiZWFyaW5nKSk7XG4gIHZhciBsb24gPSBsb24xICsgTWF0aC5hdGFuMihcbiAgICAgIE1hdGguc2luKGJlYXJpbmcpICogTWF0aC5zaW4oZEJ5UikgKiBNYXRoLmNvcyhsYXQxKSxcbiAgICAgIE1hdGguY29zKGRCeVIpIC0gTWF0aC5zaW4obGF0MSkgKiBNYXRoLnNpbihsYXQpKTtcbiAgcmV0dXJuIFt0b0RlZ3JlZXMobG9uKSwgdG9EZWdyZWVzKGxhdCldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNpcmNsZVRvUG9seWdvbihjZW50ZXIsIHJhZGl1cywgbnVtYmVyT2ZTZWdtZW50cykge1xuICB2YXIgbiA9IG51bWJlck9mU2VnbWVudHMgPyBudW1iZXJPZlNlZ21lbnRzIDogMzI7XG4gIHZhciBmbGF0Q29vcmRpbmF0ZXMgPSBbXTtcbiAgdmFyIGNvb3JkaW5hdGVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgZmxhdENvb3JkaW5hdGVzLnB1c2guYXBwbHkoZmxhdENvb3JkaW5hdGVzLCBvZmZzZXQoY2VudGVyLCByYWRpdXMsIDIgKiBNYXRoLlBJICogaSAvIG4pKTtcbiAgfVxuICBmbGF0Q29vcmRpbmF0ZXMucHVzaChmbGF0Q29vcmRpbmF0ZXNbMF0sIGZsYXRDb29yZGluYXRlc1sxXSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBqIDwgZmxhdENvb3JkaW5hdGVzLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgY29vcmRpbmF0ZXNbaSsrXSA9IGZsYXRDb29yZGluYXRlcy5zbGljZShqLCBqICsgMik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW2Nvb3JkaW5hdGVzLnJldmVyc2UoKV1cbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGltYWdlRGV0YWlsID0ge1xuICAgIHRyaWdnZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5vcGVuRGV0YWlsJyksXG4gICAgZGV0YWlsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGV0YWlsJyksXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWxJbWcgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF07XG4gICAgICB0aGlzLmRldGFpbFRleHQgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpWzBdO1xuICAgICAgdGhpcy5kZXRhaWxDbG9zZUJ0biA9IHRoaXMuZGV0YWlsLnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cENsb3NlQnV0dG9uJyk7XG5cbiAgICAgIHRoaXMudHJpZ2dlci5mb3JFYWNoKGVsZW0gPT4ge1xuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLm9wZW5EZXRhaWwoZWxlbS5kYXRhc2V0LmltYWdlLCBlbGVtLmRhdGFzZXQudGV4dCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRldGFpbENsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZURldGFpbCgpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5kZXRhaWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlRGV0YWlsKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb3BlbkRldGFpbDogZnVuY3Rpb24gKGltZywgdGV4dCA9ICcnKSB7XG4gICAgICAvLyBBZGQgaW1hZ2UgdG8gcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbEltZy5zcmMgPSBpbWc7XG4gICAgICB0aGlzLmRldGFpbEltZy5hbHQgPSB0ZXh0O1xuICAgICAgdGhpcy5kZXRhaWxUZXh0LnRleHRDb250ZW50ID0gdGV4dDtcblxuICAgICAgLy8gU2hvdyB0aGUgcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbC5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSxcbiAgICBjbG9zZURldGFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWwuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH1cbiAgfTtcblxuICBpbWFnZURldGFpbC5pbml0KCk7XG59KSgpO1xuIiwiLy8gUmVxdWlyZSBKUyBmaWxlczpcbnZhciBjaXJjbGVUb1BvbHlnb24gPSByZXF1aXJlKCcuL2NpcmNsZXRvcG9seWdvbi5qcycpO1xudmFyIHRvV0tUID0gcmVxdWlyZSgnLi90b3drdC5qcycpO1xudmFyIHNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoLmpzJyk7XG5cbi8vIFNldCBnbG9iYWwgd2t0IHZhcmlhYmxlOlxudmFyIGlucHV0Q2lyY2xlO1xuXG4oZnVuY3Rpb24oKXtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgbWFwID0ge1xuXHRcdHNlYXJjaGJhcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9XCJzZWFyY2hMb2NhdGlvblwiXScpLFxuXHRcdHNlbGVjdFJhZGl1czogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhZGl1cy1zZWxlY3RlZCcpLFxuXHRcdG1hcGJveEFjY2Vzc1Rva2VuOiAncGsuZXlKMUlqb2liV0Y0WkdWMmNtbGxjemsxSWl3aVlTSTZJbU5xWldaeWRXa3lOakYzTlhveWQyOHpjWEZxZERKdmJqRWlmUS5EbDNEdnVGRXFIVkF4ZmFqZzBFU1dnJyxcblx0XHRtYXA6IEwubWFwKCdtYXAnLCB7XG5cdFx0XHR6b29tQ29udHJvbDogZmFsc2Vcblx0XHR9KSxcblx0XHRjaXJjbGU6IEwuY2lyY2xlKHtcblx0XHRcdGNvbG9yOiAnI0RBMTIxQScsXG5cdFx0XHRmaWxsQ29sb3I6ICcjREExMjFBJyxcblx0XHRcdGZpbGxPcGFjaXR5OiAwLjQsXG5cdFx0XHRyYWRpdXM6IDUwMC8yXG5cdFx0fSksXG5cdFx0cG9seWdvbjogTC5wb2x5Z29uKHtcblx0XHRcdGNvbG9yOiAnI0RBMTIxQSdcblx0XHR9KSxcblx0XHRnZW9KU09OOiBMLmdlb0pTT04oKSxcblx0XHRjZW50ZXJQb2ludDogW1xuXHRcdFx0NTIuMzcwMjE2LFxuXHRcdFx0NC44OTUxNjhcblx0XHRdLFxuXHRcdHN0YXJ0UG9zOiB7IHg6IDAsIHk6IDAgfSxcblx0XHRjdXJyZW50UG9zOiB7IHg6IDAsIHk6IDAgfSxcblx0XHRpbml0OiBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyBTZXQgdGhlIG9yaWdpbmFsIHZpZXcgb2YgdGhlIG1hcDpcblx0XHRcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJQb2ludCwgMTQpO1xuXG5cdFx0XHRMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LnBuZz9hY2Nlc3NfdG9rZW49JyArIHRoaXMubWFwYm94QWNjZXNzVG9rZW4sIHtcblx0XHRcdFx0bWluWm9vbTogMTEsXG5cdFx0XHRcdG1heFpvb206IDIwLFxuXHRcdFx0XHRpZDogJ21hcGJveC5saWdodCdcblx0XHRcdH0pLmFkZFRvKHRoaXMubWFwKTtcblxuXHRcdFx0TC5jb250cm9sLnpvb20oe1xuXHRcdFx0XHRwb3NpdGlvbjogJ2JvdHRvbXJpZ2h0J1xuXHRcdFx0fSkuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0XHQvLyBJbml0aWFsaXplIHRoZSBjaXJjbGU6XG5cdFx0XHR0aGlzLmNpcmNsZVxuXHRcdFx0XHQuc2V0TGF0TG5nKHRoaXMuY2VudGVyUG9pbnQpXG5cdFx0XHRcdC5zZXRSYWRpdXMoMjUwKVxuXHRcdFx0XHQuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0XHQvLyBJbml0aWFsaXplIGNpcmNsZSBldmVudHM6XG5cdFx0XHR0aGlzLmNoYW5nZVJhZGl1cygpO1xuXG5cdFx0XHQvLyBDcmVhdGUgdGhlIHBvbHlnb24sIHdpdGggdGhlIGNlbnRlclBvaW50IGFzIGNvb3Jkczpcblx0XHRcdHRoaXMuY3JlYXRlUG9seWdvbih0aGlzLmNlbnRlclBvaW50KTtcblxuXHRcdFx0Ly8gR2V0IGFsbCB0aGUgc3RyZWV0czpcblx0XHRcdHZhciBhbGxTdHJlZXRzID0gYXdhaXQgdGhpcy5nZXRBbGxTdHJlZXRzKCk7XG5cblx0XHRcdC8vIE1hcCB0aGUgc3RyZWV0IG5hbWVzIGZyb20gYWxsU3RyZWV0cyBmb3Igc2VhcmNoOlxuXHRcdFx0dmFyIHN0cmVldE5hbWVzID0gYWxsU3RyZWV0cy5tYXAoc3RyZWV0ID0+IHN0cmVldC5wcm9wZXJ0aWVzLm5hbWUpO1xuXG5cdFx0XHQvLyBJbml0aWFsaXplIHRoZSBhdXRvY29tcGxldGUgc2VhcmNoOlxuXHRcdFx0c2VhcmNoLmluaXQodGhpcy5zZWFyY2hiYXIsIHN0cmVldE5hbWVzKTtcblxuXHRcdFx0Ly8gQWRkIHRoZSBzdHJlZXRzIGRhdGEgdG8gZ2VvSlNPTjpcblx0XHRcdHRoaXMuZ2VvSlNPTi5hZGREYXRhKGFsbFN0cmVldHMpO1xuXG5cdFx0XHQvLyBEcmFnZ2luZyB0aGUgY2lyY2xlOlxuXHRcdFx0dmFyIGRyYWdnYWJsZSA9IG5ldyBMLkRyYWdnYWJsZSh0aGlzLmNpcmNsZS5fcGF0aCk7XG5cdFx0XHRkcmFnZ2FibGUuZW5hYmxlKCk7XG5cblx0XHRcdHRoaXMuc3RhcnRQb3MueCA9IHRoaXMuY2lyY2xlLl9wb2ludC54O1xuXHRcdFx0dGhpcy5zdGFydFBvcy55ID0gdGhpcy5jaXJjbGUuX3BvaW50Lnk7XG5cblx0XHRcdC8vIENhbGN1bGF0ZSB0aGUgbmV3IGNlbnRlcjpcblx0XHRcdGRyYWdnYWJsZS5vbignZHJhZycsIChlKSA9PiB7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBvcy54ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy54O1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQb3MueSA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueTtcblx0XHRcdFx0dGhpcy5tb3ZlQ2lyY2xlKCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5tYXAub24oJ3pvb20nLCAoZSkgPT4ge1xuXHRcdFx0XHR2YXIgbmV3Wm9vbUxldmVsID0gTnVtYmVyKGUuc291cmNlVGFyZ2V0Ll9hbmltYXRlVG9ab29tKTtcblx0XHRcdFx0dmFyIGxheWVyUG9pbnQgPSB0aGlzLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5jZW50ZXJQb2ludCk7XG5cdFx0XHRcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJQb2ludCwgbmV3Wm9vbUxldmVsKTtcblx0XHRcdFx0dGhpcy5zdGFydFBvcy54ID0gbGF5ZXJQb2ludC54IC0gdGhpcy5jdXJyZW50UG9zLng7XG5cdFx0XHRcdHRoaXMuc3RhcnRQb3MueSA9IGxheWVyUG9pbnQueSAtIHRoaXMuY3VycmVudFBvcy55O1xuXHRcdFx0XHR0aGlzLm1vdmVDaXJjbGUoKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0Z2V0QWxsU3RyZWV0czogYXN5bmMgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGZldGNoKCcvanMvc3RyZWV0cy5qc29uJylcblx0XHRcdFx0LnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG5cdFx0XHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0Y2hhbmdlUmFkaXVzOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLnNlbGVjdFJhZGl1cy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuXHRcdFx0XHR2YXIgbGF0bG5nID0gdGhpcy5jaXJjbGUuZ2V0TGF0TG5nKCk7XG5cdFx0XHRcdHZhciBtZXRlcnMgPSAoZS50YXJnZXQudmFsdWUgLyAyKSAqIDEwMDA7XG5cdFx0XHRcdHRoaXMuY3JlYXRlQ2lyY2xlKE9iamVjdC52YWx1ZXMobGF0bG5nKSwgbWV0ZXJzKTtcblx0XHRcdFx0dGhpcy5jcmVhdGVQb2x5Z29uKHRoaXMuY2VudGVyUG9pbnQsIG1ldGVycyk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdmVDaXJjbGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB4ID0gdGhpcy5zdGFydFBvcy54ICsgdGhpcy5jdXJyZW50UG9zLng7XG5cdFx0XHR2YXIgeSA9IHRoaXMuc3RhcnRQb3MueSArIHRoaXMuY3VycmVudFBvcy55O1xuXHRcdFx0dmFyIHBvaW50ID0geyB4OiB4LCB5OiB5IH07XG5cdFx0XHR2YXIgbGF0bG5nID0gdGhpcy5tYXAubGF5ZXJQb2ludFRvTGF0TG5nKHBvaW50KTtcblx0XHRcdHZhciByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKTtcblxuXHRcdFx0Ly8gQ3JlYXRlIHRoZSBuZXcgcG9seWdvbjpcblx0XHRcdHRoaXMuY2VudGVyUG9pbnQgPSBPYmplY3QudmFsdWVzKGxhdGxuZyk7XG5cdFx0XHR0aGlzLmNyZWF0ZUNpcmNsZShPYmplY3QudmFsdWVzKGxhdGxuZyksIHJhZGl1cyk7XG5cdFx0XHR0aGlzLmNyZWF0ZVBvbHlnb24oT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCByYWRpdXMpO1xuXHRcdFx0TC5Eb21VdGlsLnNldFRyYW5zZm9ybSh0aGlzLmNpcmNsZS5fcGF0aCwgeyB4OiAwLCB5OiAwIH0pO1xuXHRcdH0sXG5cdFx0Y3JlYXRlQ2lyY2xlOiBmdW5jdGlvbiAoY29vcmRzLCByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKSkge1xuXHRcdFx0dGhpcy5jaXJjbGUuc2V0TGF0TG5nKGNvb3Jkcyk7XG5cdFx0XHR0aGlzLmNpcmNsZS5zZXRSYWRpdXMocmFkaXVzKTtcblx0XHR9LFxuXHRcdGNyZWF0ZVBvbHlnb246IGZ1bmN0aW9uIChjb29yZHMsIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpLCBudW1iZXJPZkVkZ2VzID0gMTApIHtcblx0XHRcdC8vbGVhZmxldCBwb2x5Z29uIHRvIHdrdFxuXHRcdFx0dmFyIHBvbHlnb25Db29yZHMgPSBjaXJjbGVUb1BvbHlnb24oY29vcmRzLCByYWRpdXMsIG51bWJlck9mRWRnZXMpO1xuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBjb29yZHM6XG5cdFx0XHR0aGlzLnBvbHlnb25cblx0XHRcdFx0LnNldExhdExuZ3MocG9seWdvbkNvb3Jkcy5jb29yZGluYXRlc1swXSk7XG5cblx0XHRcdC8vIENyZWF0ZSBhIHdrdCBmcm9tIHRoZSBwb2x5Z29uOlxuXHRcdFx0aW5wdXRDaXJjbGUgPSB7XG5cdFx0XHRcdHdrdDogdG9XS1QodGhpcy5wb2x5Z29uKSxcblx0XHRcdFx0Y29vcmRzOiBjb29yZHNcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xuXG5cdG1hcC5pbml0KCk7XG5cblx0ZXhwb3J0cy5zZWxlY3RlZFN0cmVldCA9IGZ1bmN0aW9uIChzdHJlZXROYW1lKSB7XG5cdFx0bWFwLmdlb0pTT04uZWFjaExheWVyKGxheWVyID0+IHtcblx0XHRcdGlmIChsYXllci5mZWF0dXJlLnByb3BlcnRpZXMubmFtZSA9PT0gc3RyZWV0TmFtZSkge1xuXHRcdFx0XHR2YXIgYm91bmRzID0gbGF5ZXIuZ2V0Qm91bmRzKCk7XG5cdFx0XHRcdHZhciBjZW50ZXIgPSBib3VuZHMuZ2V0Q2VudGVyKCk7XG5cblx0XHRcdFx0dmFyIGxheWVyUG9pbnQgPSBtYXAubWFwLmxhdExuZ1RvTGF5ZXJQb2ludChbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0XHRtYXAubWFwLnNldFZpZXcoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddLCAxNCk7XG5cblx0XHRcdFx0bWFwLnN0YXJ0UG9zLnggPSBsYXllclBvaW50LnggLSBtYXAuY3VycmVudFBvcy54O1xuXHRcdFx0XHRtYXAuc3RhcnRQb3MueSA9IGxheWVyUG9pbnQueSAtIG1hcC5jdXJyZW50UG9zLnk7XG5cblx0XHRcdFx0bWFwLm1vdmVDaXJjbGUoKTtcblx0XHRcdFx0bWFwLmNyZWF0ZUNpcmNsZShbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0XHRtYXAuY3JlYXRlUG9seWdvbihbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KSgpO1xuXG5leHBvcnRzLmlucHV0Q2lyY2xlID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gaW5wdXRDaXJjbGU7XG59XG4iLCJ2YXIgbWFwID0gcmVxdWlyZSgnLi9tYXAuanMnKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5ld1N0b3J5ID0ge1xuICAgIGZvcm06IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdWJtaXQtbG9jYXRpb24tYW5kLXRpbWVzdGFtcCcpLFxuICAgIHRpbWVzdGFtcE1pbjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9XCJ0aW1lc3RhbXAtbWluXCJdJyksXG4gICAgdGltZXN0YW1wTWF4OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInRpbWVzdGFtcC1tYXhcIl0nKSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgJ3ZhbE1pbic6IHRoaXMudGltZXN0YW1wTWluLnZhbHVlLFxuICAgICAgICAgICd2YWxNYXgnOiB0aGlzLnRpbWVzdGFtcE1heC52YWx1ZSxcbiAgICAgICAgICAnd2t0JzogbWFwLmlucHV0Q2lyY2xlKCkud2t0LFxuICAgICAgICAgICdjb29yZHMnOiBtYXAuaW5wdXRDaXJjbGUoKS5jb29yZHNcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB2YXIgdXJsID0gJy9jcmVhdGUtc3RvcnknO1xuXG4gICAgICAgIGh0dHAub3BlbigncG9zdCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgIGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKGh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIGh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coaHR0cC5yZXNwb25zZVVSTCk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBodHRwLnJlc3BvbnNlVVJMO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBodHRwLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgbmV3U3RvcnkuaW5pdCgpO1xufSkoKTtcbiIsInZhciBtYXAgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgc2VhcmNoID0ge1xuICAgIGN1cnJlbnRGb2N1czogMCxcbiAgICBpbml0OiBmdW5jdGlvbiAoc2VhcmNoYmFyLCBkYXRhKSB7XG4gICAgICAvLyBBZGQgdGhlIGdpdmVuIHNlYXJjaGJhciB0byB0aGlzIG9iamVjdDpcbiAgICAgIHRoaXMuc2VhcmNoYmFyID0gc2VhcmNoYmFyO1xuXG4gICAgICAvLyBFdmVudCBsaXN0ZW5lciBmb3IgaW5wdXQgdmFsdWU6XG4gICAgICB0aGlzLnNlYXJjaGJhci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2VMaXN0KCk7XG4gICAgICAgIGlmICghZS50YXJnZXQudmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMgPSAtMTtcbiAgICAgICAgdGhpcy5nZXRBdXRvY29tcGxldGUoZGF0YSwgZS50YXJnZXQudmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciBrZXlib2FyZCBmdW5jdGlvbnM6XG4gICAgICB0aGlzLnNlYXJjaGJhci5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLWl0ZW1zJyk7XG5cbiAgICAgICAgaWYgKGxpc3QpIGxpc3QgPSBsaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJyk7XG5cbiAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMrKztcbiAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZlKGxpc3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEZvY3VzLS07XG4gICAgICAgICAgICB0aGlzLmFkZEFjdGl2ZShsaXN0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTM6XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Rm9jdXMgPiAtMSkge1xuICAgICAgICAgICAgICBpZiAobGlzdCkgbGlzdFt0aGlzLmN1cnJlbnRGb2N1c10uY2hpbGRyZW5bMF0uY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEV2ZW50IGZvciBjbGlja2luZyBzZWFyY2ggYnV0dG9uOlxuICAgICAgdGhpcy5zZWFyY2hiYXIucGFyZW50Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZSkgPT4ge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5zZWFyY2hiYXIudmFsdWU7XG4gICAgICAgIHRoaXMuZ2V0QXV0b2NvbXBsZXRlKGRhdGEsIHZhbCk7XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSBkYXRhLmZpbHRlcihzdHIgPT4gc3RyLnRvVXBwZXJDYXNlKCkgPT0gdmFsLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGgpIG1hcC5zZWxlY3RlZFN0cmVldChyZXN1bHRzWzBdKTtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgd2hlbiBjbGlja2luZyB0aGUgZG9jdW1lbnQ6XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2VMaXN0KGUudGFyZ2V0KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0QXV0b2NvbXBsZXRlOiBmdW5jdGlvbiAoZGF0YSwgdmFsKSB7XG4gICAgICAvLyBDaGVjayB3aGF0IGRhdGEgbWF0Y2hlcyB0aGUgc2VhcmNoIHF1ZXJ5OlxuICAgICAgdmFyIHJlc3VsdHMgPSBkYXRhLmZpbHRlcihzdHIgPT4gc3RyLnN1YnN0cigwLCB2YWwubGVuZ3RoKS50b1VwcGVyQ2FzZSgpID09IHZhbC50b1VwcGVyQ2FzZSgpKTtcbiAgICAgIHRoaXMuc2V0QXV0b2NvbXBsZXRlKHJlc3VsdHMpO1xuICAgIH0sXG4gICAgc2V0QXV0b2NvbXBsZXRlOiBmdW5jdGlvbiAocmVzdWx0cykge1xuICAgICAgdmFyIGF1dG9jb21wbGV0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUnKTtcbiAgICAgIHZhciB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAgIHVsLmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1pdGVtcycpO1xuICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQodWwpO1xuXG4gICAgICByZXN1bHRzLmZvckVhY2goKHJlc3VsdCwgaSkgPT4ge1xuICAgICAgICBpZiAoaSA8IDEwKSB7XG4gICAgICAgICAgdmFyIGNsb25lTGkgPSBsaS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgdmFyIGNsb25lQSA9IGEuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgdWwuYXBwZW5kQ2hpbGQoY2xvbmVMaSk7XG5cbiAgICAgICAgICBjbG9uZUEudGV4dENvbnRlbnQgPSByZXN1bHQ7XG4gICAgICAgICAgY2xvbmVBLmhyZWYgPSAnIyc7XG4gICAgICAgICAgY2xvbmVMaS5hcHBlbmRDaGlsZChjbG9uZUEpO1xuXG4gICAgICAgICAgY2xvbmVMaS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaGJhci52YWx1ZSA9IGUudGFyZ2V0LnRleHRDb250ZW50O1xuICAgICAgICAgICAgdGhpcy5jbG9zZUxpc3QoKTtcbiAgICAgICAgICAgIG1hcC5zZWxlY3RlZFN0cmVldChlLnRhcmdldC50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYXV0b2NvbXBsZXRlLmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbiAgICB9LFxuICAgIGFkZEFjdGl2ZTogZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgIGlmICghbGlzdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhpcy5yZW1vdmVBY3RpdmUobGlzdCk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50Rm9jdXMgPj0gbGlzdC5sZW5ndGgpIHRoaXMuY3VycmVudEZvY3VzID0gMDtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA8IDApIHRoaXMuY3VycmVudEZvY3VzID0gKGxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICB0aGlzLnNlYXJjaGJhci52YWx1ZSA9IGxpc3RbdGhpcy5jdXJyZW50Rm9jdXNdLmNoaWxkcmVuWzBdLnRleHRDb250ZW50O1xuICAgICAgbGlzdFt0aGlzLmN1cnJlbnRGb2N1c10uY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpO1xuICAgIH0sXG4gICAgcmVtb3ZlQWN0aXZlOiBmdW5jdGlvbiAobGlzdCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpc3RbaV0uY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2VMaXN0OiBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgdmFyIGxpc3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmF1dG9jb21wbGV0ZS1pdGVtcycpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChlbGVtICE9IGxpc3RzW2ldICYmIGVsZW0gIT0gdGhpcy5zZWFyY2hiYXIpIHtcbiAgICAgICAgICBsaXN0c1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHNlYXJjaDtcblxufSkoKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9XS1QgKGxheWVyKSB7XG5cdFx0dmFyIGxuZywgbGF0LCBjb29yZHMgPSBbXTtcblx0XHRpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlnb24gfHwgbGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlsaW5lKSB7XG5cdFx0XHR2YXIgbGF0bG5ncyA9IGxheWVyLmdldExhdExuZ3MoKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxhdGxuZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGxhdGxuZ3MxID0gbGF0bG5nc1tpXTtcblx0XHRcdFx0aWYgKGxhdGxuZ3MxLmxlbmd0aCl7XG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgbGF0bG5nczEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRjb29yZHMucHVzaChsYXRsbmdzMVtqXS5sbmcgKyBcIiBcIiArIGxhdGxuZ3MxW2pdLmxhdCk7XG5cdFx0XHRcdFx0aWYgKGogPT09IDApIHtcblx0XHRcdFx0XHRcdGxuZyA9IGxhdGxuZ3MxW2pdLmxuZztcblx0XHRcdFx0XHRcdGxhdCA9IGxhdGxuZ3MxW2pdLmxhdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH19XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvb3Jkcy5wdXNoKGxhdGxuZ3NbaV0ubG5nICsgXCIgXCIgKyBsYXRsbmdzW2ldLmxhdCk7XG5cdFx0XHRcdFx0aWYgKGkgPT09IDApIHtcblx0XHRcdFx0XHRcdGxuZyA9IGxhdGxuZ3NbaV0ubG5nO1xuXHRcdFx0XHRcdFx0bGF0ID0gbGF0bG5nc1tpXS5sYXQ7XG5cdFx0XHRcdFx0fX1cblx0XHR9O1xuXHRcdFx0aWYgKGxheWVyIGluc3RhbmNlb2YgTC5Qb2x5Z29uKSB7XG5cdFx0XHRcdHJldHVybiBcIlBPTFlHT04oKFwiICsgY29vcmRzLmpvaW4oXCIsXCIpICsgXCIsXCIgKyBsbmcgKyBcIiBcIiArIGxhdCArIFwiKSlcIjtcblx0XHRcdH0gZWxzZSBpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlsaW5lKSB7XG5cdFx0XHRcdHJldHVybiBcIkxJTkVTVFJJTkcoXCIgKyBjb29yZHMuam9pbihcIixcIikgKyBcIilcIjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGxheWVyIGluc3RhbmNlb2YgTC5NYXJrZXIpIHtcblx0XHRcdHJldHVybiBcIlBPSU5UKFwiICsgbGF5ZXIuZ2V0TGF0TG5nKCkubG5nICsgXCIgXCIgKyBsYXllci5nZXRMYXRMbmcoKS5sYXQgKyBcIilcIjtcblx0XHR9XG5cdH07XG4iXX0=
