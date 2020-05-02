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

// Delete leaflet logo
// document.getElementsByClassName( 'leaflet-control-attribution' )[0].style.display = 'none';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvanMvY2lyY2xldG9wb2x5Z29uLmpzIiwicHVibGljL2pzL2ltYWdlLWRldGFpbC5qcyIsInB1YmxpYy9qcy9tYXAuanMiLCJwdWJsaWMvanMvbmV3LXN0b3J5LXN1Ym1pdC5qcyIsInB1YmxpYy9qcy9zZWFyY2guanMiLCJwdWJsaWMvanMvdG93a3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gdG9SYWRpYW5zKGFuZ2xlSW5EZWdyZWVzKSB7XG4gIHJldHVybiBhbmdsZUluRGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIHRvRGVncmVlcyhhbmdsZUluUmFkaWFucykge1xuICByZXR1cm4gYW5nbGVJblJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBvZmZzZXQoYzEsIGRpc3RhbmNlLCBiZWFyaW5nKSB7XG4gIHZhciBsYXQxID0gdG9SYWRpYW5zKGMxWzFdKTtcbiAgdmFyIGxvbjEgPSB0b1JhZGlhbnMoYzFbMF0pO1xuICB2YXIgZEJ5UiA9IGRpc3RhbmNlIC8gNjM3ODEzNzsgLy8gZGlzdGFuY2UgZGl2aWRlZCBieSA2Mzc4MTM3IChyYWRpdXMgb2YgdGhlIGVhcnRoKSB3Z3M4NFxuXHR2YXIgZEJ5UjIgPSAoZGlzdGFuY2UgKiAxLjY1KSAvIDYzNzgxMzc7IC8vIGRpc3RhbmNlIGRpdmlkZWQgYnkgNjM3ODEzNyAocmFkaXVzIG9mIHRoZSBlYXJ0aCkgd2dzODRcbiAgdmFyIGxhdCA9IE1hdGguYXNpbihcbiAgICBNYXRoLnNpbihsYXQxKSAqIE1hdGguY29zKGRCeVIyKSArXG4gICAgTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihkQnlSMikgKiBNYXRoLmNvcyhiZWFyaW5nKSk7XG4gIHZhciBsb24gPSBsb24xICsgTWF0aC5hdGFuMihcbiAgICAgIE1hdGguc2luKGJlYXJpbmcpICogTWF0aC5zaW4oZEJ5UikgKiBNYXRoLmNvcyhsYXQxKSxcbiAgICAgIE1hdGguY29zKGRCeVIpIC0gTWF0aC5zaW4obGF0MSkgKiBNYXRoLnNpbihsYXQpKTtcbiAgcmV0dXJuIFt0b0RlZ3JlZXMobG9uKSwgdG9EZWdyZWVzKGxhdCldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNpcmNsZVRvUG9seWdvbihjZW50ZXIsIHJhZGl1cywgbnVtYmVyT2ZTZWdtZW50cykge1xuICB2YXIgbiA9IG51bWJlck9mU2VnbWVudHMgPyBudW1iZXJPZlNlZ21lbnRzIDogMzI7XG4gIHZhciBmbGF0Q29vcmRpbmF0ZXMgPSBbXTtcbiAgdmFyIGNvb3JkaW5hdGVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgZmxhdENvb3JkaW5hdGVzLnB1c2guYXBwbHkoZmxhdENvb3JkaW5hdGVzLCBvZmZzZXQoY2VudGVyLCByYWRpdXMsIDIgKiBNYXRoLlBJICogaSAvIG4pKTtcbiAgfVxuICBmbGF0Q29vcmRpbmF0ZXMucHVzaChmbGF0Q29vcmRpbmF0ZXNbMF0sIGZsYXRDb29yZGluYXRlc1sxXSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBqIDwgZmxhdENvb3JkaW5hdGVzLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgY29vcmRpbmF0ZXNbaSsrXSA9IGZsYXRDb29yZGluYXRlcy5zbGljZShqLCBqICsgMik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW2Nvb3JkaW5hdGVzLnJldmVyc2UoKV1cbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGltYWdlRGV0YWlsID0ge1xuICAgIHRyaWdnZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5vcGVuRGV0YWlsJyksXG4gICAgZGV0YWlsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGV0YWlsJyksXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWxJbWcgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF07XG4gICAgICB0aGlzLmRldGFpbFRleHQgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpWzBdO1xuICAgICAgdGhpcy5kZXRhaWxDbG9zZUJ0biA9IHRoaXMuZGV0YWlsLnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cENsb3NlQnV0dG9uJyk7XG5cbiAgICAgIHRoaXMudHJpZ2dlci5mb3JFYWNoKGVsZW0gPT4ge1xuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLm9wZW5EZXRhaWwoZWxlbS5kYXRhc2V0LmltYWdlLCBlbGVtLmRhdGFzZXQudGV4dCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRldGFpbENsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZURldGFpbCgpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5kZXRhaWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlRGV0YWlsKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb3BlbkRldGFpbDogZnVuY3Rpb24gKGltZywgdGV4dCA9ICcnKSB7XG4gICAgICAvLyBBZGQgaW1hZ2UgdG8gcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbEltZy5zcmMgPSBpbWc7XG4gICAgICB0aGlzLmRldGFpbEltZy5hbHQgPSB0ZXh0O1xuICAgICAgdGhpcy5kZXRhaWxUZXh0LnRleHRDb250ZW50ID0gdGV4dDtcblxuICAgICAgLy8gU2hvdyB0aGUgcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbC5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSxcbiAgICBjbG9zZURldGFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWwuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH1cbiAgfTtcblxuICBpbWFnZURldGFpbC5pbml0KCk7XG59KSgpO1xuIiwiLy8gUmVxdWlyZSBKUyBmaWxlczpcbnZhciBjaXJjbGVUb1BvbHlnb24gPSByZXF1aXJlKCcuL2NpcmNsZXRvcG9seWdvbi5qcycpO1xudmFyIHRvV0tUID0gcmVxdWlyZSgnLi90b3drdC5qcycpO1xudmFyIHNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoLmpzJyk7XG5cbi8vIERlbGV0ZSBsZWFmbGV0IGxvZ29cbi8vIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoICdsZWFmbGV0LWNvbnRyb2wtYXR0cmlidXRpb24nIClbMF0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuLy8gU2V0IGdsb2JhbCB3a3QgdmFyaWFibGU6XG52YXIgaW5wdXRDaXJjbGU7XG5cbihmdW5jdGlvbigpe1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBtYXAgPSB7XG5cdFx0c2VhcmNoYmFyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInNlYXJjaExvY2F0aW9uXCJdJyksXG5cdFx0c2VsZWN0UmFkaXVzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkaXVzLXNlbGVjdGVkJyksXG5cdFx0bWFwYm94QWNjZXNzVG9rZW46ICdway5leUoxSWpvaWJXRjRaR1YyY21sbGN6azFJaXdpWVNJNkltTnFaV1p5ZFdreU5qRjNOWG95ZDI4emNYRnFkREp2YmpFaWZRLkRsM0R2dUZFcUhWQXhmYWpnMEVTV2cnLFxuXHRcdG1hcDogTC5tYXAoJ21hcCcsIHtcblx0XHRcdHpvb21Db250cm9sOiBmYWxzZVxuXHRcdH0pLFxuXHRcdGNpcmNsZTogTC5jaXJjbGUoe1xuXHRcdFx0Y29sb3I6ICcjREExMjFBJyxcblx0XHRcdGZpbGxDb2xvcjogJyNEQTEyMUEnLFxuXHRcdFx0ZmlsbE9wYWNpdHk6IDAuNCxcblx0XHRcdHJhZGl1czogNTAwLzJcblx0XHR9KSxcblx0XHRwb2x5Z29uOiBMLnBvbHlnb24oe1xuXHRcdFx0Y29sb3I6ICcjREExMjFBJ1xuXHRcdH0pLFxuXHRcdGdlb0pTT046IEwuZ2VvSlNPTigpLFxuXHRcdGNlbnRlclBvaW50OiBbXG5cdFx0XHQ1Mi4zNzAyMTYsXG5cdFx0XHQ0Ljg5NTE2OFxuXHRcdF0sXG5cdFx0c3RhcnRQb3M6IHsgeDogMCwgeTogMCB9LFxuXHRcdGN1cnJlbnRQb3M6IHsgeDogMCwgeTogMCB9LFxuXHRcdGluaXQ6IGFzeW5jIGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIFNldCB0aGUgb3JpZ2luYWwgdmlldyBvZiB0aGUgbWFwOlxuXHRcdFx0dGhpcy5tYXAuc2V0Vmlldyh0aGlzLmNlbnRlclBvaW50LCAxNCk7XG5cblx0XHRcdEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0ucG5nP2FjY2Vzc190b2tlbj0nICsgdGhpcy5tYXBib3hBY2Nlc3NUb2tlbiwge1xuXHRcdFx0XHRtaW5ab29tOiAxMSxcblx0XHRcdFx0bWF4Wm9vbTogMjAsXG5cdFx0XHRcdGlkOiAnbWFwYm94LmxpZ2h0J1xuXHRcdFx0fSkuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0XHRMLmNvbnRyb2wuem9vbSh7XG5cdFx0XHRcdHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnXG5cdFx0XHR9KS5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRcdC8vIEluaXRpYWxpemUgdGhlIGNpcmNsZTpcblx0XHRcdHRoaXMuY2lyY2xlXG5cdFx0XHRcdC5zZXRMYXRMbmcodGhpcy5jZW50ZXJQb2ludClcblx0XHRcdFx0LnNldFJhZGl1cygyNTApXG5cdFx0XHRcdC5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRcdC8vIEluaXRpYWxpemUgY2lyY2xlIGV2ZW50czpcblx0XHRcdHRoaXMuY2hhbmdlUmFkaXVzKCk7XG5cblx0XHRcdC8vIENyZWF0ZSB0aGUgcG9seWdvbiwgd2l0aCB0aGUgY2VudGVyUG9pbnQgYXMgY29vcmRzOlxuXHRcdFx0dGhpcy5jcmVhdGVQb2x5Z29uKHRoaXMuY2VudGVyUG9pbnQpO1xuXG5cdFx0XHQvLyBHZXQgYWxsIHRoZSBzdHJlZXRzOlxuXHRcdFx0dmFyIGFsbFN0cmVldHMgPSBhd2FpdCB0aGlzLmdldEFsbFN0cmVldHMoKTtcblxuXHRcdFx0Ly8gTWFwIHRoZSBzdHJlZXQgbmFtZXMgZnJvbSBhbGxTdHJlZXRzIGZvciBzZWFyY2g6XG5cdFx0XHR2YXIgc3RyZWV0TmFtZXMgPSBhbGxTdHJlZXRzLm1hcChzdHJlZXQgPT4gc3RyZWV0LnByb3BlcnRpZXMubmFtZSk7XG5cblx0XHRcdC8vIEluaXRpYWxpemUgdGhlIGF1dG9jb21wbGV0ZSBzZWFyY2g6XG5cdFx0XHRzZWFyY2guaW5pdCh0aGlzLnNlYXJjaGJhciwgc3RyZWV0TmFtZXMpO1xuXG5cdFx0XHQvLyBBZGQgdGhlIHN0cmVldHMgZGF0YSB0byBnZW9KU09OOlxuXHRcdFx0dGhpcy5nZW9KU09OLmFkZERhdGEoYWxsU3RyZWV0cyk7XG5cblx0XHRcdC8vIERyYWdnaW5nIHRoZSBjaXJjbGU6XG5cdFx0XHR2YXIgZHJhZ2dhYmxlID0gbmV3IEwuRHJhZ2dhYmxlKHRoaXMuY2lyY2xlLl9wYXRoKTtcblx0XHRcdGRyYWdnYWJsZS5lbmFibGUoKTtcblxuXHRcdFx0dGhpcy5zdGFydFBvcy54ID0gdGhpcy5jaXJjbGUuX3BvaW50Lng7XG5cdFx0XHR0aGlzLnN0YXJ0UG9zLnkgPSB0aGlzLmNpcmNsZS5fcG9pbnQueTtcblxuXHRcdFx0Ly8gQ2FsY3VsYXRlIHRoZSBuZXcgY2VudGVyOlxuXHRcdFx0ZHJhZ2dhYmxlLm9uKCdkcmFnJywgKGUpID0+IHtcblx0XHRcdFx0dGhpcy5jdXJyZW50UG9zLnggPSBlLnNvdXJjZVRhcmdldC5fbmV3UG9zLng7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBvcy55ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy55O1xuXHRcdFx0XHR0aGlzLm1vdmVDaXJjbGUoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLm1hcC5vbignem9vbScsIChlKSA9PiB7XG5cdFx0XHRcdHZhciBuZXdab29tTGV2ZWwgPSBOdW1iZXIoZS5zb3VyY2VUYXJnZXQuX2FuaW1hdGVUb1pvb20pO1xuXHRcdFx0XHR2YXIgbGF5ZXJQb2ludCA9IHRoaXMubWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLmNlbnRlclBvaW50KTtcblx0XHRcdFx0dGhpcy5tYXAuc2V0Vmlldyh0aGlzLmNlbnRlclBvaW50LCBuZXdab29tTGV2ZWwpO1xuXHRcdFx0XHR0aGlzLnN0YXJ0UG9zLnggPSBsYXllclBvaW50LnggLSB0aGlzLmN1cnJlbnRQb3MueDtcblx0XHRcdFx0dGhpcy5zdGFydFBvcy55ID0gbGF5ZXJQb2ludC55IC0gdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0XHRcdHRoaXMubW92ZUNpcmNsZSgpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRnZXRBbGxTdHJlZXRzOiBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZmV0Y2goJy9qcy9zdHJlZXRzLmpzb24nKVxuXHRcdFx0XHQudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcblx0XHRcdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0fSk7XG5cdFx0fSxcblx0XHRjaGFuZ2VSYWRpdXM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuc2VsZWN0UmFkaXVzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG5cdFx0XHRcdHZhciBsYXRsbmcgPSB0aGlzLmNpcmNsZS5nZXRMYXRMbmcoKTtcblx0XHRcdFx0dmFyIG1ldGVycyA9IChlLnRhcmdldC52YWx1ZSAvIDIpICogMTAwMDtcblx0XHRcdFx0dGhpcy5jcmVhdGVDaXJjbGUoT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCBtZXRlcnMpO1xuXHRcdFx0XHR0aGlzLmNyZWF0ZVBvbHlnb24odGhpcy5jZW50ZXJQb2ludCwgbWV0ZXJzKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW92ZUNpcmNsZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHggPSB0aGlzLnN0YXJ0UG9zLnggKyB0aGlzLmN1cnJlbnRQb3MueDtcblx0XHRcdHZhciB5ID0gdGhpcy5zdGFydFBvcy55ICsgdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0XHR2YXIgcG9pbnQgPSB7IHg6IHgsIHk6IHkgfTtcblx0XHRcdHZhciBsYXRsbmcgPSB0aGlzLm1hcC5sYXllclBvaW50VG9MYXRMbmcocG9pbnQpO1xuXHRcdFx0dmFyIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpO1xuXG5cdFx0XHQvLyBDcmVhdGUgdGhlIG5ldyBwb2x5Z29uOlxuXHRcdFx0dGhpcy5jZW50ZXJQb2ludCA9IE9iamVjdC52YWx1ZXMobGF0bG5nKTtcblx0XHRcdHRoaXMuY3JlYXRlQ2lyY2xlKE9iamVjdC52YWx1ZXMobGF0bG5nKSwgcmFkaXVzKTtcblx0XHRcdHRoaXMuY3JlYXRlUG9seWdvbihPYmplY3QudmFsdWVzKGxhdGxuZyksIHJhZGl1cyk7XG5cdFx0XHRMLkRvbVV0aWwuc2V0VHJhbnNmb3JtKHRoaXMuY2lyY2xlLl9wYXRoLCB7IHg6IDAsIHk6IDAgfSk7XG5cdFx0fSxcblx0XHRjcmVhdGVDaXJjbGU6IGZ1bmN0aW9uIChjb29yZHMsIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpKSB7XG5cdFx0XHR0aGlzLmNpcmNsZS5zZXRMYXRMbmcoY29vcmRzKTtcblx0XHRcdHRoaXMuY2lyY2xlLnNldFJhZGl1cyhyYWRpdXMpO1xuXHRcdH0sXG5cdFx0Y3JlYXRlUG9seWdvbjogZnVuY3Rpb24gKGNvb3JkcywgcmFkaXVzID0gdGhpcy5jaXJjbGUuZ2V0UmFkaXVzKCksIG51bWJlck9mRWRnZXMgPSAxMCkge1xuXHRcdFx0Ly9sZWFmbGV0IHBvbHlnb24gdG8gd2t0XG5cdFx0XHR2YXIgcG9seWdvbkNvb3JkcyA9IGNpcmNsZVRvUG9seWdvbihjb29yZHMsIHJhZGl1cywgbnVtYmVyT2ZFZGdlcyk7XG5cblx0XHRcdC8vIFNldCB0aGUgbmV3IGNvb3Jkczpcblx0XHRcdHRoaXMucG9seWdvblxuXHRcdFx0XHQuc2V0TGF0TG5ncyhwb2x5Z29uQ29vcmRzLmNvb3JkaW5hdGVzWzBdKTtcblxuXHRcdFx0Ly8gQ3JlYXRlIGEgd2t0IGZyb20gdGhlIHBvbHlnb246XG5cdFx0XHRpbnB1dENpcmNsZSA9IHtcblx0XHRcdFx0d2t0OiB0b1dLVCh0aGlzLnBvbHlnb24pLFxuXHRcdFx0XHRjb29yZHM6IGNvb3Jkc1xuXHRcdFx0fTtcblx0XHR9XG5cdH07XG5cblx0bWFwLmluaXQoKTtcblxuXHRleHBvcnRzLnNlbGVjdGVkU3RyZWV0ID0gZnVuY3Rpb24gKHN0cmVldE5hbWUpIHtcblx0XHRtYXAuZ2VvSlNPTi5lYWNoTGF5ZXIobGF5ZXIgPT4ge1xuXHRcdFx0aWYgKGxheWVyLmZlYXR1cmUucHJvcGVydGllcy5uYW1lID09PSBzdHJlZXROYW1lKSB7XG5cdFx0XHRcdHZhciBib3VuZHMgPSBsYXllci5nZXRCb3VuZHMoKTtcblx0XHRcdFx0dmFyIGNlbnRlciA9IGJvdW5kcy5nZXRDZW50ZXIoKTtcblxuXHRcdFx0XHR2YXIgbGF5ZXJQb2ludCA9IG1hcC5tYXAubGF0TG5nVG9MYXllclBvaW50KFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSk7XG5cdFx0XHRcdG1hcC5tYXAuc2V0VmlldyhbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10sIDE0KTtcblxuXHRcdFx0XHRtYXAuc3RhcnRQb3MueCA9IGxheWVyUG9pbnQueCAtIG1hcC5jdXJyZW50UG9zLng7XG5cdFx0XHRcdG1hcC5zdGFydFBvcy55ID0gbGF5ZXJQb2ludC55IC0gbWFwLmN1cnJlbnRQb3MueTtcblxuXHRcdFx0XHRtYXAubW92ZUNpcmNsZSgpO1xuXHRcdFx0XHRtYXAuY3JlYXRlQ2lyY2xlKFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSk7XG5cdFx0XHRcdG1hcC5jcmVhdGVQb2x5Z29uKFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pKCk7XG5cbmV4cG9ydHMuaW5wdXRDaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBpbnB1dENpcmNsZTtcbn1cbiIsInZhciBtYXAgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuXG4oZnVuY3Rpb24gKCkge1xuICB2YXIgbmV3U3RvcnkgPSB7XG4gICAgZm9ybTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN1Ym1pdC1sb2NhdGlvbi1hbmQtdGltZXN0YW1wJyksXG4gICAgdGltZXN0YW1wTWluOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInRpbWVzdGFtcC1taW5cIl0nKSxcbiAgICB0aW1lc3RhbXBNYXg6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tuYW1lPVwidGltZXN0YW1wLW1heFwiXScpLFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZSkgPT4ge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAndmFsTWluJzogdGhpcy50aW1lc3RhbXBNaW4udmFsdWUsXG4gICAgICAgICAgJ3ZhbE1heCc6IHRoaXMudGltZXN0YW1wTWF4LnZhbHVlLFxuICAgICAgICAgICd3a3QnOiBtYXAuaW5wdXRDaXJjbGUoKS53a3QsXG4gICAgICAgICAgJ2Nvb3Jkcyc6IG1hcC5pbnB1dENpcmNsZSgpLmNvb3Jkc1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHZhciB1cmwgPSAnL2NyZWF0ZS1zdG9yeSc7XG5cbiAgICAgICAgaHR0cC5vcGVuKCdwb3N0JywgdXJsLCB0cnVlKTtcbiAgICAgICAgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoaHR0cC5yZWFkeVN0YXRlID09IDQgJiYgaHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhodHRwLnJlc3BvbnNlVVJMKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGh0dHAucmVzcG9uc2VVUkw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGh0dHAuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBuZXdTdG9yeS5pbml0KCk7XG59KSgpO1xuIiwidmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwLmpzJyk7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBzZWFyY2ggPSB7XG4gICAgY3VycmVudEZvY3VzOiAwLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzZWFyY2hiYXIsIGRhdGEpIHtcbiAgICAgIC8vIEFkZCB0aGUgZ2l2ZW4gc2VhcmNoYmFyIHRvIHRoaXMgb2JqZWN0OlxuICAgICAgdGhpcy5zZWFyY2hiYXIgPSBzZWFyY2hiYXI7XG5cbiAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciBpbnB1dCB2YWx1ZTpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoKTtcbiAgICAgICAgaWYgKCFlLnRhcmdldC52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cyA9IC0xO1xuICAgICAgICB0aGlzLmdldEF1dG9jb21wbGV0ZShkYXRhLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgZm9yIGtleWJvYXJkIGZ1bmN0aW9uczpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtaXRlbXMnKTtcblxuICAgICAgICBpZiAobGlzdCkgbGlzdCA9IGxpc3QucXVlcnlTZWxlY3RvckFsbCgnbGknKTtcblxuICAgICAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgICAgICAgIGNhc2UgNDA6XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cysrO1xuICAgICAgICAgICAgdGhpcy5hZGRBY3RpdmUobGlzdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMtLTtcbiAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZlKGxpc3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA+IC0xKSB7XG4gICAgICAgICAgICAgIGlmIChsaXN0KSBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgZm9yIGNsaWNraW5nIHNlYXJjaCBidXR0b246XG4gICAgICB0aGlzLnNlYXJjaGJhci5wYXJlbnROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnNlYXJjaGJhci52YWx1ZTtcbiAgICAgICAgdGhpcy5nZXRBdXRvY29tcGxldGUoZGF0YSwgdmFsKTtcblxuICAgICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIudG9VcHBlckNhc2UoKSA9PSB2YWwudG9VcHBlckNhc2UoKSk7XG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCkgbWFwLnNlbGVjdGVkU3RyZWV0KHJlc3VsdHNbMF0pO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBFdmVudCBsaXN0ZW5lciB3aGVuIGNsaWNraW5nIHRoZSBkb2N1bWVudDpcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoZS50YXJnZXQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChkYXRhLCB2YWwpIHtcbiAgICAgIC8vIENoZWNrIHdoYXQgZGF0YSBtYXRjaGVzIHRoZSBzZWFyY2ggcXVlcnk6XG4gICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIuc3Vic3RyKDAsIHZhbC5sZW5ndGgpLnRvVXBwZXJDYXNlKCkgPT0gdmFsLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgdGhpcy5zZXRBdXRvY29tcGxldGUocmVzdWx0cyk7XG4gICAgfSxcbiAgICBzZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChyZXN1bHRzKSB7XG4gICAgICB2YXIgYXV0b2NvbXBsZXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZScpO1xuICAgICAgdmFyIHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgdWwuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWl0ZW1zJyk7XG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCh1bCk7XG5cbiAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XG4gICAgICAgIGlmIChpIDwgMTApIHtcbiAgICAgICAgICB2YXIgY2xvbmVMaSA9IGxpLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICB2YXIgY2xvbmVBID0gYS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICB1bC5hcHBlbmRDaGlsZChjbG9uZUxpKTtcblxuICAgICAgICAgIGNsb25lQS50ZXh0Q29udGVudCA9IHJlc3VsdDtcbiAgICAgICAgICBjbG9uZUEuaHJlZiA9ICcjJztcbiAgICAgICAgICBjbG9uZUxpLmFwcGVuZENoaWxkKGNsb25lQSk7XG5cbiAgICAgICAgICBjbG9uZUxpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoYmFyLnZhbHVlID0gZS50YXJnZXQudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICB0aGlzLmNsb3NlTGlzdCgpO1xuICAgICAgICAgICAgbWFwLnNlbGVjdGVkU3RyZWV0KGUudGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBhdXRvY29tcGxldGUuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgIH0sXG4gICAgYWRkQWN0aXZlOiBmdW5jdGlvbiAobGlzdCkge1xuICAgICAgaWYgKCFsaXN0KSByZXR1cm4gZmFsc2U7XG4gICAgICB0aGlzLnJlbW92ZUFjdGl2ZShsaXN0KTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA+PSBsaXN0Lmxlbmd0aCkgdGhpcy5jdXJyZW50Rm9jdXMgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VycmVudEZvY3VzIDwgMCkgdGhpcy5jdXJyZW50Rm9jdXMgPSAobGlzdC5sZW5ndGggLSAxKTtcbiAgICAgIHRoaXMuc2VhcmNoYmFyLnZhbHVlID0gbGlzdFt0aGlzLmN1cnJlbnRGb2N1c10uY2hpbGRyZW5bMF0udGV4dENvbnRlbnQ7XG4gICAgICBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS5jbGFzc0xpc3QuYWRkKCdhdXRvY29tcGxldGUtYWN0aXZlJyk7XG4gICAgfSxcbiAgICByZW1vdmVBY3RpdmU6IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlzdFtpXS5jaGlsZHJlblswXS5jbGFzc0xpc3QucmVtb3ZlKCdhdXRvY29tcGxldGUtYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9zZUxpc3Q6IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICB2YXIgbGlzdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYXV0b2NvbXBsZXRlLWl0ZW1zJyk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGVsZW0gIT0gbGlzdHNbaV0gJiYgZWxlbSAhPSB0aGlzLnNlYXJjaGJhcikge1xuICAgICAgICAgIGxpc3RzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGlzdHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gc2VhcmNoO1xuXG59KSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b1dLVCAobGF5ZXIpIHtcblx0XHR2YXIgbG5nLCBsYXQsIGNvb3JkcyA9IFtdO1xuXHRcdGlmIChsYXllciBpbnN0YW5jZW9mIEwuUG9seWdvbiB8fCBsYXllciBpbnN0YW5jZW9mIEwuUG9seWxpbmUpIHtcblx0XHRcdHZhciBsYXRsbmdzID0gbGF5ZXIuZ2V0TGF0TG5ncygpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGF0bG5ncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgbGF0bG5nczEgPSBsYXRsbmdzW2ldO1xuXHRcdFx0XHRpZiAobGF0bG5nczEubGVuZ3RoKXtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBsYXRsbmdzMS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGNvb3Jkcy5wdXNoKGxhdGxuZ3MxW2pdLmxuZyArIFwiIFwiICsgbGF0bG5nczFbal0ubGF0KTtcblx0XHRcdFx0XHRpZiAoaiA9PT0gMCkge1xuXHRcdFx0XHRcdFx0bG5nID0gbGF0bG5nczFbal0ubG5nO1xuXHRcdFx0XHRcdFx0bGF0ID0gbGF0bG5nczFbal0ubGF0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fX1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29vcmRzLnB1c2gobGF0bG5nc1tpXS5sbmcgKyBcIiBcIiArIGxhdGxuZ3NbaV0ubGF0KTtcblx0XHRcdFx0XHRpZiAoaSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0bG5nID0gbGF0bG5nc1tpXS5sbmc7XG5cdFx0XHRcdFx0XHRsYXQgPSBsYXRsbmdzW2ldLmxhdDtcblx0XHRcdFx0XHR9fVxuXHRcdH07XG5cdFx0XHRpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlnb24pIHtcblx0XHRcdFx0cmV0dXJuIFwiUE9MWUdPTigoXCIgKyBjb29yZHMuam9pbihcIixcIikgKyBcIixcIiArIGxuZyArIFwiIFwiICsgbGF0ICsgXCIpKVwiO1xuXHRcdFx0fSBlbHNlIGlmIChsYXllciBpbnN0YW5jZW9mIEwuUG9seWxpbmUpIHtcblx0XHRcdFx0cmV0dXJuIFwiTElORVNUUklORyhcIiArIGNvb3Jkcy5qb2luKFwiLFwiKSArIFwiKVwiO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLk1hcmtlcikge1xuXHRcdFx0cmV0dXJuIFwiUE9JTlQoXCIgKyBsYXllci5nZXRMYXRMbmcoKS5sbmcgKyBcIiBcIiArIGxheWVyLmdldExhdExuZygpLmxhdCArIFwiKVwiO1xuXHRcdH1cblx0fTtcbiJdfQ==
