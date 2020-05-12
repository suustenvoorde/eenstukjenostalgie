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

},{"./circletopolygon.js":1,"./search.js":5,"./towkt.js":7}],5:[function(require,module,exports){
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
      this.setAutocomplete(results, val.length);
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
}) ();

},{"./map.js":4}],6:[function(require,module,exports){
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

},{"./map.js":4}],7:[function(require,module,exports){
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

},{}]},{},[1,2,3,4,5,6,7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvanMvY2lyY2xldG9wb2x5Z29uLmpzIiwicHVibGljL2pzL2ltYWdlLWRldGFpbC5qcyIsInB1YmxpYy9qcy9pbnN0cnVjdGlvblNsaWRlcy5qcyIsInB1YmxpYy9qcy9tYXAuanMiLCJwdWJsaWMvanMvc2VhcmNoLmpzIiwicHVibGljL2pzL3N1Ym1pdExvY2F0aW9uVGltZXN0YW1wLmpzIiwicHVibGljL2pzL3Rvd2t0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiB0b1JhZGlhbnMoYW5nbGVJbkRlZ3JlZXMpIHtcbiAgcmV0dXJuIGFuZ2xlSW5EZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcbn1cblxuZnVuY3Rpb24gdG9EZWdyZWVzKGFuZ2xlSW5SYWRpYW5zKSB7XG4gIHJldHVybiBhbmdsZUluUmFkaWFucyAqIDE4MCAvIE1hdGguUEk7XG59XG5cbmZ1bmN0aW9uIG9mZnNldChjMSwgZGlzdGFuY2UsIGJlYXJpbmcpIHtcbiAgdmFyIGxhdDEgPSB0b1JhZGlhbnMoYzFbMV0pO1xuICB2YXIgbG9uMSA9IHRvUmFkaWFucyhjMVswXSk7XG4gIHZhciBkQnlSID0gZGlzdGFuY2UgLyA2Mzc4MTM3OyAvLyBkaXN0YW5jZSBkaXZpZGVkIGJ5IDYzNzgxMzcgKHJhZGl1cyBvZiB0aGUgZWFydGgpIHdnczg0XG5cdHZhciBkQnlSMiA9IChkaXN0YW5jZSAqIDEuNjUpIC8gNjM3ODEzNzsgLy8gZGlzdGFuY2UgZGl2aWRlZCBieSA2Mzc4MTM3IChyYWRpdXMgb2YgdGhlIGVhcnRoKSB3Z3M4NFxuICB2YXIgbGF0ID0gTWF0aC5hc2luKFxuICAgIE1hdGguc2luKGxhdDEpICogTWF0aC5jb3MoZEJ5UjIpICtcbiAgICBNYXRoLmNvcyhsYXQxKSAqIE1hdGguc2luKGRCeVIyKSAqIE1hdGguY29zKGJlYXJpbmcpKTtcbiAgdmFyIGxvbiA9IGxvbjEgKyBNYXRoLmF0YW4yKFxuICAgICAgTWF0aC5zaW4oYmVhcmluZykgKiBNYXRoLnNpbihkQnlSKSAqIE1hdGguY29zKGxhdDEpLFxuICAgICAgTWF0aC5jb3MoZEJ5UikgLSBNYXRoLnNpbihsYXQxKSAqIE1hdGguc2luKGxhdCkpO1xuICByZXR1cm4gW3RvRGVncmVlcyhsb24pLCB0b0RlZ3JlZXMobGF0KV07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2lyY2xlVG9Qb2x5Z29uKGNlbnRlciwgcmFkaXVzLCBudW1iZXJPZlNlZ21lbnRzKSB7XG4gIHZhciBuID0gbnVtYmVyT2ZTZWdtZW50cyA/IG51bWJlck9mU2VnbWVudHMgOiAzMjtcbiAgdmFyIGZsYXRDb29yZGluYXRlcyA9IFtdO1xuICB2YXIgY29vcmRpbmF0ZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICBmbGF0Q29vcmRpbmF0ZXMucHVzaC5hcHBseShmbGF0Q29vcmRpbmF0ZXMsIG9mZnNldChjZW50ZXIsIHJhZGl1cywgMiAqIE1hdGguUEkgKiBpIC8gbikpO1xuICB9XG4gIGZsYXRDb29yZGluYXRlcy5wdXNoKGZsYXRDb29yZGluYXRlc1swXSwgZmxhdENvb3JkaW5hdGVzWzFdKTtcblxuICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGogPCBmbGF0Q29vcmRpbmF0ZXMubGVuZ3RoOyBqICs9IDIpIHtcbiAgICBjb29yZGluYXRlc1tpKytdID0gZmxhdENvb3JkaW5hdGVzLnNsaWNlKGosIGogKyAyKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ1BvbHlnb24nLFxuICAgIGNvb3JkaW5hdGVzOiBbY29vcmRpbmF0ZXMucmV2ZXJzZSgpXVxuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgaW1hZ2VEZXRhaWwgPSB7XG4gICAgdHJpZ2dlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm9wZW5EZXRhaWwnKSxcbiAgICB0cmlnZ2VyMjogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmRhdGEtaW1hZ2UgaW1nJyksXG4gICAgZGV0YWlsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGV0YWlsJyksXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZXRhaWxJbWcgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF07XG4gICAgICB0aGlzLmRldGFpbFRleHQgPSB0aGlzLmRldGFpbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpWzBdO1xuICAgICAgdGhpcy5kZXRhaWxDbG9zZUJ0biA9IHRoaXMuZGV0YWlsLnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cENsb3NlQnV0dG9uJyk7XG5cbiAgICAgIHRoaXMudHJpZ2dlcjIuZm9yRWFjaChlbGVtID0+IHtcbiAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coZWxlbSlcbiAgICAgICAgICB0aGlzLm9wZW5EZXRhaWwoZWxlbS5zcmMsIGVsZW0uYWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy50cmlnZ2VyLmZvckVhY2goZWxlbSA9PiB7XG4gICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgIHRoaXMub3BlbkRldGFpbChlbGVtLmRhdGFzZXQuaW1hZ2UsIGVsZW0uZGF0YXNldC50ZXh0KTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuZGV0YWlsQ2xvc2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlRGV0YWlsKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmRldGFpbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2VEZXRhaWwoKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBvcGVuRGV0YWlsOiBmdW5jdGlvbiAoaW1nLCB0ZXh0ID0gJycpIHtcbiAgICAgIC8vIEFkZCBpbWFnZSB0byBwb3B1cDpcbiAgICAgIHRoaXMuZGV0YWlsSW1nLnNyYyA9IGltZztcbiAgICAgIHRoaXMuZGV0YWlsSW1nLmFsdCA9IHRleHQ7XG4gICAgICB0aGlzLmRldGFpbFRleHQudGV4dENvbnRlbnQgPSB0ZXh0O1xuXG4gICAgICAvLyBTaG93IHRoZSBwb3B1cDpcbiAgICAgIHRoaXMuZGV0YWlsLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB9LFxuICAgIGNsb3NlRGV0YWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmRldGFpbC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9O1xuXG4gIGltYWdlRGV0YWlsLmluaXQoKTtcbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICBjb25zdCBpbnN0cnVjdGlvblNsaWRlcyA9IHtcbiAgICBpbnN0cnVjdGlvbnM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5pbnN0cnVjdGlvbnMnKSxcbiAgICBnb1RvOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZVNsaWRlID0gdGhpcy5zbGlkZXMuZmluZChzbGlkZSA9PiBzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKTtcbiAgICAgIGNvbnN0IGFjdGl2ZVN0ZXAgPSB0aGlzLnN0ZXBzLmZpbmQoc3RlcCA9PiBzdGVwLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpO1xuICAgICAgY29uc3QgY3VycmVudFNsaWRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSB0aGlzLnN0ZXBzLmZpbmQoc3RlcCA9PiBzdGVwLmhyZWYuaW5jbHVkZXMoaWQpKTtcblxuICAgICAgLy8gUmVtb3ZlIGNsYXNzTGlzdCBhY3RpdmUgb24gYWN0aXZlIHNsaWRlIGFuZCBzdGVwOlxuICAgICAgYWN0aXZlU2xpZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICBhY3RpdmVTdGVwLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgICAvLyBBZGQgY2xhc3NMaXN0IGFjdGl2ZSBvbiBjdXJyZW50IHNsaWRlIGFuZCBzdGVwOlxuICAgICAgY3VycmVudFNsaWRlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgY3VycmVudFN0ZXAuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNsaWRlcyA9IEFycmF5LmZyb20odGhpcy5pbnN0cnVjdGlvbnMucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJykpO1xuICAgICAgdGhpcy5zbGlkZUxpbmtzID0gQXJyYXkuZnJvbSh0aGlzLmluc3RydWN0aW9ucy5xdWVyeVNlbGVjdG9yQWxsKCcuc2xpZGUtbGluaycpKTtcbiAgICAgIHRoaXMuc3RlcHMgPSBBcnJheS5mcm9tKHRoaXMuaW5zdHJ1Y3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdGVwcyAuc2xpZGUtbGluaycpKTtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25CdG4gPSB0aGlzLmluc3RydWN0aW9ucy5xdWVyeVNlbGVjdG9yKCcuYWN0aW9uLWJ0bicpO1xuXG4gICAgICB0aGlzLnNsaWRlTGlua3MuZm9yRWFjaChsaW5rID0+IHtcbiAgICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaHJlZiA9IGxpbmsuaHJlZi5zbGljZShsaW5rLmhyZWYuaW5kZXhPZignIycpICsgMSk7XG4gICAgICAgICAgdGhpcy5nb1RvKGhyZWYpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgaW5zdHJ1Y3Rpb25TbGlkZXMuaW5pdCgpO1xufSkgKCk7XG4iLCIvLyBSZXF1aXJlIEpTIGZpbGVzOlxudmFyIGNpcmNsZVRvUG9seWdvbiA9IHJlcXVpcmUoJy4vY2lyY2xldG9wb2x5Z29uLmpzJyk7XG52YXIgdG9XS1QgPSByZXF1aXJlKCcuL3Rvd2t0LmpzJyk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2guanMnKTtcblxudmFyIGlucHV0Q2lyY2xlO1xuXG4oZnVuY3Rpb24gKCkge1xuXHRjb25zdCBtYXAgPSB7XG5cdFx0bWFwRWxlbTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLFxuXHRcdHNlYXJjaGJhcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaGJhcicpLFxuXHRcdHJhZGl1c1NlbGVjdDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJhZGl1cy1zZWxlY3QnKSxcblx0XHRtYXBib3hBY2Nlc3NUb2tlbjogJ3BrLmV5SjFJam9pYldGNFpHVjJjbWxsY3prMUlpd2lZU0k2SW1OcVpXWnlkV2t5TmpGM05Yb3lkMjh6Y1hGcWRESnZiakVpZlEuRGwzRHZ1RkVxSFZBeGZhamcwRVNXZycsXG5cdFx0bWFwOiBMLm1hcCgnbWFwJywge1xuXHRcdFx0em9vbUNvbnRyb2w6IGZhbHNlXG5cdFx0fSksXG5cdFx0Y2lyY2xlOiBMLmNpcmNsZSgpLFxuXHRcdHBvbHlnb246IEwucG9seWdvbih7XG5cdFx0XHRjb2xvcjogJyMwMDAwRkYnXG5cdFx0fSksXG5cdFx0Z2VvSlNPTjogTC5nZW9KU09OKCksXG5cdFx0Y2VudGVyTGF0TG5nOiBbIDUyLjM3MDIxNiwgNC44OTUxNjggXSxcblx0XHRzdGFydFBvczogeyB4OiAwLCB5OiAwIH0sXG5cdFx0Y3VycmVudFBvczogeyB4OiAwLCB5OiAwIH0sXG5cdFx0ZGlzdGFuY2U6IHsgeDogMCwgeTogMCB9LFxuXHRcdG1hcFNpemU6IHsgeDogMCwgeTogMCB9LFxuXHRcdG1vdmVSYWRpdXNTZWxlY3Q6IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0dGhpcy5yYWRpdXNTZWxlY3Quc3R5bGUubGVmdCA9ICh0aGlzLm1hcEVsZW0ub2Zmc2V0TGVmdCArIHBvaW50LngpICsgJ3B4Jztcblx0XHRcdHRoaXMucmFkaXVzU2VsZWN0LnN0eWxlLnRvcCA9ICh0aGlzLm1hcEVsZW0ub2Zmc2V0VG9wICsgcG9pbnQueSkgKyAncHgnO1xuXHRcdH0sXG5cdFx0aW5pdDogYXN5bmMgZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gU2V0IHRoZSBvcmlnaW5hbCB2aWV3IG9mIHRoZSBtYXA6XG5cdFx0XHR0aGlzLm1hcC5zZXRWaWV3KHRoaXMuY2VudGVyTGF0TG5nLCAxNCk7XG5cblx0XHRcdC8vIEdpdmUgdGhlIG1hcCB0aGUgY29ycmVjdCBzdHlsZTpcblx0XHRcdEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0ucG5nP2FjY2Vzc190b2tlbj0nICsgdGhpcy5tYXBib3hBY2Nlc3NUb2tlbiwge1xuXHRcdFx0XHRtaW5ab29tOiAxMSxcblx0XHRcdFx0bWF4Wm9vbTogMjAsXG5cdFx0XHRcdGlkOiAnbWFwYm94LmxpZ2h0J1xuXHRcdFx0fSkuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0XHQvLyBBZGQgem9vbSBjb250cm9sIHRvIGJvdHRvbXJpZ2h0IG9mIHRoZSBtYXA6XG5cdFx0XHRMLmNvbnRyb2wuem9vbSh7XG5cdFx0XHRcdHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnXG5cdFx0XHR9KS5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRcdC8vIEFkZCB0aGUgY2lyY2xlIHRvIHRoZSBtYXBcblx0XHRcdHRoaXMuY2lyY2xlXG5cdFx0XHRcdC5zZXRMYXRMbmcodGhpcy5jZW50ZXJMYXRMbmcpXG5cdFx0XHRcdC5zZXRSYWRpdXModGhpcy5yYWRpdXNTZWxlY3QudmFsdWUgLyAyKVxuXHRcdFx0XHQuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0XHQvLyBJbml0aWFsaXplIGNpcmNsZSBldmVudHM6XG5cdFx0XHR0aGlzLmNoYW5nZVJhZGl1cygpO1xuXG5cdFx0XHQvLyBDcmVhdGUgdGhlIHBvbHlnb24sIHdpdGggdGhlIGNlbnRlclBvaW50IGFzIGNvb3Jkczpcblx0XHRcdHRoaXMuY3JlYXRlUG9seWdvbih0aGlzLmNlbnRlckxhdExuZyk7XG5cblx0XHRcdC8vIEdldCBhbGwgdGhlIHN0cmVldHM6XG5cdFx0XHR2YXIgYWxsU3RyZWV0cyA9IGF3YWl0IHRoaXMuZ2V0QWxsU3RyZWV0cygpO1xuXG5cdFx0XHQvLyBNYXAgdGhlIHN0cmVldCBuYW1lcyBmcm9tIGFsbFN0cmVldHMgZm9yIHNlYXJjaDpcblx0XHRcdHZhciBzdHJlZXROYW1lcyA9IGFsbFN0cmVldHMubWFwKHN0cmVldCA9PiBzdHJlZXQucHJvcGVydGllcy5uYW1lKTtcblxuXHRcdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgYXV0b2NvbXBsZXRlIHNlYXJjaDpcblx0XHRcdHNlYXJjaC5pbml0KHRoaXMuc2VhcmNoYmFyLCBzdHJlZXROYW1lcyk7XG5cblx0XHRcdC8vIEFkZCB0aGUgc3RyZWV0cyBkYXRhIHRvIGdlb0pTT046XG5cdFx0XHR0aGlzLmdlb0pTT04uYWRkRGF0YShhbGxTdHJlZXRzKTtcblxuXHRcdFx0Ly8gTWFrZSB0aGUgY2lyY2xlIGRyYWdnYWJsZTpcblx0XHRcdHZhciBkcmFnZ2FibGVDaXJjbGUgPSBuZXcgTC5EcmFnZ2FibGUodGhpcy5jaXJjbGUuX3BhdGgpO1xuXHRcdFx0ZHJhZ2dhYmxlQ2lyY2xlLmVuYWJsZSgpO1xuXG5cdFx0XHQvLyBBZGQgc3RhcnQgYW5kIGN1cnJlbnQgcG9zaXRpb246XG5cdFx0XHR0aGlzLnN0YXJ0UG9zLnggPSB0aGlzLmNpcmNsZS5fcG9pbnQueDtcblx0XHRcdHRoaXMuc3RhcnRQb3MueSA9IHRoaXMuY2lyY2xlLl9wb2ludC55O1xuXHRcdFx0Ly8gdGhpcy5tb3ZlUmFkaXVzU2VsZWN0KHRoaXMuc3RhcnRQb3MpO1xuXG5cdFx0XHQvLyB2YXIgb3JpZ2luQ2VudGVyUG9pbnQgPSB0aGlzLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5jZW50ZXJMYXRMbmcpO1xuXG5cdFx0XHQvLyBPbiBjaXJjbGUgZHJhZzpcblx0XHRcdGRyYWdnYWJsZUNpcmNsZS5vbignZHJhZycsIChlKSA9PiB7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBvcy54ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy54O1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQb3MueSA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueTtcblx0XHRcdFx0dGhpcy5tb3ZlQ2lyY2xlKCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gT24gbWFwIHpvb206XG5cdFx0XHR0aGlzLm1hcC5vbignem9vbScsIChlKSA9PiB7XG5cdFx0XHRcdHZhciBuZXdab29tTGV2ZWwgPSBOdW1iZXIoZS5zb3VyY2VUYXJnZXQuX2FuaW1hdGVUb1pvb20pO1xuXHRcdFx0XHR2YXIgbGF5ZXJQb2ludCA9IHRoaXMubWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLmNlbnRlckxhdExuZyk7XG5cdFx0XHRcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJMYXRMbmcsIG5ld1pvb21MZXZlbCk7XG5cdFx0XHRcdHRoaXMuc3RhcnRQb3MueCA9IGxheWVyUG9pbnQueCAtIHRoaXMuY3VycmVudFBvcy54O1xuXHRcdFx0XHR0aGlzLnN0YXJ0UG9zLnkgPSBsYXllclBvaW50LnkgLSB0aGlzLmN1cnJlbnRQb3MueTtcblx0XHRcdFx0dGhpcy5tb3ZlQ2lyY2xlKCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gRm9sbG93aW5nIGNvZGUgaXMgdG8gbGV0IHJhZGl1cyBzZWxlY3QgZm9sbG93IHRoZSBjaXJjbGU6XG5cblx0XHRcdC8vIC8vIE9uIG1hcCBkcmFnOlxuXHRcdFx0Ly8gdGhpcy5tYXAub24oJ2RyYWcnLCAoZSkgPT4ge1xuXHRcdFx0Ly8gXHR0aGlzLmN1cnJlbnRQb3MueCA9IHRoaXMuc3RhcnRQb3MueCArIGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueCAtIHRoaXMuZGlzdGFuY2UueCAtIHRoaXMubWFwU2l6ZS54O1xuXHRcdFx0Ly8gXHR0aGlzLmN1cnJlbnRQb3MueSA9IHRoaXMuc3RhcnRQb3MueSArIGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueSAtIHRoaXMuZGlzdGFuY2UueSAtIHRoaXMubWFwU2l6ZS55O1xuXHRcdFx0Ly8gXHR0aGlzLm1vdmVSYWRpdXNTZWxlY3QodGhpcy5jdXJyZW50UG9zKTtcblx0XHRcdC8vIH0pO1xuXHRcdFx0Ly9cblx0XHRcdC8vIC8vIE9uIG1hcCBkcmFnZW5kOlxuXHRcdFx0Ly8gdGhpcy5tYXAub24oJ2RyYWdlbmQnLCAoZSkgPT4ge1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnggPSB0aGlzLmN1cnJlbnRQb3MueDtcblx0XHRcdC8vIFx0dGhpcy5zdGFydFBvcy55ID0gdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHR0aGlzLmRpc3RhbmNlLnggPSBlLnNvdXJjZVRhcmdldC5fbmV3UG9zLng7XG5cdFx0XHQvLyBcdHRoaXMuZGlzdGFuY2UueSA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueTtcblx0XHRcdC8vIH0pO1xuXHRcdFx0Ly9cblx0XHRcdC8vIC8vIE9uIG1hcCB6b29tZW5kOlxuXHRcdFx0Ly8gdGhpcy5tYXAub24oJ3pvb21lbmQnLCAoZSkgPT4ge1xuXHRcdFx0Ly8gXHR2YXIgbmV3Wm9vbUxldmVsID0gTnVtYmVyKGUuc291cmNlVGFyZ2V0Ll9hbmltYXRlVG9ab29tKTtcblx0XHRcdC8vIFx0dmFyIG5ld0NlbnRlclBvaW50ID0gdGhpcy5tYXAubGF0TG5nVG9MYXllclBvaW50KHRoaXMuY2VudGVyTGF0TG5nKTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJMYXRMbmcsIG5ld1pvb21MZXZlbCk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnggPSBvcmlnaW5DZW50ZXJQb2ludC54ICsgdGhpcy5tYXBTaXplLng7XG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueSA9IG9yaWdpbkNlbnRlclBvaW50LnkgKyB0aGlzLm1hcFNpemUueTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMuZGlzdGFuY2UueCA9IG9yaWdpbkNlbnRlclBvaW50LnggLSBuZXdDZW50ZXJQb2ludC54O1xuXHRcdFx0Ly8gXHR0aGlzLmRpc3RhbmNlLnkgPSBvcmlnaW5DZW50ZXJQb2ludC55IC0gbmV3Q2VudGVyUG9pbnQueTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMubW92ZVJhZGl1c1NlbGVjdCh0aGlzLnN0YXJ0UG9zKTtcblx0XHRcdC8vIFx0dmFyIGxhdExuZyA9IHRoaXMubWFwLmxheWVyUG9pbnRUb0xhdExuZyh0aGlzLmN1cnJlbnRQb3MpO1xuXHRcdFx0Ly8gXHR0aGlzLmNyZWF0ZVBvbHlnb24oW2xhdExuZy5sYXQsIGxhdExuZy5sbmddKTtcblx0XHRcdC8vIH0pO1xuXHRcdFx0Ly9cblx0XHRcdC8vIC8vIE9uIG1hcCByZXNpemU6XG5cdFx0XHQvLyB0aGlzLm1hcC5vbigncmVzaXplJywgKGUpID0+IHtcblx0XHRcdC8vIFx0dmFyIHNpemUgPSB7XG5cdFx0XHQvLyBcdFx0eDogKGUubmV3U2l6ZS54IC0gZS5vbGRTaXplLngpIC8gMixcblx0XHRcdC8vIFx0XHR5OiAoZS5uZXdTaXplLnkgLSBlLm9sZFNpemUueSkgLyAyXG5cdFx0XHQvLyBcdH07XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnggKz0gc2l6ZS54O1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnkgKz0gc2l6ZS55O1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0dGhpcy5tYXBTaXplLnggKz0gc2l6ZS54O1xuXHRcdFx0Ly8gXHR0aGlzLm1hcFNpemUueSArPSBzaXplLnk7XG5cdFx0XHQvL1xuXHRcdFx0Ly8gXHR0aGlzLm1vdmVSYWRpdXNTZWxlY3QodGhpcy5zdGFydFBvcyk7XG5cdFx0XHQvLyB9KTtcblx0XHRcdC8vXG5cdFx0XHQvLyAvLyBPbiBjaXJjbGUgZHJhZ2VuZDpcblx0XHRcdC8vIGRyYWdnYWJsZUNpcmNsZS5vbignZHJhZ2VuZCcsIChlKSA9PiB7XG5cdFx0XHQvLyBcdHRoaXMuc3RhcnRQb3MueCA9IHRoaXMuY3VycmVudFBvcy54O1xuXHRcdFx0Ly8gXHR0aGlzLnN0YXJ0UG9zLnkgPSB0aGlzLmN1cnJlbnRQb3MueTtcblx0XHRcdC8vXG5cdFx0XHQvLyBcdHRoaXMuZGlzdGFuY2UueCA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueDtcblx0XHRcdC8vIFx0dGhpcy5kaXN0YW5jZS55ID0gZS5zb3VyY2VUYXJnZXQuX25ld1Bvcy55O1xuXHRcdFx0Ly9cblx0XHRcdC8vIFx0Ly8gTW92ZSBwb2x5Z29uIHRvIGNpcmNsZSdzIGxvY2F0aW9uOlxuXHRcdFx0Ly8gXHR2YXIgbGF0TG5nID0gdGhpcy5tYXAubGF5ZXJQb2ludFRvTGF0TG5nKHRoaXMuY3VycmVudFBvcyk7XG5cdFx0XHQvLyBcdHRoaXMuY3JlYXRlUG9seWdvbihbbGF0TG5nLmxhdCwgbGF0TG5nLmxuZ10pO1xuXHRcdFx0Ly8gfSk7XG5cdFx0fSxcblx0XHRnZXRBbGxTdHJlZXRzOiBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZmV0Y2goJy9qcy9zdHJlZXRzLmpzb24nKVxuXHRcdFx0XHQudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcblx0XHRcdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0fSk7XG5cdFx0fSxcblx0XHRjaGFuZ2VSYWRpdXM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMucmFkaXVzU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG5cdFx0XHRcdHZhciBsYXRsbmcgPSB0aGlzLmNpcmNsZS5nZXRMYXRMbmcoKTtcblx0XHRcdFx0dmFyIG1ldGVycyA9IGUudGFyZ2V0LnZhbHVlIC8gMjtcblx0XHRcdFx0dGhpcy5jcmVhdGVDaXJjbGUoT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCBtZXRlcnMpO1xuXHRcdFx0XHR0aGlzLmNyZWF0ZVBvbHlnb24odGhpcy5jZW50ZXJMYXRMbmcsIG1ldGVycyk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdmVDaXJjbGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB4ID0gdGhpcy5zdGFydFBvcy54ICsgdGhpcy5jdXJyZW50UG9zLng7XG5cdFx0XHR2YXIgeSA9IHRoaXMuc3RhcnRQb3MueSArIHRoaXMuY3VycmVudFBvcy55O1xuXHRcdFx0dmFyIHBvaW50ID0geyB4OiB4LCB5OiB5IH07XG5cdFx0XHR2YXIgbGF0bG5nID0gdGhpcy5tYXAubGF5ZXJQb2ludFRvTGF0TG5nKHBvaW50KTtcblx0XHRcdHZhciByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKTtcblxuXHRcdFx0Ly8gQ3JlYXRlIHRoZSBuZXcgcG9seWdvbjpcblx0XHRcdHRoaXMuY2VudGVyTGF0TG5nID0gT2JqZWN0LnZhbHVlcyhsYXRsbmcpO1xuXHRcdFx0dGhpcy5jcmVhdGVDaXJjbGUoT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCByYWRpdXMpO1xuXHRcdFx0dGhpcy5jcmVhdGVQb2x5Z29uKE9iamVjdC52YWx1ZXMobGF0bG5nKSwgcmFkaXVzKTtcblx0XHRcdEwuRG9tVXRpbC5zZXRUcmFuc2Zvcm0odGhpcy5jaXJjbGUuX3BhdGgsIHsgeDogMCwgeTogMCB9KTtcblx0XHR9LFxuXHRcdGNyZWF0ZUNpcmNsZTogZnVuY3Rpb24gKGNvb3JkcywgcmFkaXVzID0gdGhpcy5jaXJjbGUuZ2V0UmFkaXVzKCkpIHtcblx0XHRcdHRoaXMuY2lyY2xlLnNldExhdExuZyhjb29yZHMpO1xuXHRcdFx0dGhpcy5jaXJjbGUuc2V0UmFkaXVzKHJhZGl1cyk7XG5cdFx0fSxcblx0XHRjcmVhdGVQb2x5Z29uOiBmdW5jdGlvbiAoY29vcmRzLCByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKSwgbnVtYmVyT2ZFZGdlcyA9IDEwKSB7XG5cdFx0XHQvL2xlYWZsZXQgcG9seWdvbiB0byB3a3Rcblx0XHRcdHZhciBwb2x5Z29uQ29vcmRzID0gY2lyY2xlVG9Qb2x5Z29uKGNvb3JkcywgcmFkaXVzLCBudW1iZXJPZkVkZ2VzKTtcblxuXHRcdFx0Ly8gU2V0IHRoZSBuZXcgY29vcmRzOlxuXHRcdFx0dGhpcy5wb2x5Z29uXG5cdFx0XHRcdC5zZXRMYXRMbmdzKHBvbHlnb25Db29yZHMuY29vcmRpbmF0ZXNbMF0pO1xuXHRcdFx0XHQvLyAuYWRkVG8odGhpcy5tYXApIC8vIFJlbW92ZSBmb3IgcHJvZHVjdGlvblxuXHRcdFx0XHQvLyAuYnJpbmdUb0JhY2soKTsgLy8gUmVtb3ZlIGZvciBwcm9kdWN0aW9uXG5cblx0XHRcdC8vIENyZWF0ZSBhIHdrdCBmcm9tIHRoZSBwb2x5Z29uOlxuXHRcdFx0aW5wdXRDaXJjbGUgPSB7XG5cdFx0XHRcdHdrdDogdG9XS1QodGhpcy5wb2x5Z29uKSxcblx0XHRcdFx0Y29vcmRzOiBjb29yZHNcblx0XHRcdH07XG5cdFx0fSxcblx0fTtcblxuXHRtYXAuaW5pdCgpO1xuXG5cdGV4cG9ydHMuc2VsZWN0ZWRTdHJlZXQgPSBmdW5jdGlvbiAoc3RyZWV0TmFtZSkge1xuXHRcdG1hcC5nZW9KU09OLmVhY2hMYXllcihsYXllciA9PiB7XG5cdFx0XHRpZiAobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWUgPT09IHN0cmVldE5hbWUpIHtcblx0XHRcdFx0dmFyIGJvdW5kcyA9IGxheWVyLmdldEJvdW5kcygpO1xuXHRcdFx0XHR2YXIgY2VudGVyID0gYm91bmRzLmdldENlbnRlcigpO1xuXG5cdFx0XHRcdHZhciBsYXllclBvaW50ID0gbWFwLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddKTtcblx0XHRcdFx0bWFwLm1hcC5zZXRWaWV3KFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSwgMTQpO1xuXG5cdFx0XHRcdG1hcC5zdGFydFBvcy54ID0gbGF5ZXJQb2ludC54IC0gbWFwLmN1cnJlbnRQb3MueDtcblx0XHRcdFx0bWFwLnN0YXJ0UG9zLnkgPSBsYXllclBvaW50LnkgLSBtYXAuY3VycmVudFBvcy55O1xuXG5cdFx0XHRcdG1hcC5tb3ZlQ2lyY2xlKCk7XG5cdFx0XHRcdG1hcC5jcmVhdGVDaXJjbGUoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddKTtcblx0XHRcdFx0bWFwLmNyZWF0ZVBvbHlnb24oW2NlbnRlci5sYXQsIGNlbnRlci5sbmddKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufSkgKCk7XG5cbmV4cG9ydHMuaW5wdXRDaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBpbnB1dENpcmNsZTtcbn1cbiIsInZhciBtYXAgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuXG4oZnVuY3Rpb24gKCkge1xuICBjb25zdCBzZWFyY2ggPSB7XG4gICAgY3VycmVudEZvY3VzOiAwLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzZWFyY2hiYXIsIGRhdGEpIHtcbiAgICAgIC8vIEFkZCB0aGUgZ2l2ZW4gc2VhcmNoYmFyIHRvIHRoaXMgb2JqZWN0OlxuICAgICAgdGhpcy5zZWFyY2hiYXIgPSBzZWFyY2hiYXI7XG5cbiAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciBpbnB1dCB2YWx1ZTpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoKTtcbiAgICAgICAgaWYgKCFlLnRhcmdldC52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cyA9IC0xO1xuICAgICAgICB0aGlzLmdldEF1dG9jb21wbGV0ZShkYXRhLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgZm9yIGtleWJvYXJkIGZ1bmN0aW9uczpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtaXRlbXMnKTtcblxuICAgICAgICBpZiAobGlzdCkgbGlzdCA9IGxpc3QucXVlcnlTZWxlY3RvckFsbCgnbGknKTtcblxuICAgICAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgICAgICAgIGNhc2UgNDA6XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cysrO1xuICAgICAgICAgICAgdGhpcy5hZGRBY3RpdmUobGlzdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMtLTtcbiAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZlKGxpc3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA+IC0xKSB7XG4gICAgICAgICAgICAgIGlmIChsaXN0KSBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgZm9yIGNsaWNraW5nIHNlYXJjaCBidXR0b246XG4gICAgICB0aGlzLnNlYXJjaGJhci5wYXJlbnROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnNlYXJjaGJhci52YWx1ZTtcbiAgICAgICAgdGhpcy5nZXRBdXRvY29tcGxldGUoZGF0YSwgdmFsKTtcblxuICAgICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIudG9VcHBlckNhc2UoKSA9PSB2YWwudG9VcHBlckNhc2UoKSk7XG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCkgbWFwLnNlbGVjdGVkU3RyZWV0KHJlc3VsdHNbMF0pO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBFdmVudCBsaXN0ZW5lciB3aGVuIGNsaWNraW5nIHRoZSBkb2N1bWVudDpcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoZS50YXJnZXQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChkYXRhLCB2YWwpIHtcbiAgICAgIC8vIENoZWNrIHdoYXQgZGF0YSBtYXRjaGVzIHRoZSBzZWFyY2ggcXVlcnk6XG4gICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIuc3Vic3RyKDAsIHZhbC5sZW5ndGgpLnRvVXBwZXJDYXNlKCkgPT0gdmFsLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgdGhpcy5zZXRBdXRvY29tcGxldGUocmVzdWx0cywgdmFsLmxlbmd0aCk7XG4gICAgfSxcbiAgICBzZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChyZXN1bHRzLCBsZW5ndGgpIHtcbiAgICAgIHZhciBhdXRvY29tcGxldGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlJyk7XG4gICAgICB2YXIgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgdmFyIHN0cm9uZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0cm9uZycpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgICB1bC5jbGFzc0xpc3QuYWRkKCdhdXRvY29tcGxldGUtaXRlbXMnKTtcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHVsKTtcblxuICAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGkpID0+IHtcbiAgICAgICAgaWYgKGkgPCAzKSB7XG4gICAgICAgICAgdmFyIGNsb25lTGkgPSBsaS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgdmFyIGNsb25lQSA9IGEuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIHZhciBjbG9uZVN0cm9uZyA9IHN0cm9uZy5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICB1bC5hcHBlbmRDaGlsZChjbG9uZUxpKTtcblxuICAgICAgICAgIGNsb25lQS5ocmVmID0gJyMnO1xuICAgICAgICAgIGNsb25lTGkuYXBwZW5kQ2hpbGQoY2xvbmVBKTtcblxuICAgICAgICAgIGNsb25lU3Ryb25nLnRleHRDb250ZW50ID0gcmVzdWx0LnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgICAgICAgY2xvbmVBLmFwcGVuZENoaWxkKGNsb25lU3Ryb25nKTtcbiAgICAgICAgICBjbG9uZUEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocmVzdWx0LnNsaWNlKGxlbmd0aCkpKTtcblxuICAgICAgICAgIGNsb25lTGkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hiYXIudmFsdWUgPSBlLnRhcmdldC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VMaXN0KCk7XG4gICAgICAgICAgICBtYXAuc2VsZWN0ZWRTdHJlZXQoZS50YXJnZXQudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGF1dG9jb21wbGV0ZS5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgfSxcbiAgICBhZGRBY3RpdmU6IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICBpZiAoIWxpc3QpIHJldHVybiBmYWxzZTtcbiAgICAgIHRoaXMucmVtb3ZlQWN0aXZlKGxpc3QpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudEZvY3VzID49IGxpc3QubGVuZ3RoKSB0aGlzLmN1cnJlbnRGb2N1cyA9IDA7XG4gICAgICBpZiAodGhpcy5jdXJyZW50Rm9jdXMgPCAwKSB0aGlzLmN1cnJlbnRGb2N1cyA9IChsaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgdGhpcy5zZWFyY2hiYXIudmFsdWUgPSBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS50ZXh0Q29udGVudDtcbiAgICAgIGxpc3RbdGhpcy5jdXJyZW50Rm9jdXNdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKTtcbiAgICB9LFxuICAgIHJlbW92ZUFjdGl2ZTogZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaXN0W2ldLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlTGlzdDogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgIHZhciBsaXN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hdXRvY29tcGxldGUtaXRlbXMnKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbSAhPSBsaXN0c1tpXSAmJiBlbGVtICE9IHRoaXMuc2VhcmNoYmFyKSB7XG4gICAgICAgICAgbGlzdHNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsaXN0c1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBzZWFyY2g7XG59KSAoKTtcbiIsInZhciBtYXAgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuXG4oZnVuY3Rpb24gKCkge1xuICBjb25zdCBzdWJtaXRMb2NhdGlvblRpbWVzdGFtcCA9IHtcbiAgICBmb3JtOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubG9jYXRpb24tdGltZXN0YW1wJyksXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiB7XG4gICAgICAgIHZhciBmb3JtZGF0YSA9IG5ldyBGb3JtRGF0YShlLnRhcmdldCk7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgIHdrdDogbWFwLmlucHV0Q2lyY2xlKCkud2t0LFxuICAgICAgICAgIGNvb3JkczogbWFwLmlucHV0Q2lyY2xlKCkuY29vcmRzXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIga2V5IG9mIGZvcm1kYXRhLmtleXMoKSkge1xuICAgICAgICAgIGRhdGFba2V5XSA9IGZvcm1kYXRhLmdldChrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgdmFyIHVybCA9ICcvY3JlYXRlLXN0b3J5JztcblxuICAgICAgICBodHRwLm9wZW4oJ3Bvc3QnLCB1cmwsIHRydWUpO1xuICAgICAgICBodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChodHRwLnJlYWR5U3RhdGUgPT0gNCAmJiBodHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGh0dHAucmVzcG9uc2VVUkwpO1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gaHR0cC5yZXNwb25zZVVSTDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaHR0cC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIHN1Ym1pdExvY2F0aW9uVGltZXN0YW1wLmluaXQoKTtcbn0pICgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b1dLVCAobGF5ZXIpIHtcblx0XHR2YXIgbG5nLCBsYXQsIGNvb3JkcyA9IFtdO1xuXHRcdGlmIChsYXllciBpbnN0YW5jZW9mIEwuUG9seWdvbiB8fCBsYXllciBpbnN0YW5jZW9mIEwuUG9seWxpbmUpIHtcblx0XHRcdHZhciBsYXRsbmdzID0gbGF5ZXIuZ2V0TGF0TG5ncygpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGF0bG5ncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgbGF0bG5nczEgPSBsYXRsbmdzW2ldO1xuXHRcdFx0XHRpZiAobGF0bG5nczEubGVuZ3RoKXtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBsYXRsbmdzMS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGNvb3Jkcy5wdXNoKGxhdGxuZ3MxW2pdLmxuZyArIFwiIFwiICsgbGF0bG5nczFbal0ubGF0KTtcblx0XHRcdFx0XHRpZiAoaiA9PT0gMCkge1xuXHRcdFx0XHRcdFx0bG5nID0gbGF0bG5nczFbal0ubG5nO1xuXHRcdFx0XHRcdFx0bGF0ID0gbGF0bG5nczFbal0ubGF0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fX1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29vcmRzLnB1c2gobGF0bG5nc1tpXS5sbmcgKyBcIiBcIiArIGxhdGxuZ3NbaV0ubGF0KTtcblx0XHRcdFx0XHRpZiAoaSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0bG5nID0gbGF0bG5nc1tpXS5sbmc7XG5cdFx0XHRcdFx0XHRsYXQgPSBsYXRsbmdzW2ldLmxhdDtcblx0XHRcdFx0XHR9fVxuXHRcdH07XG5cdFx0XHRpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLlBvbHlnb24pIHtcblx0XHRcdFx0cmV0dXJuIFwiUE9MWUdPTigoXCIgKyBjb29yZHMuam9pbihcIixcIikgKyBcIixcIiArIGxuZyArIFwiIFwiICsgbGF0ICsgXCIpKVwiO1xuXHRcdFx0fSBlbHNlIGlmIChsYXllciBpbnN0YW5jZW9mIEwuUG9seWxpbmUpIHtcblx0XHRcdFx0cmV0dXJuIFwiTElORVNUUklORyhcIiArIGNvb3Jkcy5qb2luKFwiLFwiKSArIFwiKVwiO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAobGF5ZXIgaW5zdGFuY2VvZiBMLk1hcmtlcikge1xuXHRcdFx0cmV0dXJuIFwiUE9JTlQoXCIgKyBsYXllci5nZXRMYXRMbmcoKS5sbmcgKyBcIiBcIiArIGxheWVyLmdldExhdExuZygpLmxhdCArIFwiKVwiO1xuXHRcdH1cblx0fTtcbiJdfQ==
