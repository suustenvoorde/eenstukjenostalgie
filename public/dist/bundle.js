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
    trigger2: document.querySelectorAll('.data-image img'),
    detail: document.querySelector('.detail'),
    init: function () {
      this.detailImg = this.detail.getElementsByTagName('img')[0];
      this.detailText = this.detail.getElementsByTagName('p')[0];
      this.detailCloseBtn = this.detail.querySelector('.popupCloseButton');

      this.trigger2.forEach(elem => {
        elem.addEventListener('click', (e) => {
          console.log(elem)
          this.openDetail(elem.src, elem.alt);
        });
      });

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
(function () {
  const instructionSlides = {
    instructions: document.querySelector('.instructions'),
    goTo: function (id) {
      const activeSlide = this.slides.find(slide => slide.classList.contains('active'));
      const activeStep = this.steps.find(step => step.classList.contains('active'));
      const currentSlide = document.getElementById(id);
      const currentStep = this.steps.find(step => step.href.includes(id));

      // Remove classList active on active slide and step:
      activeSlide.classList.remove('active');
      activeStep.classList.remove('active');

      // Add classList active on current slide and step:
      currentSlide.classList.add('active');
      currentStep.classList.add('active');
    },
    init: function () {
      this.slides = Array.from(this.instructions.querySelectorAll('.slide'));
      this.slideLinks = Array.from(this.instructions.querySelectorAll('.slide-link'));
      this.steps = Array.from(this.instructions.querySelectorAll('.steps .slide-link'));
      this.instructionBtn = this.instructions.querySelector('.action-btn');

      this.slideLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.href.slice(link.href.indexOf('#') + 1);
          this.goTo(href);
          e.preventDefault();
        });
      });
    }
  };

  instructionSlides.init();
}) ();

},{}],4:[function(require,module,exports){
const loader = {
  elem: document.querySelector('.loader'),
  show: function () {
    this.elem.classList.add('show');
  }
};

module.exports = loader;

},{}],5:[function(require,module,exports){
// Require JS files:
var circleToPolygon = require('./circletopolygon.js');
var toWKT = require('./towkt.js');
var search = require('./search.js');

var inputCircle;

(function () {
	const map = {
		mapElem: document.getElementById('map'),
		searchbar: document.querySelector('.searchbar'),
		radiusSelect: document.querySelector('.radius-select'),
		mapboxAccessToken: 'pk.eyJ1IjoibWF4ZGV2cmllczk1IiwiYSI6ImNqZWZydWkyNjF3NXoyd28zcXFqdDJvbjEifQ.Dl3DvuFEqHVAxfajg0ESWg',
		map: L.map('map', {
			zoomControl: false
		}),
		circle: L.circle(),
		polygon: L.polygon({
			color: '#0000FF'
		}),
		geoJSON: L.geoJSON(),
		centerLatLng: [ 52.370216, 4.895168 ],
		startPos: { x: 0, y: 0 },
		currentPos: { x: 0, y: 0 },
		distance: { x: 0, y: 0 },
		mapSize: { x: 0, y: 0 },
		moveRadiusSelect: function (point) {
			this.radiusSelect.style.left = (this.mapElem.offsetLeft + point.x) + 'px';
			this.radiusSelect.style.top = (this.mapElem.offsetTop + point.y) + 'px';
		},
		init: async function () {
			// Set the original view of the map:
			this.map.setView(this.centerLatLng, 14);

			// Give the map the correct style:
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + this.mapboxAccessToken, {
				minZoom: 11,
				maxZoom: 20,
				id: 'mapbox.light'
			}).addTo(this.map);

			// Add zoom control to bottomright of the map:
			L.control.zoom({
				position: 'bottomright'
			}).addTo(this.map);

			// Add the circle to the map
			this.circle
				.setLatLng(this.centerLatLng)
				.setRadius(this.radiusSelect.value / 2)
				.addTo(this.map);

			// Initialize circle events:
			this.changeRadius();

			// Create the polygon, with the centerPoint as coords:
			this.createPolygon(this.centerLatLng);

			// Get all the streets:
			var allStreets = await this.getAllStreets();

			// Map the street names from allStreets for search:
			var streetNames = allStreets.map(street => street.properties.name);

			// Initialize the autocomplete search:
			search.init(this.searchbar, streetNames);

			// Add the streets data to geoJSON:
			this.geoJSON.addData(allStreets);

			// Make the circle draggable:
			var draggableCircle = new L.Draggable(this.circle._path);
			draggableCircle.enable();

			// Add start and current position:
			this.startPos.x = this.circle._point.x;
			this.startPos.y = this.circle._point.y;
			// this.moveRadiusSelect(this.startPos);

			// var originCenterPoint = this.map.latLngToLayerPoint(this.centerLatLng);

			// On circle drag:
			draggableCircle.on('drag', (e) => {
				this.currentPos.x = e.sourceTarget._newPos.x;
				this.currentPos.y = e.sourceTarget._newPos.y;
				this.moveCircle();
			});

			// On map zoom:
			this.map.on('zoom', (e) => {
				var newZoomLevel = Number(e.sourceTarget._animateToZoom);
				var layerPoint = this.map.latLngToLayerPoint(this.centerLatLng);
				this.map.setView(this.centerLatLng, newZoomLevel);
				this.startPos.x = layerPoint.x - this.currentPos.x;
				this.startPos.y = layerPoint.y - this.currentPos.y;
				this.moveCircle();
			});

			// Following code is to let radius select follow the circle:

			// // On map drag:
			// this.map.on('drag', (e) => {
			// 	this.currentPos.x = this.startPos.x + e.sourceTarget._newPos.x - this.distance.x - this.mapSize.x;
			// 	this.currentPos.y = this.startPos.y + e.sourceTarget._newPos.y - this.distance.y - this.mapSize.y;
			// 	this.moveRadiusSelect(this.currentPos);
			// });
			//
			// // On map dragend:
			// this.map.on('dragend', (e) => {
			// 	this.startPos.x = this.currentPos.x;
			// 	this.startPos.y = this.currentPos.y;
			//
			// 	this.distance.x = e.sourceTarget._newPos.x;
			// 	this.distance.y = e.sourceTarget._newPos.y;
			// });
			//
			// // On map zoomend:
			// this.map.on('zoomend', (e) => {
			// 	var newZoomLevel = Number(e.sourceTarget._animateToZoom);
			// 	var newCenterPoint = this.map.latLngToLayerPoint(this.centerLatLng);
			//
			// 	this.map.setView(this.centerLatLng, newZoomLevel);
			//
			// 	this.startPos.x = originCenterPoint.x + this.mapSize.x;
			// 	this.startPos.y = originCenterPoint.y + this.mapSize.y;
			//
			// 	this.distance.x = originCenterPoint.x - newCenterPoint.x;
			// 	this.distance.y = originCenterPoint.y - newCenterPoint.y;
			//
			// 	this.moveRadiusSelect(this.startPos);
			// 	var latLng = this.map.layerPointToLatLng(this.currentPos);
			// 	this.createPolygon([latLng.lat, latLng.lng]);
			// });
			//
			// // On map resize:
			// this.map.on('resize', (e) => {
			// 	var size = {
			// 		x: (e.newSize.x - e.oldSize.x) / 2,
			// 		y: (e.newSize.y - e.oldSize.y) / 2
			// 	};
			//
			// 	this.startPos.x += size.x;
			// 	this.startPos.y += size.y;
			//
			// 	this.mapSize.x += size.x;
			// 	this.mapSize.y += size.y;
			//
			// 	this.moveRadiusSelect(this.startPos);
			// });
			//
			// // On circle dragend:
			// draggableCircle.on('dragend', (e) => {
			// 	this.startPos.x = this.currentPos.x;
			// 	this.startPos.y = this.currentPos.y;
			//
			// 	this.distance.x = e.sourceTarget._newPos.x;
			// 	this.distance.y = e.sourceTarget._newPos.y;
			//
			// 	// Move polygon to circle's location:
			// 	var latLng = this.map.layerPointToLatLng(this.currentPos);
			// 	this.createPolygon([latLng.lat, latLng.lng]);
			// });
		},
		getAllStreets: async function () {
			return fetch('/js/streets.json')
				.then(res => res.json())
				.catch(err => {
					console.log(err);
				});
		},
		changeRadius: function () {
			this.radiusSelect.addEventListener('change', (e) => {
				var latlng = this.circle.getLatLng();
				var meters = e.target.value / 2;
				this.createCircle(Object.values(latlng), meters);
				this.createPolygon(this.centerLatLng, meters);
			});
		},
		moveCircle: function () {
			var x = this.startPos.x + this.currentPos.x;
			var y = this.startPos.y + this.currentPos.y;
			var point = { x: x, y: y };
			var latlng = this.map.layerPointToLatLng(point);
			var radius = this.circle.getRadius();

			// Create the new polygon:
			this.centerLatLng = Object.values(latlng);
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
				// .addTo(this.map) // Remove for production
				// .bringToBack(); // Remove for production

			// Create a wkt from the polygon:
			inputCircle = {
				wkt: toWKT(this.polygon),
				coords: coords
			};
		},
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
}) ();

exports.inputCircle = function () {
	return inputCircle;
}

},{"./circletopolygon.js":1,"./search.js":6,"./towkt.js":8}],6:[function(require,module,exports){
var map = require('./map.js');

(function () {
  const search = {
    currentFocus: 0,
    init: function (searchbar, data) {
      // Add the given searchbar to this object:
      this.searchbar = searchbar;

      // Event listener for input value:
      this.searchbar.addEventListener('input', (e) => {
        this.closeList();
        if (!e.target.value) return false;
        this.currentFocus = -1;
        var results = this.getAutocomplete(data, e.target.value);
        this.setAutocomplete(results, e.target.value.length);
      });

      // Event listener for keyboard functions:
      this.searchbar.addEventListener('keydown', (e) => {
        var list = document.querySelector('.autocomplete-items');

        if (list) list = list.querySelectorAll('li');

        switch (e.keyCode) {
          // Key down:
          case 40:
            this.currentFocus++;
            this.addActive(list);
            break;
          // Key up:
          case 38:
            this.currentFocus--;
            this.addActive(list);
            break;
        }
      });

      // Event for submitting the form:
      this.searchbar.addEventListener('submit', (e) => {
        var value = new FormData(e.target).get('searchLocation');

        // Return if value is empty:
        if (!value) return;

        // Get the search results for current value:
        var results = this.getAutocomplete(data, value);

        // Add first search result to the map:
        map.selectedStreet(results[0]);

        // Show first search result as searchbar value:
        this.searchbar.querySelector('input').value = results[0];
        e.preventDefault();
      });

      // Event listener when clicking the document:
      document.addEventListener('click', (e) => {
        this.closeList(e.target);
      });
    },
    getAutocomplete: function (data, val) {
      // Check what data matches the search query:
      return data.filter(str => str.substr(0, val.length).toUpperCase() == val.toUpperCase());
    },
    setAutocomplete: function (results, length) {
      var autocomplete = document.querySelector('.autocomplete');
      var ul = document.createElement('ul');
      var li = document.createElement('li');
      var a = document.createElement('a');
      var strong = document.createElement('strong');
      var fragment = document.createDocumentFragment();

      ul.classList.add('autocomplete-items');
      fragment.appendChild(ul);

      results.forEach((result, i) => {
        if (i < 3) {
          var cloneLi = li.cloneNode(true);
          var cloneA = a.cloneNode(true);
          var cloneStrong = strong.cloneNode(true);

          ul.appendChild(cloneLi);

          cloneA.href = '#';
          cloneLi.appendChild(cloneA);

          cloneStrong.textContent = result.slice(0, length);
          cloneA.appendChild(cloneStrong);
          cloneA.appendChild(document.createTextNode(result.slice(length)));

          cloneA.addEventListener('click', (e) => {
            this.searchbar.querySelector('input').value = e.target.textContent;
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

      this.searchbar.querySelector('input').value = list[this.currentFocus].children[0].textContent;
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
}) ();

},{"./map.js":5}],7:[function(require,module,exports){
var map = require('./map.js');
var loader = require('./loader.js');

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
        e.preventDefault();
      });
    }
  };

  submitLocationTimestamp.init();
}) ();

},{"./loader.js":4,"./map.js":5}],8:[function(require,module,exports){
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

},{}]},{},[1,2,3,5,6,7,8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvanMvY2lyY2xldG9wb2x5Z29uLmpzIiwicHVibGljL2pzL2ltYWdlLWRldGFpbC5qcyIsInB1YmxpYy9qcy9pbnN0cnVjdGlvblNsaWRlcy5qcyIsInB1YmxpYy9qcy9sb2FkZXIuanMiLCJwdWJsaWMvanMvbWFwLmpzIiwicHVibGljL2pzL3NlYXJjaC5qcyIsInB1YmxpYy9qcy9zdWJtaXRMb2NhdGlvblRpbWVzdGFtcC5qcyIsInB1YmxpYy9qcy90b3drdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gdG9SYWRpYW5zKGFuZ2xlSW5EZWdyZWVzKSB7XG4gIHJldHVybiBhbmdsZUluRGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIHRvRGVncmVlcyhhbmdsZUluUmFkaWFucykge1xuICByZXR1cm4gYW5nbGVJblJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBvZmZzZXQoYzEsIGRpc3RhbmNlLCBiZWFyaW5nKSB7XG4gIHZhciBsYXQxID0gdG9SYWRpYW5zKGMxWzFdKTtcbiAgdmFyIGxvbjEgPSB0b1JhZGlhbnMoYzFbMF0pO1xuICB2YXIgZEJ5UiA9IGRpc3RhbmNlIC8gNjM3ODEzNzsgLy8gZGlzdGFuY2UgZGl2aWRlZCBieSA2Mzc4MTM3IChyYWRpdXMgb2YgdGhlIGVhcnRoKSB3Z3M4NFxuXHR2YXIgZEJ5UjIgPSAoZGlzdGFuY2UgKiAxLjY1KSAvIDYzNzgxMzc7IC8vIGRpc3RhbmNlIGRpdmlkZWQgYnkgNjM3ODEzNyAocmFkaXVzIG9mIHRoZSBlYXJ0aCkgd2dzODRcbiAgdmFyIGxhdCA9IE1hdGguYXNpbihcbiAgICBNYXRoLnNpbihsYXQxKSAqIE1hdGguY29zKGRCeVIyKSArXG4gICAgTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihkQnlSMikgKiBNYXRoLmNvcyhiZWFyaW5nKSk7XG4gIHZhciBsb24gPSBsb24xICsgTWF0aC5hdGFuMihcbiAgICAgIE1hdGguc2luKGJlYXJpbmcpICogTWF0aC5zaW4oZEJ5UikgKiBNYXRoLmNvcyhsYXQxKSxcbiAgICAgIE1hdGguY29zKGRCeVIpIC0gTWF0aC5zaW4obGF0MSkgKiBNYXRoLnNpbihsYXQpKTtcbiAgcmV0dXJuIFt0b0RlZ3JlZXMobG9uKSwgdG9EZWdyZWVzKGxhdCldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNpcmNsZVRvUG9seWdvbihjZW50ZXIsIHJhZGl1cywgbnVtYmVyT2ZTZWdtZW50cykge1xuICB2YXIgbiA9IG51bWJlck9mU2VnbWVudHMgPyBudW1iZXJPZlNlZ21lbnRzIDogMzI7XG4gIHZhciBmbGF0Q29vcmRpbmF0ZXMgPSBbXTtcbiAgdmFyIGNvb3JkaW5hdGVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgZmxhdENvb3JkaW5hdGVzLnB1c2guYXBwbHkoZmxhdENvb3JkaW5hdGVzLCBvZmZzZXQoY2VudGVyLCByYWRpdXMsIDIgKiBNYXRoLlBJICogaSAvIG4pKTtcbiAgfVxuICBmbGF0Q29vcmRpbmF0ZXMucHVzaChmbGF0Q29vcmRpbmF0ZXNbMF0sIGZsYXRDb29yZGluYXRlc1sxXSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBqIDwgZmxhdENvb3JkaW5hdGVzLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgY29vcmRpbmF0ZXNbaSsrXSA9IGZsYXRDb29yZGluYXRlcy5zbGljZShqLCBqICsgMik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW2Nvb3JkaW5hdGVzLnJldmVyc2UoKV1cbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGltYWdlRGV0YWlsID0ge1xuICAgIHRyaWdnZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5vcGVuRGV0YWlsJyksXG4gICAgdHJpZ2dlcjI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5kYXRhLWltYWdlIGltZycpLFxuICAgIGRldGFpbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRldGFpbCcpLFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZGV0YWlsSW1nID0gdGhpcy5kZXRhaWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdO1xuICAgICAgdGhpcy5kZXRhaWxUZXh0ID0gdGhpcy5kZXRhaWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKVswXTtcbiAgICAgIHRoaXMuZGV0YWlsQ2xvc2VCdG4gPSB0aGlzLmRldGFpbC5xdWVyeVNlbGVjdG9yKCcucG9wdXBDbG9zZUJ1dHRvbicpO1xuXG4gICAgICB0aGlzLnRyaWdnZXIyLmZvckVhY2goZWxlbSA9PiB7XG4gICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVsZW0pXG4gICAgICAgICAgdGhpcy5vcGVuRGV0YWlsKGVsZW0uc3JjLCBlbGVtLmFsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudHJpZ2dlci5mb3JFYWNoKGVsZW0gPT4ge1xuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLm9wZW5EZXRhaWwoZWxlbS5kYXRhc2V0LmltYWdlLCBlbGVtLmRhdGFzZXQudGV4dCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRldGFpbENsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZURldGFpbCgpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5kZXRhaWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlRGV0YWlsKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb3BlbkRldGFpbDogZnVuY3Rpb24gKGltZywgdGV4dCA9ICcnKSB7XG4gICAgICAvLyBBZGQgaW1hZ2UgdG8gcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbEltZy5zcmMgPSBpbWc7XG4gICAgICB0aGlzLmRldGFpbEltZy5hbHQgPSB0ZXh0O1xuICAgICAgdGhpcy5kZXRhaWxUZXh0LnRleHRDb250ZW50ID0gdGV4dDtcblxuICAgICAgLy8gU2hvdyB0aGUgcG9wdXA6XG4gICAgICB0aGlzLmRldGFpbC5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSxcbiAgICBjbG9zZURldGFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWwuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH1cbiAgfTtcblxuICBpbWFnZURldGFpbC5pbml0KCk7XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25TbGlkZXMgPSB7XG4gICAgaW5zdHJ1Y3Rpb25zOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW5zdHJ1Y3Rpb25zJyksXG4gICAgZ29UbzogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBjb25zdCBhY3RpdmVTbGlkZSA9IHRoaXMuc2xpZGVzLmZpbmQoc2xpZGUgPT4gc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSk7XG4gICAgICBjb25zdCBhY3RpdmVTdGVwID0gdGhpcy5zdGVwcy5maW5kKHN0ZXAgPT4gc3RlcC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRTbGlkZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gdGhpcy5zdGVwcy5maW5kKHN0ZXAgPT4gc3RlcC5ocmVmLmluY2x1ZGVzKGlkKSk7XG5cbiAgICAgIC8vIFJlbW92ZSBjbGFzc0xpc3QgYWN0aXZlIG9uIGFjdGl2ZSBzbGlkZSBhbmQgc3RlcDpcbiAgICAgIGFjdGl2ZVNsaWRlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgYWN0aXZlU3RlcC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgLy8gQWRkIGNsYXNzTGlzdCBhY3RpdmUgb24gY3VycmVudCBzbGlkZSBhbmQgc3RlcDpcbiAgICAgIGN1cnJlbnRTbGlkZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGN1cnJlbnRTdGVwLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zbGlkZXMgPSBBcnJheS5mcm9tKHRoaXMuaW5zdHJ1Y3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZScpKTtcbiAgICAgIHRoaXMuc2xpZGVMaW5rcyA9IEFycmF5LmZyb20odGhpcy5pbnN0cnVjdGlvbnMucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlLWxpbmsnKSk7XG4gICAgICB0aGlzLnN0ZXBzID0gQXJyYXkuZnJvbSh0aGlzLmluc3RydWN0aW9ucy5xdWVyeVNlbGVjdG9yQWxsKCcuc3RlcHMgLnNsaWRlLWxpbmsnKSk7XG4gICAgICB0aGlzLmluc3RydWN0aW9uQnRuID0gdGhpcy5pbnN0cnVjdGlvbnMucXVlcnlTZWxlY3RvcignLmFjdGlvbi1idG4nKTtcblxuICAgICAgdGhpcy5zbGlkZUxpbmtzLmZvckVhY2gobGluayA9PiB7XG4gICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGhyZWYgPSBsaW5rLmhyZWYuc2xpY2UobGluay5ocmVmLmluZGV4T2YoJyMnKSArIDEpO1xuICAgICAgICAgIHRoaXMuZ29UbyhocmVmKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGluc3RydWN0aW9uU2xpZGVzLmluaXQoKTtcbn0pICgpO1xuIiwiY29uc3QgbG9hZGVyID0ge1xuICBlbGVtOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubG9hZGVyJyksXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVsZW0uY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcjtcbiIsIi8vIFJlcXVpcmUgSlMgZmlsZXM6XG52YXIgY2lyY2xlVG9Qb2x5Z29uID0gcmVxdWlyZSgnLi9jaXJjbGV0b3BvbHlnb24uanMnKTtcbnZhciB0b1dLVCA9IHJlcXVpcmUoJy4vdG93a3QuanMnKTtcbnZhciBzZWFyY2ggPSByZXF1aXJlKCcuL3NlYXJjaC5qcycpO1xuXG52YXIgaW5wdXRDaXJjbGU7XG5cbihmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IG1hcCA9IHtcblx0XHRtYXBFbGVtOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksXG5cdFx0c2VhcmNoYmFyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoYmFyJyksXG5cdFx0cmFkaXVzU2VsZWN0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmFkaXVzLXNlbGVjdCcpLFxuXHRcdG1hcGJveEFjY2Vzc1Rva2VuOiAncGsuZXlKMUlqb2liV0Y0WkdWMmNtbGxjemsxSWl3aVlTSTZJbU5xWldaeWRXa3lOakYzTlhveWQyOHpjWEZxZERKdmJqRWlmUS5EbDNEdnVGRXFIVkF4ZmFqZzBFU1dnJyxcblx0XHRtYXA6IEwubWFwKCdtYXAnLCB7XG5cdFx0XHR6b29tQ29udHJvbDogZmFsc2Vcblx0XHR9KSxcblx0XHRjaXJjbGU6IEwuY2lyY2xlKCksXG5cdFx0cG9seWdvbjogTC5wb2x5Z29uKHtcblx0XHRcdGNvbG9yOiAnIzAwMDBGRidcblx0XHR9KSxcblx0XHRnZW9KU09OOiBMLmdlb0pTT04oKSxcblx0XHRjZW50ZXJMYXRMbmc6IFsgNTIuMzcwMjE2LCA0Ljg5NTE2OCBdLFxuXHRcdHN0YXJ0UG9zOiB7IHg6IDAsIHk6IDAgfSxcblx0XHRjdXJyZW50UG9zOiB7IHg6IDAsIHk6IDAgfSxcblx0XHRkaXN0YW5jZTogeyB4OiAwLCB5OiAwIH0sXG5cdFx0bWFwU2l6ZTogeyB4OiAwLCB5OiAwIH0sXG5cdFx0bW92ZVJhZGl1c1NlbGVjdDogZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHR0aGlzLnJhZGl1c1NlbGVjdC5zdHlsZS5sZWZ0ID0gKHRoaXMubWFwRWxlbS5vZmZzZXRMZWZ0ICsgcG9pbnQueCkgKyAncHgnO1xuXHRcdFx0dGhpcy5yYWRpdXNTZWxlY3Quc3R5bGUudG9wID0gKHRoaXMubWFwRWxlbS5vZmZzZXRUb3AgKyBwb2ludC55KSArICdweCc7XG5cdFx0fSxcblx0XHRpbml0OiBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyBTZXQgdGhlIG9yaWdpbmFsIHZpZXcgb2YgdGhlIG1hcDpcblx0XHRcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJMYXRMbmcsIDE0KTtcblxuXHRcdFx0Ly8gR2l2ZSB0aGUgbWFwIHRoZSBjb3JyZWN0IHN0eWxlOlxuXHRcdFx0TC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5wbmc/YWNjZXNzX3Rva2VuPScgKyB0aGlzLm1hcGJveEFjY2Vzc1Rva2VuLCB7XG5cdFx0XHRcdG1pblpvb206IDExLFxuXHRcdFx0XHRtYXhab29tOiAyMCxcblx0XHRcdFx0aWQ6ICdtYXBib3gubGlnaHQnXG5cdFx0XHR9KS5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRcdC8vIEFkZCB6b29tIGNvbnRyb2wgdG8gYm90dG9tcmlnaHQgb2YgdGhlIG1hcDpcblx0XHRcdEwuY29udHJvbC56b29tKHtcblx0XHRcdFx0cG9zaXRpb246ICdib3R0b21yaWdodCdcblx0XHRcdH0pLmFkZFRvKHRoaXMubWFwKTtcblxuXHRcdFx0Ly8gQWRkIHRoZSBjaXJjbGUgdG8gdGhlIG1hcFxuXHRcdFx0dGhpcy5jaXJjbGVcblx0XHRcdFx0LnNldExhdExuZyh0aGlzLmNlbnRlckxhdExuZylcblx0XHRcdFx0LnNldFJhZGl1cyh0aGlzLnJhZGl1c1NlbGVjdC52YWx1ZSAvIDIpXG5cdFx0XHRcdC5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRcdC8vIEluaXRpYWxpemUgY2lyY2xlIGV2ZW50czpcblx0XHRcdHRoaXMuY2hhbmdlUmFkaXVzKCk7XG5cblx0XHRcdC8vIENyZWF0ZSB0aGUgcG9seWdvbiwgd2l0aCB0aGUgY2VudGVyUG9pbnQgYXMgY29vcmRzOlxuXHRcdFx0dGhpcy5jcmVhdGVQb2x5Z29uKHRoaXMuY2VudGVyTGF0TG5nKTtcblxuXHRcdFx0Ly8gR2V0IGFsbCB0aGUgc3RyZWV0czpcblx0XHRcdHZhciBhbGxTdHJlZXRzID0gYXdhaXQgdGhpcy5nZXRBbGxTdHJlZXRzKCk7XG5cblx0XHRcdC8vIE1hcCB0aGUgc3RyZWV0IG5hbWVzIGZyb20gYWxsU3RyZWV0cyBmb3Igc2VhcmNoOlxuXHRcdFx0dmFyIHN0cmVldE5hbWVzID0gYWxsU3RyZWV0cy5tYXAoc3RyZWV0ID0+IHN0cmVldC5wcm9wZXJ0aWVzLm5hbWUpO1xuXG5cdFx0XHQvLyBJbml0aWFsaXplIHRoZSBhdXRvY29tcGxldGUgc2VhcmNoOlxuXHRcdFx0c2VhcmNoLmluaXQodGhpcy5zZWFyY2hiYXIsIHN0cmVldE5hbWVzKTtcblxuXHRcdFx0Ly8gQWRkIHRoZSBzdHJlZXRzIGRhdGEgdG8gZ2VvSlNPTjpcblx0XHRcdHRoaXMuZ2VvSlNPTi5hZGREYXRhKGFsbFN0cmVldHMpO1xuXG5cdFx0XHQvLyBNYWtlIHRoZSBjaXJjbGUgZHJhZ2dhYmxlOlxuXHRcdFx0dmFyIGRyYWdnYWJsZUNpcmNsZSA9IG5ldyBMLkRyYWdnYWJsZSh0aGlzLmNpcmNsZS5fcGF0aCk7XG5cdFx0XHRkcmFnZ2FibGVDaXJjbGUuZW5hYmxlKCk7XG5cblx0XHRcdC8vIEFkZCBzdGFydCBhbmQgY3VycmVudCBwb3NpdGlvbjpcblx0XHRcdHRoaXMuc3RhcnRQb3MueCA9IHRoaXMuY2lyY2xlLl9wb2ludC54O1xuXHRcdFx0dGhpcy5zdGFydFBvcy55ID0gdGhpcy5jaXJjbGUuX3BvaW50Lnk7XG5cdFx0XHQvLyB0aGlzLm1vdmVSYWRpdXNTZWxlY3QodGhpcy5zdGFydFBvcyk7XG5cblx0XHRcdC8vIHZhciBvcmlnaW5DZW50ZXJQb2ludCA9IHRoaXMubWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLmNlbnRlckxhdExuZyk7XG5cblx0XHRcdC8vIE9uIGNpcmNsZSBkcmFnOlxuXHRcdFx0ZHJhZ2dhYmxlQ2lyY2xlLm9uKCdkcmFnJywgKGUpID0+IHtcblx0XHRcdFx0dGhpcy5jdXJyZW50UG9zLnggPSBlLnNvdXJjZVRhcmdldC5fbmV3UG9zLng7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBvcy55ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy55O1xuXHRcdFx0XHR0aGlzLm1vdmVDaXJjbGUoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBPbiBtYXAgem9vbTpcblx0XHRcdHRoaXMubWFwLm9uKCd6b29tJywgKGUpID0+IHtcblx0XHRcdFx0dmFyIG5ld1pvb21MZXZlbCA9IE51bWJlcihlLnNvdXJjZVRhcmdldC5fYW5pbWF0ZVRvWm9vbSk7XG5cdFx0XHRcdHZhciBsYXllclBvaW50ID0gdGhpcy5tYXAubGF0TG5nVG9MYXllclBvaW50KHRoaXMuY2VudGVyTGF0TG5nKTtcblx0XHRcdFx0dGhpcy5tYXAuc2V0Vmlldyh0aGlzLmNlbnRlckxhdExuZywgbmV3Wm9vbUxldmVsKTtcblx0XHRcdFx0dGhpcy5zdGFydFBvcy54ID0gbGF5ZXJQb2ludC54IC0gdGhpcy5jdXJyZW50UG9zLng7XG5cdFx0XHRcdHRoaXMuc3RhcnRQb3MueSA9IGxheWVyUG9pbnQueSAtIHRoaXMuY3VycmVudFBvcy55O1xuXHRcdFx0XHR0aGlzLm1vdmVDaXJjbGUoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBGb2xsb3dpbmcgY29kZSBpcyB0byBsZXQgcmFkaXVzIHNlbGVjdCBmb2xsb3cgdGhlIGNpcmNsZTpcblxuXHRcdFx0Ly8gLy8gT24gbWFwIGRyYWc6XG5cdFx0XHQvLyB0aGlzLm1hcC5vbignZHJhZycsIChlKSA9PiB7XG5cdFx0XHQvLyBcdHRoaXMuY3VycmVudFBvcy54ID0gdGhpcy5zdGFydFBvcy54ICsgZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy54IC0gdGhpcy5kaXN0YW5jZS54IC0gdGhpcy5tYXBTaXplLng7XG5cdFx0XHQvLyBcdHRoaXMuY3VycmVudFBvcy55ID0gdGhpcy5zdGFydFBvcy55ICsgZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy55IC0gdGhpcy5kaXN0YW5jZS55IC0gdGhpcy5tYXBTaXplLnk7XG5cdFx0XHQvLyBcdHRoaXMubW92ZVJhZGl1c1NlbGVjdCh0aGlzLmN1cnJlbnRQb3MpO1xuXHRcdFx0Ly8gfSk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gLy8gT24gbWFwIGRyYWdlbmQ6XG5cdFx0XHQvLyB0aGlzLm1hcC5vbignZHJhZ2VuZCcsIChlKSA9PiB7XG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueCA9IHRoaXMuY3VycmVudFBvcy54O1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnkgPSB0aGlzLmN1cnJlbnRQb3MueTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMuZGlzdGFuY2UueCA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueDtcblx0XHRcdC8vIFx0dGhpcy5kaXN0YW5jZS55ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy55O1xuXHRcdFx0Ly8gfSk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gLy8gT24gbWFwIHpvb21lbmQ6XG5cdFx0XHQvLyB0aGlzLm1hcC5vbignem9vbWVuZCcsIChlKSA9PiB7XG5cdFx0XHQvLyBcdHZhciBuZXdab29tTGV2ZWwgPSBOdW1iZXIoZS5zb3VyY2VUYXJnZXQuX2FuaW1hdGVUb1pvb20pO1xuXHRcdFx0Ly8gXHR2YXIgbmV3Q2VudGVyUG9pbnQgPSB0aGlzLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5jZW50ZXJMYXRMbmcpO1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0dGhpcy5tYXAuc2V0Vmlldyh0aGlzLmNlbnRlckxhdExuZywgbmV3Wm9vbUxldmVsKTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueCA9IG9yaWdpbkNlbnRlclBvaW50LnggKyB0aGlzLm1hcFNpemUueDtcblx0XHRcdC8vIFx0dGhpcy5zdGFydFBvcy55ID0gb3JpZ2luQ2VudGVyUG9pbnQueSArIHRoaXMubWFwU2l6ZS55O1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0dGhpcy5kaXN0YW5jZS54ID0gb3JpZ2luQ2VudGVyUG9pbnQueCAtIG5ld0NlbnRlclBvaW50Lng7XG5cdFx0XHQvLyBcdHRoaXMuZGlzdGFuY2UueSA9IG9yaWdpbkNlbnRlclBvaW50LnkgLSBuZXdDZW50ZXJQb2ludC55O1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0dGhpcy5tb3ZlUmFkaXVzU2VsZWN0KHRoaXMuc3RhcnRQb3MpO1xuXHRcdFx0Ly8gXHR2YXIgbGF0TG5nID0gdGhpcy5tYXAubGF5ZXJQb2ludFRvTGF0TG5nKHRoaXMuY3VycmVudFBvcyk7XG5cdFx0XHQvLyBcdHRoaXMuY3JlYXRlUG9seWdvbihbbGF0TG5nLmxhdCwgbGF0TG5nLmxuZ10pO1xuXHRcdFx0Ly8gfSk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gLy8gT24gbWFwIHJlc2l6ZTpcblx0XHRcdC8vIHRoaXMubWFwLm9uKCdyZXNpemUnLCAoZSkgPT4ge1xuXHRcdFx0Ly8gXHR2YXIgc2l6ZSA9IHtcblx0XHRcdC8vIFx0XHR4OiAoZS5uZXdTaXplLnggLSBlLm9sZFNpemUueCkgLyAyLFxuXHRcdFx0Ly8gXHRcdHk6IChlLm5ld1NpemUueSAtIGUub2xkU2l6ZS55KSAvIDJcblx0XHRcdC8vIFx0fTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueCArPSBzaXplLng7XG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueSArPSBzaXplLnk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHR0aGlzLm1hcFNpemUueCArPSBzaXplLng7XG5cdFx0XHQvLyBcdHRoaXMubWFwU2l6ZS55ICs9IHNpemUueTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMubW92ZVJhZGl1c1NlbGVjdCh0aGlzLnN0YXJ0UG9zKTtcblx0XHRcdC8vIH0pO1xuXHRcdFx0Ly9cblx0XHRcdC8vIC8vIE9uIGNpcmNsZSBkcmFnZW5kOlxuXHRcdFx0Ly8gZHJhZ2dhYmxlQ2lyY2xlLm9uKCdkcmFnZW5kJywgKGUpID0+IHtcblx0XHRcdC8vIFx0dGhpcy5zdGFydFBvcy54ID0gdGhpcy5jdXJyZW50UG9zLng7XG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueSA9IHRoaXMuY3VycmVudFBvcy55O1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0dGhpcy5kaXN0YW5jZS54ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy54O1xuXHRcdFx0Ly8gXHR0aGlzLmRpc3RhbmNlLnkgPSBlLnNvdXJjZVRhcmdldC5fbmV3UG9zLnk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHQvLyBNb3ZlIHBvbHlnb24gdG8gY2lyY2xlJ3MgbG9jYXRpb246XG5cdFx0XHQvLyBcdHZhciBsYXRMbmcgPSB0aGlzLm1hcC5sYXllclBvaW50VG9MYXRMbmcodGhpcy5jdXJyZW50UG9zKTtcblx0XHRcdC8vIFx0dGhpcy5jcmVhdGVQb2x5Z29uKFtsYXRMbmcubGF0LCBsYXRMbmcubG5nXSk7XG5cdFx0XHQvLyB9KTtcblx0XHR9LFxuXHRcdGdldEFsbFN0cmVldHM6IGFzeW5jIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBmZXRjaCgnL2pzL3N0cmVldHMuanNvbicpXG5cdFx0XHRcdC50aGVuKHJlcyA9PiByZXMuanNvbigpKVxuXHRcdFx0XHQuY2F0Y2goZXJyID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHR9LFxuXHRcdGNoYW5nZVJhZGl1czogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5yYWRpdXNTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcblx0XHRcdFx0dmFyIGxhdGxuZyA9IHRoaXMuY2lyY2xlLmdldExhdExuZygpO1xuXHRcdFx0XHR2YXIgbWV0ZXJzID0gZS50YXJnZXQudmFsdWUgLyAyO1xuXHRcdFx0XHR0aGlzLmNyZWF0ZUNpcmNsZShPYmplY3QudmFsdWVzKGxhdGxuZyksIG1ldGVycyk7XG5cdFx0XHRcdHRoaXMuY3JlYXRlUG9seWdvbih0aGlzLmNlbnRlckxhdExuZywgbWV0ZXJzKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW92ZUNpcmNsZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHggPSB0aGlzLnN0YXJ0UG9zLnggKyB0aGlzLmN1cnJlbnRQb3MueDtcblx0XHRcdHZhciB5ID0gdGhpcy5zdGFydFBvcy55ICsgdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0XHR2YXIgcG9pbnQgPSB7IHg6IHgsIHk6IHkgfTtcblx0XHRcdHZhciBsYXRsbmcgPSB0aGlzLm1hcC5sYXllclBvaW50VG9MYXRMbmcocG9pbnQpO1xuXHRcdFx0dmFyIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpO1xuXG5cdFx0XHQvLyBDcmVhdGUgdGhlIG5ldyBwb2x5Z29uOlxuXHRcdFx0dGhpcy5jZW50ZXJMYXRMbmcgPSBPYmplY3QudmFsdWVzKGxhdGxuZyk7XG5cdFx0XHR0aGlzLmNyZWF0ZUNpcmNsZShPYmplY3QudmFsdWVzKGxhdGxuZyksIHJhZGl1cyk7XG5cdFx0XHR0aGlzLmNyZWF0ZVBvbHlnb24oT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCByYWRpdXMpO1xuXHRcdFx0TC5Eb21VdGlsLnNldFRyYW5zZm9ybSh0aGlzLmNpcmNsZS5fcGF0aCwgeyB4OiAwLCB5OiAwIH0pO1xuXHRcdH0sXG5cdFx0Y3JlYXRlQ2lyY2xlOiBmdW5jdGlvbiAoY29vcmRzLCByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKSkge1xuXHRcdFx0dGhpcy5jaXJjbGUuc2V0TGF0TG5nKGNvb3Jkcyk7XG5cdFx0XHR0aGlzLmNpcmNsZS5zZXRSYWRpdXMocmFkaXVzKTtcblx0XHR9LFxuXHRcdGNyZWF0ZVBvbHlnb246IGZ1bmN0aW9uIChjb29yZHMsIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpLCBudW1iZXJPZkVkZ2VzID0gMTApIHtcblx0XHRcdC8vbGVhZmxldCBwb2x5Z29uIHRvIHdrdFxuXHRcdFx0dmFyIHBvbHlnb25Db29yZHMgPSBjaXJjbGVUb1BvbHlnb24oY29vcmRzLCByYWRpdXMsIG51bWJlck9mRWRnZXMpO1xuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBjb29yZHM6XG5cdFx0XHR0aGlzLnBvbHlnb25cblx0XHRcdFx0LnNldExhdExuZ3MocG9seWdvbkNvb3Jkcy5jb29yZGluYXRlc1swXSk7XG5cdFx0XHRcdC8vIC5hZGRUbyh0aGlzLm1hcCkgLy8gUmVtb3ZlIGZvciBwcm9kdWN0aW9uXG5cdFx0XHRcdC8vIC5icmluZ1RvQmFjaygpOyAvLyBSZW1vdmUgZm9yIHByb2R1Y3Rpb25cblxuXHRcdFx0Ly8gQ3JlYXRlIGEgd2t0IGZyb20gdGhlIHBvbHlnb246XG5cdFx0XHRpbnB1dENpcmNsZSA9IHtcblx0XHRcdFx0d2t0OiB0b1dLVCh0aGlzLnBvbHlnb24pLFxuXHRcdFx0XHRjb29yZHM6IGNvb3Jkc1xuXHRcdFx0fTtcblx0XHR9LFxuXHR9O1xuXG5cdG1hcC5pbml0KCk7XG5cblx0ZXhwb3J0cy5zZWxlY3RlZFN0cmVldCA9IGZ1bmN0aW9uIChzdHJlZXROYW1lKSB7XG5cdFx0bWFwLmdlb0pTT04uZWFjaExheWVyKGxheWVyID0+IHtcblx0XHRcdGlmIChsYXllci5mZWF0dXJlLnByb3BlcnRpZXMubmFtZSA9PT0gc3RyZWV0TmFtZSkge1xuXHRcdFx0XHR2YXIgYm91bmRzID0gbGF5ZXIuZ2V0Qm91bmRzKCk7XG5cdFx0XHRcdHZhciBjZW50ZXIgPSBib3VuZHMuZ2V0Q2VudGVyKCk7XG5cblx0XHRcdFx0dmFyIGxheWVyUG9pbnQgPSBtYXAubWFwLmxhdExuZ1RvTGF5ZXJQb2ludChbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0XHRtYXAubWFwLnNldFZpZXcoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddLCAxNCk7XG5cblx0XHRcdFx0bWFwLnN0YXJ0UG9zLnggPSBsYXllclBvaW50LnggLSBtYXAuY3VycmVudFBvcy54O1xuXHRcdFx0XHRtYXAuc3RhcnRQb3MueSA9IGxheWVyUG9pbnQueSAtIG1hcC5jdXJyZW50UG9zLnk7XG5cblx0XHRcdFx0bWFwLm1vdmVDaXJjbGUoKTtcblx0XHRcdFx0bWFwLmNyZWF0ZUNpcmNsZShbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0XHRtYXAuY3JlYXRlUG9seWdvbihbY2VudGVyLmxhdCwgY2VudGVyLmxuZ10pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KSAoKTtcblxuZXhwb3J0cy5pbnB1dENpcmNsZSA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGlucHV0Q2lyY2xlO1xufVxuIiwidmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwLmpzJyk7XG5cbihmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHNlYXJjaCA9IHtcbiAgICBjdXJyZW50Rm9jdXM6IDAsXG4gICAgaW5pdDogZnVuY3Rpb24gKHNlYXJjaGJhciwgZGF0YSkge1xuICAgICAgLy8gQWRkIHRoZSBnaXZlbiBzZWFyY2hiYXIgdG8gdGhpcyBvYmplY3Q6XG4gICAgICB0aGlzLnNlYXJjaGJhciA9IHNlYXJjaGJhcjtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgZm9yIGlucHV0IHZhbHVlOlxuICAgICAgdGhpcy5zZWFyY2hiYXIuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlTGlzdCgpO1xuICAgICAgICBpZiAoIWUudGFyZ2V0LnZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHRoaXMuY3VycmVudEZvY3VzID0gLTE7XG4gICAgICAgIHZhciByZXN1bHRzID0gdGhpcy5nZXRBdXRvY29tcGxldGUoZGF0YSwgZS50YXJnZXQudmFsdWUpO1xuICAgICAgICB0aGlzLnNldEF1dG9jb21wbGV0ZShyZXN1bHRzLCBlLnRhcmdldC52YWx1ZS5sZW5ndGgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciBrZXlib2FyZCBmdW5jdGlvbnM6XG4gICAgICB0aGlzLnNlYXJjaGJhci5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLWl0ZW1zJyk7XG5cbiAgICAgICAgaWYgKGxpc3QpIGxpc3QgPSBsaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJyk7XG5cbiAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAvLyBLZXkgZG93bjpcbiAgICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMrKztcbiAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZlKGxpc3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgLy8gS2V5IHVwOlxuICAgICAgICAgIGNhc2UgMzg6XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cy0tO1xuICAgICAgICAgICAgdGhpcy5hZGRBY3RpdmUobGlzdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEV2ZW50IGZvciBzdWJtaXR0aW5nIHRoZSBmb3JtOlxuICAgICAgdGhpcy5zZWFyY2hiYXIuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHtcbiAgICAgICAgdmFyIHZhbHVlID0gbmV3IEZvcm1EYXRhKGUudGFyZ2V0KS5nZXQoJ3NlYXJjaExvY2F0aW9uJyk7XG5cbiAgICAgICAgLy8gUmV0dXJuIGlmIHZhbHVlIGlzIGVtcHR5OlxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG5cbiAgICAgICAgLy8gR2V0IHRoZSBzZWFyY2ggcmVzdWx0cyBmb3IgY3VycmVudCB2YWx1ZTpcbiAgICAgICAgdmFyIHJlc3VsdHMgPSB0aGlzLmdldEF1dG9jb21wbGV0ZShkYXRhLCB2YWx1ZSk7XG5cbiAgICAgICAgLy8gQWRkIGZpcnN0IHNlYXJjaCByZXN1bHQgdG8gdGhlIG1hcDpcbiAgICAgICAgbWFwLnNlbGVjdGVkU3RyZWV0KHJlc3VsdHNbMF0pO1xuXG4gICAgICAgIC8vIFNob3cgZmlyc3Qgc2VhcmNoIHJlc3VsdCBhcyBzZWFyY2hiYXIgdmFsdWU6XG4gICAgICAgIHRoaXMuc2VhcmNoYmFyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykudmFsdWUgPSByZXN1bHRzWzBdO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgd2hlbiBjbGlja2luZyB0aGUgZG9jdW1lbnQ6XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2VMaXN0KGUudGFyZ2V0KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0QXV0b2NvbXBsZXRlOiBmdW5jdGlvbiAoZGF0YSwgdmFsKSB7XG4gICAgICAvLyBDaGVjayB3aGF0IGRhdGEgbWF0Y2hlcyB0aGUgc2VhcmNoIHF1ZXJ5OlxuICAgICAgcmV0dXJuIGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIuc3Vic3RyKDAsIHZhbC5sZW5ndGgpLnRvVXBwZXJDYXNlKCkgPT0gdmFsLnRvVXBwZXJDYXNlKCkpO1xuICAgIH0sXG4gICAgc2V0QXV0b2NvbXBsZXRlOiBmdW5jdGlvbiAocmVzdWx0cywgbGVuZ3RoKSB7XG4gICAgICB2YXIgYXV0b2NvbXBsZXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZScpO1xuICAgICAgdmFyIHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgIHZhciBzdHJvbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHJvbmcnKTtcbiAgICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgdWwuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWl0ZW1zJyk7XG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCh1bCk7XG5cbiAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XG4gICAgICAgIGlmIChpIDwgMykge1xuICAgICAgICAgIHZhciBjbG9uZUxpID0gbGkuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIHZhciBjbG9uZUEgPSBhLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICB2YXIgY2xvbmVTdHJvbmcgPSBzdHJvbmcuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgdWwuYXBwZW5kQ2hpbGQoY2xvbmVMaSk7XG5cbiAgICAgICAgICBjbG9uZUEuaHJlZiA9ICcjJztcbiAgICAgICAgICBjbG9uZUxpLmFwcGVuZENoaWxkKGNsb25lQSk7XG5cbiAgICAgICAgICBjbG9uZVN0cm9uZy50ZXh0Q29udGVudCA9IHJlc3VsdC5zbGljZSgwLCBsZW5ndGgpO1xuICAgICAgICAgIGNsb25lQS5hcHBlbmRDaGlsZChjbG9uZVN0cm9uZyk7XG4gICAgICAgICAgY2xvbmVBLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJlc3VsdC5zbGljZShsZW5ndGgpKSk7XG5cbiAgICAgICAgICBjbG9uZUEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hiYXIucXVlcnlTZWxlY3RvcignaW5wdXQnKS52YWx1ZSA9IGUudGFyZ2V0LnRleHRDb250ZW50O1xuICAgICAgICAgICAgdGhpcy5jbG9zZUxpc3QoKTtcbiAgICAgICAgICAgIG1hcC5zZWxlY3RlZFN0cmVldChlLnRhcmdldC50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYXV0b2NvbXBsZXRlLmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbiAgICB9LFxuICAgIGFkZEFjdGl2ZTogZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgIGlmICghbGlzdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhpcy5yZW1vdmVBY3RpdmUobGlzdCk7XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA+PSBsaXN0Lmxlbmd0aCkgdGhpcy5jdXJyZW50Rm9jdXMgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VycmVudEZvY3VzIDwgMCkgdGhpcy5jdXJyZW50Rm9jdXMgPSAobGlzdC5sZW5ndGggLSAxKTtcblxuICAgICAgdGhpcy5zZWFyY2hiYXIucXVlcnlTZWxlY3RvcignaW5wdXQnKS52YWx1ZSA9IGxpc3RbdGhpcy5jdXJyZW50Rm9jdXNdLmNoaWxkcmVuWzBdLnRleHRDb250ZW50O1xuICAgICAgbGlzdFt0aGlzLmN1cnJlbnRGb2N1c10uY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpO1xuICAgIH0sXG4gICAgcmVtb3ZlQWN0aXZlOiBmdW5jdGlvbiAobGlzdCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpc3RbaV0uY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2VMaXN0OiBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgdmFyIGxpc3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmF1dG9jb21wbGV0ZS1pdGVtcycpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChlbGVtICE9IGxpc3RzW2ldICYmIGVsZW0gIT0gdGhpcy5zZWFyY2hiYXIpIHtcbiAgICAgICAgICBsaXN0c1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHNlYXJjaDtcbn0pICgpO1xuIiwidmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwLmpzJyk7XG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXIuanMnKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgY29uc3Qgc3VibWl0TG9jYXRpb25UaW1lc3RhbXAgPSB7XG4gICAgZm9ybTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxvY2F0aW9uLXRpbWVzdGFtcCcpLFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZSkgPT4ge1xuICAgICAgICB2YXIgZm9ybWRhdGEgPSBuZXcgRm9ybURhdGEoZS50YXJnZXQpO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICB3a3Q6IG1hcC5pbnB1dENpcmNsZSgpLndrdCxcbiAgICAgICAgICBjb29yZHM6IG1hcC5pbnB1dENpcmNsZSgpLmNvb3Jkc1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGtleSBvZiBmb3JtZGF0YS5rZXlzKCkpIHtcbiAgICAgICAgICBkYXRhW2tleV0gPSBmb3JtZGF0YS5nZXQoa2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHZhciB1cmwgPSAnL2NyZWF0ZS1zdG9yeSc7XG5cbiAgICAgICAgLy8gU2hvdyB0aGUgbG9hZGVyXG4gICAgICAgIGxvYWRlci5zaG93KCk7XG5cbiAgICAgICAgaHR0cC5vcGVuKCdwb3N0JywgdXJsLCB0cnVlKTtcbiAgICAgICAgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoaHR0cC5yZWFkeVN0YXRlID09IDQgJiYgaHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhodHRwLnJlc3BvbnNlVVJMKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGh0dHAucmVzcG9uc2VVUkw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGh0dHAuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBzdWJtaXRMb2NhdGlvblRpbWVzdGFtcC5pbml0KCk7XG59KSAoKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9XS1QgKGxheWVyKSB7XG5cdFx0dmFyIGxuZywgbGF0LCBjb29yZHMgPSBbXTtcblx0XHRpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlnb24gfHwgbGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlsaW5lKSB7XG5cdFx0XHR2YXIgbGF0bG5ncyA9IGxheWVyLmdldExhdExuZ3MoKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxhdGxuZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGxhdGxuZ3MxID0gbGF0bG5nc1tpXTtcblx0XHRcdFx0aWYgKGxhdGxuZ3MxLmxlbmd0aCl7XG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgbGF0bG5nczEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRjb29yZHMucHVzaChsYXRsbmdzMVtqXS5sbmcgKyBcIiBcIiArIGxhdGxuZ3MxW2pdLmxhdCk7XG5cdFx0XHRcdFx0aWYgKGogPT09IDApIHtcblx0XHRcdFx0XHRcdGxuZyA9IGxhdGxuZ3MxW2pdLmxuZztcblx0XHRcdFx0XHRcdGxhdCA9IGxhdGxuZ3MxW2pdLmxhdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH19XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvb3Jkcy5wdXNoKGxhdGxuZ3NbaV0ubG5nICsgXCIgXCIgKyBsYXRsbmdzW2ldLmxhdCk7XG5cdFx0XHRcdFx0aWYgKGkgPT09IDApIHtcblx0XHRcdFx0XHRcdGxuZyA9IGxhdGxuZ3NbaV0ubG5nO1xuXHRcdFx0XHRcdFx0bGF0ID0gbGF0bG5nc1tpXS5sYXQ7XG5cdFx0XHRcdFx0fX1cblx0XHR9O1xuXHRcdFx0aWYgKGxheWVyIGluc3RhbmNlb2YgTC5Qb2x5Z29uKSB7XG5cdFx0XHRcdHJldHVybiBcIlBPTFlHT04oKFwiICsgY29vcmRzLmpvaW4oXCIsXCIpICsgXCIsXCIgKyBsbmcgKyBcIiBcIiArIGxhdCArIFwiKSlcIjtcblx0XHRcdH0gZWxzZSBpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlsaW5lKSB7XG5cdFx0XHRcdHJldHVybiBcIkxJTkVTVFJJTkcoXCIgKyBjb29yZHMuam9pbihcIixcIikgKyBcIilcIjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGxheWVyIGluc3RhbmNlb2YgTC5NYXJrZXIpIHtcblx0XHRcdHJldHVybiBcIlBPSU5UKFwiICsgbGF5ZXIuZ2V0TGF0TG5nKCkubG5nICsgXCIgXCIgKyBsYXllci5nZXRMYXRMbmcoKS5sYXQgKyBcIilcIjtcblx0XHR9XG5cdH07XG4iXX0=
