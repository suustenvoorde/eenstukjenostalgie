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
    detailImg: document.querySelector('.detail img'),
    detailText: document.querySelector('.detail p'),
    detailCloseBtn: document.querySelector('.detail .popupCloseButton'),
    init: function () {
      var self = this;

      this.trigger.forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          self.openDetail(this.dataset.image, this.dataset.text);
        });
      });

      this.detailCloseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.closeDetail();
      });

      this.detail.addEventListener('click', function (e) {
        e.preventDefault();
        self.closeDetail();
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
		startPos: {x: 0, y: 0},
		currentPos: {x: 0, y: 0},
		init: async function () {
			var self = this;
			var searchbar = document.querySelector('[name="searchLocation"]');

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
			// this.moveCircle();

			// Create the polygon, with the centerPoint as coords:
			this.createPolygon(this.centerPoint);

			// Get all the streets:
			var allStreets = await this.getAllStreets();

			// Map the street names from allStreets for search:
			var streetNames = allStreets.map(function (street) {
				return street.properties.name;
			});

			// Initialize the autocomplete search:
			search.init(searchbar, streetNames);

			// Add the streets data to geoJSON:
			this.geoJSON.addData(allStreets);

			// Dragging the circle:
			var draggable = new L.Draggable(this.circle._path);
			draggable.enable();

			this.startPos.x = this.circle._point.x;
			this.startPos.y = this.circle._point.y;

			// Calculate the new center:
			draggable.on('drag', function (e) {
				self.currentPos.x = e.sourceTarget._newPos.x;
				self.currentPos.y = e.sourceTarget._newPos.y;
				self.moveCircle();
			});

			this.map.on('zoom', function (e) {
				var newZoomLevel = Number(e.sourceTarget._animateToZoom);
				var layerPoint = this.latLngToLayerPoint(self.centerPoint);
				this.setView(self.centerPoint, newZoomLevel);

				var circleX = layerPoint.x - self.currentPos.x;
				var circleY = layerPoint.y - self.currentPos.y;

				self.startPos.x = circleX;
				self.startPos.y = circleY;
				self.moveCircle();
			});
		},
		getAllStreets: async function () {
			return fetch('/js/streets.json')
				.then((res) => res.json())
				.catch(function (error) {
					console.log(error);
				})
		},
		changeRadius: function () {
			var self = this;
			var selectRadius = document.querySelector("#radius-selected");

			selectRadius.addEventListener("change", function(e) {
				var latlng = self.circle.getLatLng();
				var meters = e.target.value / 2 * 1000;
				self.createCircle(Object.values(latlng), meters);
				self.createPolygon(self.centerPoint, meters);
			});
		},
		moveCircle: function () {
			var x = this.startPos.x + this.currentPos.x;
			var y = this.startPos.y + this.currentPos.y;
			var point = {x: x, y: y};
			var latlng = this.map.layerPointToLatLng(point);
			var radius = this.circle.getRadius();

			// Create the new polygon:
			this.centerPoint = Object.values(latlng);
			this.createCircle(Object.values(latlng), radius);
			this.createPolygon(Object.values(latlng), radius);
			L.DomUtil.setTransform(this.circle._path, {x: 0, y: 0});
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
		map.geoJSON.eachLayer(function (layer) {
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

},{"./circletopolygon.js":1,"./search.js":6,"./towkt.js":7}],4:[function(require,module,exports){
// (function() {
// "use strict";
//
// var supportsMultiple = self.HTMLInputElement && "valueLow" in HTMLInputElement.prototype;
//
// var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
//
// self.multirange = function(input) {
// 	if (supportsMultiple || input.classList.contains("multirange")) {
// 		return;
// 	}
//
// 	var value = input.getAttribute("value");
// 	var values = value === null ? [] : value.split(",");
// 	var min = +(input.min || 0);
// 	var max = +(input.max || 100);
// 	var ghost = input.cloneNode();
//
// 	input.classList.add("multirange", "original");
// 	ghost.classList.add("multirange", "ghost");
//
// 	input.value = values[0] || min + (max - min) / 2;
// 	ghost.value = values[1] || min + (max - min) / 2;
//
// 	input.addEventListener('change', function(e){
// 		var min = document.getElementById('rangevalueMin');
// 		min.textContent = input.value.substr(0, 4);
//
// 		//dynamic range slider output
// 		var min = document.querySelector('input[type="range"]').min;
// 		var max = document.querySelector('input[type="range"]').max;
// 		var timestamp = max - min;
//
// 		var first = input;
// 		var second = ghost;
//
// 		var timestamp1 = Number(first.value.substr(0, 4)) - Number(min);
// 		var timestamp2 = Number(max) - Number(second.value.substr(0, 4));
// 		var percentageBar = timestamp1 / timestamp * 100;
//
// 		var textMin = document.querySelector('#rangevalueMin');
// 		textMin.style.top = 'calc(' + percentageBar  + '% + 25px)';
//
// 		console.log(percentageBar, textMin.style.top);
//
// 	});
//
// 	ghost.addEventListener('mousemove', function(){
// 		var max = document.getElementById('rangevalueMax');
// 		max.textContent = ghost.value;
//
// 		//dynamic range slider output
// 		var min = document.querySelector('input[type="range"]').min;
// 		var max = document.querySelector('input[type="range"]').max;
// 		var maxValue = Number(document.querySelector('#rangevalueMax').value);
// 		var timestamp1 = 1971 - min;
// 		var timestamp2 = max - 1976;
// 		var timestamp = timestamp1 + timestamp2;
// 		var maxHeight = ((max - maxValue) / timestamp) * 100;
// 		// var newPoint = (maxValue - min) / (max - min);
//
// 		document.querySelector('#rangevalueMax').style.bottom = 'calc(' + maxHeight  + 'vh - 5px)';
// 	});
//
// 	input.parentNode.insertBefore(ghost, input.nextSibling);
//
// 	Object.defineProperty(input, "originalValue", descriptor.get ? descriptor : {
// 		// Fuck you Safari >:(
// 		get: function() { return this.value; },
// 		set: function(v) { this.value = v; }
// 	});
//
// 	Object.defineProperties(input, {
// 		valueLow: {
// 			get: function() { return Math.min(this.originalValue, ghost.value); },
// 			set: function(v) { this.originalValue = v; },
// 			enumerable: true
// 		},
// 		valueHigh: {
// 			get: function() { return Math.max(this.originalValue, ghost.value); },
// 			set: function(v) { ghost.value = v; },
// 			enumerable: true
// 		}
// 	});
//
// 	if (descriptor.get) {
// 		// Again, fuck you Safari
// 		Object.defineProperty(input, "value", {
// 			get: function() { return this.valueLow + "," + this.valueHigh; },
// 			set: function(v) {
// 				var values = v.split(",");
// 				this.valueLow = values[0];
// 				this.valueHigh = values[1];
// 				update();
// 			},
// 			enumerable: true
// 		});
// 	}
//
// 	if (typeof input.oninput === "function") {
// 		ghost.oninput = input.oninput.bind(input);
// 	}
//
// 	function update() {
// 		ghost.style.setProperty("--low", 100 * ((input.valueLow - min) / (max - min)) + 1 + "%");
// 		ghost.style.setProperty("--high", 100 * ((input.valueHigh - min) / (max - min)) - 1 + "%");
// 	}
//
// 	input.addEventListener("input", update);
// 	ghost.addEventListener("input", update);
//
// 	update();
// }
//
// multirange.init = function() {
// 	[].slice.call(document.querySelectorAll("input[type=range][multiple]:not(.multirange)")).forEach(multirange);
// }
//
// if (document.readyState == "loading") {
// 	document.addEventListener("DOMContentLoaded", multirange.init);
// }
// else {
// 	multirange.init();
// }
//
// })();

},{}],5:[function(require,module,exports){
var map = require('./map.js');

(function () {
  var newStory = {
    form: document.querySelector('.submit-location-and-timestamp'),
    timestampMin: document.querySelector('[name="timestamp-min"]'),
    timestampMax: document.querySelector('[name="timestamp-max"]'),
    init: function () {
      var self = this;
      self.form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valMin = self.timestampMin.value;
        var valMax = self.timestampMax.value;

        var data = {
          'valMin': valMin,
          'valMax': valMax,
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
      });
    }
  };

  newStory.init();
})();

},{"./map.js":3}],6:[function(require,module,exports){
var map = require('./map.js');

(function () {

  'use strict';

  var search = {
    currentFocus: 0,
    init: function (searchbar, data) {
      var self = this;

      // Add the given searchbar to this object:
      this.searchbar = searchbar;

      // Event listener for input value:
      this.searchbar.addEventListener('input', function () {
        self.closeList();
        if (!this.value) return false;
        self.currentFocus = -1;
        self.getAutocomplete(data, this.value);
      });

      // Event listener for keyboard functions:
      this.searchbar.addEventListener('keydown', function (e) {
        var list = document.querySelector('.autocomplete-items');

        if (list) list = list.querySelectorAll('li');

        switch (e.keyCode) {
          case 40:
            self.currentFocus++;
            self.addActive(list);
            break;
          case 38:
            self.currentFocus--;
            self.addActive(list);
            break;
          case 13:
            e.preventDefault();
            if (self.currentFocus > -1) {
              if (list) list[self.currentFocus].children[0].click();
            }
        }
      });

      // Event for clicking search button:
      this.searchbar.parentNode.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = self.searchbar.value;
        self.getAutocomplete(data, val);

        var results = data.filter(function (str) {
          if (str.toUpperCase() == val.toUpperCase()) {
            return str;
          }
        });

        if (results.length) {
          map.selectedStreet(results[0]);
        }
      });

      // Event listener when clicking the document:
      document.addEventListener('click', function (e) {
        self.closeList(e.target);
      });
    },
    getAutocomplete: function (data, val) {
      // Check what data matches the search query:
      var results = data.filter(function (str) {
        if (str.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          return str;
        }
      });
      this.setAutocomplete(results);
    },
    setAutocomplete: function (results) {
      var self = this;
      var autocomplete = document.querySelector('.autocomplete');
      var ul = document.createElement('ul');

      ul.setAttribute('class', 'autocomplete-items');

      autocomplete.appendChild(ul);

      results.forEach(function (result, i) {
        if (i < 10) {
          var li = document.createElement('li');
          var a = document.createElement('a');

          ul.appendChild(li);

          a.textContent = result;
          a.href = '#';
          li.appendChild(a);

          li.addEventListener('click', function (e) {
            e.preventDefault();
            self.searchbar.value = this.textContent;
            self.closeList();
            map.selectedStreet(this.textContent);
          });
        }
      });
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
    closeList: function (el) {
      var lists = document.querySelectorAll('.autocomplete-items');

      for (var i = 0; i < lists.length; i++) {
        if (el != lists[i] && el != this.searchbar) {
          lists[i].parentNode.removeChild(lists[i]);
        }
      }
    }
  };

  module.exports = search;

})();

},{"./map.js":3}],7:[function(require,module,exports){
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

},{}]},{},[1,2,3,4,5,6,7]);
