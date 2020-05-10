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
module.exports = {
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
  changeBtn: function (href) {
    this.instructionBtn.children[0].textContent = href == 'slidetwo'
      ? 'Naar laatste stap' : href == 'slidethree'
      ? 'Zoek herinneringen'
      : 'Naar stap 2';
    this.instructionBtn.href = href == 'slidetwo'
      ? '#slidethree' : href == 'slidethree'
      ? '/create-story'
      : '#slidetwo';
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
        this.changeBtn(href);
        e.preventDefault();
      });
    });
  }
};

},{}],3:[function(require,module,exports){
// Require JS files:
var circleToPolygon = require('./circletopolygon.js');
var toWKT = require('./towkt.js');
var search = require('./search.js');

// Delete leaflet logo
// document.getElementsByClassName( 'leaflet-control-attribution' )[0].style.display = 'none';

// Set global wkt variable:
var inputCircle;

module.exports = {
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

exports.inputCircle = function () {
	return inputCircle;
}

},{"./circletopolygon.js":1,"./search.js":4,"./towkt.js":5}],4:[function(require,module,exports){
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

})();

},{"./map.js":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
const map = require('./components/map.js');
const instructionSlides = require('./components/instructionSlides.js');

(function () {
  map.init();
  instructionSlides.init();
}) ();

},{"./components/instructionSlides.js":2,"./components/map.js":3}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvanMvY29tcG9uZW50cy9jaXJjbGV0b3BvbHlnb24uanMiLCJwdWJsaWMvanMvY29tcG9uZW50cy9pbnN0cnVjdGlvblNsaWRlcy5qcyIsInB1YmxpYy9qcy9jb21wb25lbnRzL21hcC5qcyIsInB1YmxpYy9qcy9jb21wb25lbnRzL3NlYXJjaC5qcyIsInB1YmxpYy9qcy9jb21wb25lbnRzL3Rvd2t0LmpzIiwicHVibGljL2pzL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gdG9SYWRpYW5zKGFuZ2xlSW5EZWdyZWVzKSB7XG4gIHJldHVybiBhbmdsZUluRGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIHRvRGVncmVlcyhhbmdsZUluUmFkaWFucykge1xuICByZXR1cm4gYW5nbGVJblJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBvZmZzZXQoYzEsIGRpc3RhbmNlLCBiZWFyaW5nKSB7XG4gIHZhciBsYXQxID0gdG9SYWRpYW5zKGMxWzFdKTtcbiAgdmFyIGxvbjEgPSB0b1JhZGlhbnMoYzFbMF0pO1xuICB2YXIgZEJ5UiA9IGRpc3RhbmNlIC8gNjM3ODEzNzsgLy8gZGlzdGFuY2UgZGl2aWRlZCBieSA2Mzc4MTM3IChyYWRpdXMgb2YgdGhlIGVhcnRoKSB3Z3M4NFxuXHR2YXIgZEJ5UjIgPSAoZGlzdGFuY2UgKiAxLjY1KSAvIDYzNzgxMzc7IC8vIGRpc3RhbmNlIGRpdmlkZWQgYnkgNjM3ODEzNyAocmFkaXVzIG9mIHRoZSBlYXJ0aCkgd2dzODRcbiAgdmFyIGxhdCA9IE1hdGguYXNpbihcbiAgICBNYXRoLnNpbihsYXQxKSAqIE1hdGguY29zKGRCeVIyKSArXG4gICAgTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihkQnlSMikgKiBNYXRoLmNvcyhiZWFyaW5nKSk7XG4gIHZhciBsb24gPSBsb24xICsgTWF0aC5hdGFuMihcbiAgICAgIE1hdGguc2luKGJlYXJpbmcpICogTWF0aC5zaW4oZEJ5UikgKiBNYXRoLmNvcyhsYXQxKSxcbiAgICAgIE1hdGguY29zKGRCeVIpIC0gTWF0aC5zaW4obGF0MSkgKiBNYXRoLnNpbihsYXQpKTtcbiAgcmV0dXJuIFt0b0RlZ3JlZXMobG9uKSwgdG9EZWdyZWVzKGxhdCldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNpcmNsZVRvUG9seWdvbihjZW50ZXIsIHJhZGl1cywgbnVtYmVyT2ZTZWdtZW50cykge1xuICB2YXIgbiA9IG51bWJlck9mU2VnbWVudHMgPyBudW1iZXJPZlNlZ21lbnRzIDogMzI7XG4gIHZhciBmbGF0Q29vcmRpbmF0ZXMgPSBbXTtcbiAgdmFyIGNvb3JkaW5hdGVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgZmxhdENvb3JkaW5hdGVzLnB1c2guYXBwbHkoZmxhdENvb3JkaW5hdGVzLCBvZmZzZXQoY2VudGVyLCByYWRpdXMsIDIgKiBNYXRoLlBJICogaSAvIG4pKTtcbiAgfVxuICBmbGF0Q29vcmRpbmF0ZXMucHVzaChmbGF0Q29vcmRpbmF0ZXNbMF0sIGZsYXRDb29yZGluYXRlc1sxXSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBqIDwgZmxhdENvb3JkaW5hdGVzLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgY29vcmRpbmF0ZXNbaSsrXSA9IGZsYXRDb29yZGluYXRlcy5zbGljZShqLCBqICsgMik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW2Nvb3JkaW5hdGVzLnJldmVyc2UoKV1cbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5zdHJ1Y3Rpb25zOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW5zdHJ1Y3Rpb25zJyksXG4gIGdvVG86IGZ1bmN0aW9uIChpZCkge1xuICAgIGNvbnN0IGFjdGl2ZVNsaWRlID0gdGhpcy5zbGlkZXMuZmluZChzbGlkZSA9PiBzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKTtcbiAgICBjb25zdCBhY3RpdmVTdGVwID0gdGhpcy5zdGVwcy5maW5kKHN0ZXAgPT4gc3RlcC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKTtcbiAgICBjb25zdCBjdXJyZW50U2xpZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgY29uc3QgY3VycmVudFN0ZXAgPSB0aGlzLnN0ZXBzLmZpbmQoc3RlcCA9PiBzdGVwLmhyZWYuaW5jbHVkZXMoaWQpKTtcblxuICAgIC8vIFJlbW92ZSBjbGFzc0xpc3QgYWN0aXZlIG9uIGFjdGl2ZSBzbGlkZSBhbmQgc3RlcDpcbiAgICBhY3RpdmVTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICBhY3RpdmVTdGVwLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgLy8gQWRkIGNsYXNzTGlzdCBhY3RpdmUgb24gY3VycmVudCBzbGlkZSBhbmQgc3RlcDpcbiAgICBjdXJyZW50U2xpZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgY3VycmVudFN0ZXAuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH0sXG4gIGNoYW5nZUJ0bjogZnVuY3Rpb24gKGhyZWYpIHtcbiAgICB0aGlzLmluc3RydWN0aW9uQnRuLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID0gaHJlZiA9PSAnc2xpZGV0d28nXG4gICAgICA/ICdOYWFyIGxhYXRzdGUgc3RhcCcgOiBocmVmID09ICdzbGlkZXRocmVlJ1xuICAgICAgPyAnWm9layBoZXJpbm5lcmluZ2VuJ1xuICAgICAgOiAnTmFhciBzdGFwIDInO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25CdG4uaHJlZiA9IGhyZWYgPT0gJ3NsaWRldHdvJ1xuICAgICAgPyAnI3NsaWRldGhyZWUnIDogaHJlZiA9PSAnc2xpZGV0aHJlZSdcbiAgICAgID8gJy9jcmVhdGUtc3RvcnknXG4gICAgICA6ICcjc2xpZGV0d28nO1xuICB9LFxuICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zbGlkZXMgPSBBcnJheS5mcm9tKHRoaXMuaW5zdHJ1Y3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZScpKTtcbiAgICB0aGlzLnNsaWRlTGlua3MgPSBBcnJheS5mcm9tKHRoaXMuaW5zdHJ1Y3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZS1saW5rJykpO1xuICAgIHRoaXMuc3RlcHMgPSBBcnJheS5mcm9tKHRoaXMuaW5zdHJ1Y3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdGVwcyAuc2xpZGUtbGluaycpKTtcbiAgICB0aGlzLmluc3RydWN0aW9uQnRuID0gdGhpcy5pbnN0cnVjdGlvbnMucXVlcnlTZWxlY3RvcignLmFjdGlvbi1idG4nKTtcblxuICAgIHRoaXMuc2xpZGVMaW5rcy5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGhyZWYgPSBsaW5rLmhyZWYuc2xpY2UobGluay5ocmVmLmluZGV4T2YoJyMnKSArIDEpO1xuICAgICAgICB0aGlzLmdvVG8oaHJlZik7XG4gICAgICAgIHRoaXMuY2hhbmdlQnRuKGhyZWYpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcbiIsIi8vIFJlcXVpcmUgSlMgZmlsZXM6XG52YXIgY2lyY2xlVG9Qb2x5Z29uID0gcmVxdWlyZSgnLi9jaXJjbGV0b3BvbHlnb24uanMnKTtcbnZhciB0b1dLVCA9IHJlcXVpcmUoJy4vdG93a3QuanMnKTtcbnZhciBzZWFyY2ggPSByZXF1aXJlKCcuL3NlYXJjaC5qcycpO1xuXG4vLyBEZWxldGUgbGVhZmxldCBsb2dvXG4vLyBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCAnbGVhZmxldC1jb250cm9sLWF0dHJpYnV0aW9uJyApWzBdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbi8vIFNldCBnbG9iYWwgd2t0IHZhcmlhYmxlOlxudmFyIGlucHV0Q2lyY2xlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2VhcmNoYmFyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInNlYXJjaExvY2F0aW9uXCJdJyksXG5cdHNlbGVjdFJhZGl1czogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhZGl1cy1zZWxlY3RlZCcpLFxuXHRtYXBib3hBY2Nlc3NUb2tlbjogJ3BrLmV5SjFJam9pYldGNFpHVjJjbWxsY3prMUlpd2lZU0k2SW1OcVpXWnlkV2t5TmpGM05Yb3lkMjh6Y1hGcWRESnZiakVpZlEuRGwzRHZ1RkVxSFZBeGZhamcwRVNXZycsXG5cdG1hcDogTC5tYXAoJ21hcCcsIHtcblx0XHR6b29tQ29udHJvbDogZmFsc2Vcblx0fSksXG5cdGNpcmNsZTogTC5jaXJjbGUoe1xuXHRcdGNvbG9yOiAnI0RBMTIxQScsXG5cdFx0ZmlsbENvbG9yOiAnI0RBMTIxQScsXG5cdFx0ZmlsbE9wYWNpdHk6IDAuNCxcblx0XHRyYWRpdXM6IDUwMC8yXG5cdH0pLFxuXHRwb2x5Z29uOiBMLnBvbHlnb24oe1xuXHRcdGNvbG9yOiAnI0RBMTIxQSdcblx0fSksXG5cdGdlb0pTT046IEwuZ2VvSlNPTigpLFxuXHRjZW50ZXJQb2ludDogW1xuXHRcdDUyLjM3MDIxNixcblx0XHQ0Ljg5NTE2OFxuXHRdLFxuXHRzdGFydFBvczogeyB4OiAwLCB5OiAwIH0sXG5cdGN1cnJlbnRQb3M6IHsgeDogMCwgeTogMCB9LFxuXHRpbml0OiBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gU2V0IHRoZSBvcmlnaW5hbCB2aWV3IG9mIHRoZSBtYXA6XG5cdFx0dGhpcy5tYXAuc2V0Vmlldyh0aGlzLmNlbnRlclBvaW50LCAxNCk7XG5cblx0XHRMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LnBuZz9hY2Nlc3NfdG9rZW49JyArIHRoaXMubWFwYm94QWNjZXNzVG9rZW4sIHtcblx0XHRcdG1pblpvb206IDExLFxuXHRcdFx0bWF4Wm9vbTogMjAsXG5cdFx0XHRpZDogJ21hcGJveC5saWdodCdcblx0XHR9KS5hZGRUbyh0aGlzLm1hcCk7XG5cblx0XHRMLmNvbnRyb2wuem9vbSh7XG5cdFx0XHRwb3NpdGlvbjogJ2JvdHRvbXJpZ2h0J1xuXHRcdH0pLmFkZFRvKHRoaXMubWFwKTtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIGNpcmNsZTpcblx0XHR0aGlzLmNpcmNsZVxuXHRcdFx0LnNldExhdExuZyh0aGlzLmNlbnRlclBvaW50KVxuXHRcdFx0LnNldFJhZGl1cygyNTApXG5cdFx0XHQuYWRkVG8odGhpcy5tYXApO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSBjaXJjbGUgZXZlbnRzOlxuXHRcdHRoaXMuY2hhbmdlUmFkaXVzKCk7XG5cblx0XHQvLyBDcmVhdGUgdGhlIHBvbHlnb24sIHdpdGggdGhlIGNlbnRlclBvaW50IGFzIGNvb3Jkczpcblx0XHR0aGlzLmNyZWF0ZVBvbHlnb24odGhpcy5jZW50ZXJQb2ludCk7XG5cblx0XHQvLyBHZXQgYWxsIHRoZSBzdHJlZXRzOlxuXHRcdHZhciBhbGxTdHJlZXRzID0gYXdhaXQgdGhpcy5nZXRBbGxTdHJlZXRzKCk7XG5cblx0XHQvLyBNYXAgdGhlIHN0cmVldCBuYW1lcyBmcm9tIGFsbFN0cmVldHMgZm9yIHNlYXJjaDpcblx0XHR2YXIgc3RyZWV0TmFtZXMgPSBhbGxTdHJlZXRzLm1hcChzdHJlZXQgPT4gc3RyZWV0LnByb3BlcnRpZXMubmFtZSk7XG5cblx0XHQvLyBJbml0aWFsaXplIHRoZSBhdXRvY29tcGxldGUgc2VhcmNoOlxuXHRcdHNlYXJjaC5pbml0KHRoaXMuc2VhcmNoYmFyLCBzdHJlZXROYW1lcyk7XG5cblx0XHQvLyBBZGQgdGhlIHN0cmVldHMgZGF0YSB0byBnZW9KU09OOlxuXHRcdHRoaXMuZ2VvSlNPTi5hZGREYXRhKGFsbFN0cmVldHMpO1xuXG5cdFx0Ly8gRHJhZ2dpbmcgdGhlIGNpcmNsZTpcblx0XHR2YXIgZHJhZ2dhYmxlID0gbmV3IEwuRHJhZ2dhYmxlKHRoaXMuY2lyY2xlLl9wYXRoKTtcblx0XHRkcmFnZ2FibGUuZW5hYmxlKCk7XG5cblx0XHR0aGlzLnN0YXJ0UG9zLnggPSB0aGlzLmNpcmNsZS5fcG9pbnQueDtcblx0XHR0aGlzLnN0YXJ0UG9zLnkgPSB0aGlzLmNpcmNsZS5fcG9pbnQueTtcblxuXHRcdC8vIENhbGN1bGF0ZSB0aGUgbmV3IGNlbnRlcjpcblx0XHRkcmFnZ2FibGUub24oJ2RyYWcnLCAoZSkgPT4ge1xuXHRcdFx0dGhpcy5jdXJyZW50UG9zLnggPSBlLnNvdXJjZVRhcmdldC5fbmV3UG9zLng7XG5cdFx0XHR0aGlzLmN1cnJlbnRQb3MueSA9IGUuc291cmNlVGFyZ2V0Ll9uZXdQb3MueTtcblx0XHRcdHRoaXMubW92ZUNpcmNsZSgpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5tYXAub24oJ3pvb20nLCAoZSkgPT4ge1xuXHRcdFx0dmFyIG5ld1pvb21MZXZlbCA9IE51bWJlcihlLnNvdXJjZVRhcmdldC5fYW5pbWF0ZVRvWm9vbSk7XG5cdFx0XHR2YXIgbGF5ZXJQb2ludCA9IHRoaXMubWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLmNlbnRlclBvaW50KTtcblx0XHRcdHRoaXMubWFwLnNldFZpZXcodGhpcy5jZW50ZXJQb2ludCwgbmV3Wm9vbUxldmVsKTtcblx0XHRcdHRoaXMuc3RhcnRQb3MueCA9IGxheWVyUG9pbnQueCAtIHRoaXMuY3VycmVudFBvcy54O1xuXHRcdFx0dGhpcy5zdGFydFBvcy55ID0gbGF5ZXJQb2ludC55IC0gdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0XHR0aGlzLm1vdmVDaXJjbGUoKTtcblx0XHR9KTtcblx0fSxcblx0Z2V0QWxsU3RyZWV0czogYXN5bmMgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBmZXRjaCgnL2pzL3N0cmVldHMuanNvbicpXG5cdFx0XHQudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcblx0XHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0fSk7XG5cdH0sXG5cdGNoYW5nZVJhZGl1czogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuc2VsZWN0UmFkaXVzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG5cdFx0XHR2YXIgbGF0bG5nID0gdGhpcy5jaXJjbGUuZ2V0TGF0TG5nKCk7XG5cdFx0XHR2YXIgbWV0ZXJzID0gKGUudGFyZ2V0LnZhbHVlIC8gMikgKiAxMDAwO1xuXHRcdFx0dGhpcy5jcmVhdGVDaXJjbGUoT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCBtZXRlcnMpO1xuXHRcdFx0dGhpcy5jcmVhdGVQb2x5Z29uKHRoaXMuY2VudGVyUG9pbnQsIG1ldGVycyk7XG5cdFx0fSk7XG5cdH0sXG5cdG1vdmVDaXJjbGU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgeCA9IHRoaXMuc3RhcnRQb3MueCArIHRoaXMuY3VycmVudFBvcy54O1xuXHRcdHZhciB5ID0gdGhpcy5zdGFydFBvcy55ICsgdGhpcy5jdXJyZW50UG9zLnk7XG5cdFx0dmFyIHBvaW50ID0geyB4OiB4LCB5OiB5IH07XG5cdFx0dmFyIGxhdGxuZyA9IHRoaXMubWFwLmxheWVyUG9pbnRUb0xhdExuZyhwb2ludCk7XG5cdFx0dmFyIHJhZGl1cyA9IHRoaXMuY2lyY2xlLmdldFJhZGl1cygpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBuZXcgcG9seWdvbjpcblx0XHR0aGlzLmNlbnRlclBvaW50ID0gT2JqZWN0LnZhbHVlcyhsYXRsbmcpO1xuXHRcdHRoaXMuY3JlYXRlQ2lyY2xlKE9iamVjdC52YWx1ZXMobGF0bG5nKSwgcmFkaXVzKTtcblx0XHR0aGlzLmNyZWF0ZVBvbHlnb24oT2JqZWN0LnZhbHVlcyhsYXRsbmcpLCByYWRpdXMpO1xuXHRcdEwuRG9tVXRpbC5zZXRUcmFuc2Zvcm0odGhpcy5jaXJjbGUuX3BhdGgsIHsgeDogMCwgeTogMCB9KTtcblx0fSxcblx0Y3JlYXRlQ2lyY2xlOiBmdW5jdGlvbiAoY29vcmRzLCByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKSkge1xuXHRcdHRoaXMuY2lyY2xlLnNldExhdExuZyhjb29yZHMpO1xuXHRcdHRoaXMuY2lyY2xlLnNldFJhZGl1cyhyYWRpdXMpO1xuXHR9LFxuXHRjcmVhdGVQb2x5Z29uOiBmdW5jdGlvbiAoY29vcmRzLCByYWRpdXMgPSB0aGlzLmNpcmNsZS5nZXRSYWRpdXMoKSwgbnVtYmVyT2ZFZGdlcyA9IDEwKSB7XG5cdFx0Ly9sZWFmbGV0IHBvbHlnb24gdG8gd2t0XG5cdFx0dmFyIHBvbHlnb25Db29yZHMgPSBjaXJjbGVUb1BvbHlnb24oY29vcmRzLCByYWRpdXMsIG51bWJlck9mRWRnZXMpO1xuXG5cdFx0Ly8gU2V0IHRoZSBuZXcgY29vcmRzOlxuXHRcdHRoaXMucG9seWdvblxuXHRcdFx0LnNldExhdExuZ3MocG9seWdvbkNvb3Jkcy5jb29yZGluYXRlc1swXSk7XG5cblx0XHQvLyBDcmVhdGUgYSB3a3QgZnJvbSB0aGUgcG9seWdvbjpcblx0XHRpbnB1dENpcmNsZSA9IHtcblx0XHRcdHdrdDogdG9XS1QodGhpcy5wb2x5Z29uKSxcblx0XHRcdGNvb3JkczogY29vcmRzXG5cdFx0fTtcblx0fVxufTtcblxuZXhwb3J0cy5zZWxlY3RlZFN0cmVldCA9IGZ1bmN0aW9uIChzdHJlZXROYW1lKSB7XG5cdG1hcC5nZW9KU09OLmVhY2hMYXllcihsYXllciA9PiB7XG5cdFx0aWYgKGxheWVyLmZlYXR1cmUucHJvcGVydGllcy5uYW1lID09PSBzdHJlZXROYW1lKSB7XG5cdFx0XHR2YXIgYm91bmRzID0gbGF5ZXIuZ2V0Qm91bmRzKCk7XG5cdFx0XHR2YXIgY2VudGVyID0gYm91bmRzLmdldENlbnRlcigpO1xuXG5cdFx0XHR2YXIgbGF5ZXJQb2ludCA9IG1hcC5tYXAubGF0TG5nVG9MYXllclBvaW50KFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSk7XG5cdFx0XHRtYXAubWFwLnNldFZpZXcoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddLCAxNCk7XG5cblx0XHRcdG1hcC5zdGFydFBvcy54ID0gbGF5ZXJQb2ludC54IC0gbWFwLmN1cnJlbnRQb3MueDtcblx0XHRcdG1hcC5zdGFydFBvcy55ID0gbGF5ZXJQb2ludC55IC0gbWFwLmN1cnJlbnRQb3MueTtcblxuXHRcdFx0bWFwLm1vdmVDaXJjbGUoKTtcblx0XHRcdG1hcC5jcmVhdGVDaXJjbGUoW2NlbnRlci5sYXQsIGNlbnRlci5sbmddKTtcblx0XHRcdG1hcC5jcmVhdGVQb2x5Z29uKFtjZW50ZXIubGF0LCBjZW50ZXIubG5nXSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZXhwb3J0cy5pbnB1dENpcmNsZSA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGlucHV0Q2lyY2xlO1xufVxuIiwidmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwLmpzJyk7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBzZWFyY2ggPSB7XG4gICAgY3VycmVudEZvY3VzOiAwLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzZWFyY2hiYXIsIGRhdGEpIHtcbiAgICAgIC8vIEFkZCB0aGUgZ2l2ZW4gc2VhcmNoYmFyIHRvIHRoaXMgb2JqZWN0OlxuICAgICAgdGhpcy5zZWFyY2hiYXIgPSBzZWFyY2hiYXI7XG5cbiAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciBpbnB1dCB2YWx1ZTpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoKTtcbiAgICAgICAgaWYgKCFlLnRhcmdldC52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cyA9IC0xO1xuICAgICAgICB0aGlzLmdldEF1dG9jb21wbGV0ZShkYXRhLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgZm9yIGtleWJvYXJkIGZ1bmN0aW9uczpcbiAgICAgIHRoaXMuc2VhcmNoYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtaXRlbXMnKTtcblxuICAgICAgICBpZiAobGlzdCkgbGlzdCA9IGxpc3QucXVlcnlTZWxlY3RvckFsbCgnbGknKTtcblxuICAgICAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgICAgICAgIGNhc2UgNDA6XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGb2N1cysrO1xuICAgICAgICAgICAgdGhpcy5hZGRBY3RpdmUobGlzdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rm9jdXMtLTtcbiAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZlKGxpc3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRGb2N1cyA+IC0xKSB7XG4gICAgICAgICAgICAgIGlmIChsaXN0KSBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gRXZlbnQgZm9yIGNsaWNraW5nIHNlYXJjaCBidXR0b246XG4gICAgICB0aGlzLnNlYXJjaGJhci5wYXJlbnROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnNlYXJjaGJhci52YWx1ZTtcbiAgICAgICAgdGhpcy5nZXRBdXRvY29tcGxldGUoZGF0YSwgdmFsKTtcblxuICAgICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIudG9VcHBlckNhc2UoKSA9PSB2YWwudG9VcHBlckNhc2UoKSk7XG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCkgbWFwLnNlbGVjdGVkU3RyZWV0KHJlc3VsdHNbMF0pO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBFdmVudCBsaXN0ZW5lciB3aGVuIGNsaWNraW5nIHRoZSBkb2N1bWVudDpcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZUxpc3QoZS50YXJnZXQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChkYXRhLCB2YWwpIHtcbiAgICAgIC8vIENoZWNrIHdoYXQgZGF0YSBtYXRjaGVzIHRoZSBzZWFyY2ggcXVlcnk6XG4gICAgICB2YXIgcmVzdWx0cyA9IGRhdGEuZmlsdGVyKHN0ciA9PiBzdHIuc3Vic3RyKDAsIHZhbC5sZW5ndGgpLnRvVXBwZXJDYXNlKCkgPT0gdmFsLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgdGhpcy5zZXRBdXRvY29tcGxldGUocmVzdWx0cywgdmFsLmxlbmd0aCk7XG4gICAgfSxcbiAgICBzZXRBdXRvY29tcGxldGU6IGZ1bmN0aW9uIChyZXN1bHRzLCBsZW5ndGgpIHtcbiAgICAgIHZhciBhdXRvY29tcGxldGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlJyk7XG4gICAgICB2YXIgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgdmFyIHN0cm9uZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0cm9uZycpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgICB1bC5jbGFzc0xpc3QuYWRkKCdhdXRvY29tcGxldGUtaXRlbXMnKTtcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHVsKTtcblxuICAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGkpID0+IHtcbiAgICAgICAgaWYgKGkgPCAzKSB7XG4gICAgICAgICAgdmFyIGNsb25lTGkgPSBsaS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgdmFyIGNsb25lQSA9IGEuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIHZhciBjbG9uZVN0cm9uZyA9IHN0cm9uZy5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICB1bC5hcHBlbmRDaGlsZChjbG9uZUxpKTtcblxuICAgICAgICAgIGNsb25lQS5ocmVmID0gJyMnO1xuICAgICAgICAgIGNsb25lTGkuYXBwZW5kQ2hpbGQoY2xvbmVBKTtcblxuICAgICAgICAgIGNsb25lU3Ryb25nLnRleHRDb250ZW50ID0gcmVzdWx0LnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgICAgICAgY2xvbmVBLmFwcGVuZENoaWxkKGNsb25lU3Ryb25nKTtcbiAgICAgICAgICBjbG9uZUEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocmVzdWx0LnNsaWNlKGxlbmd0aCkpKTtcblxuICAgICAgICAgIGNsb25lTGkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hiYXIudmFsdWUgPSBlLnRhcmdldC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VMaXN0KCk7XG4gICAgICAgICAgICBtYXAuc2VsZWN0ZWRTdHJlZXQoZS50YXJnZXQudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGF1dG9jb21wbGV0ZS5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgfSxcbiAgICBhZGRBY3RpdmU6IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICBpZiAoIWxpc3QpIHJldHVybiBmYWxzZTtcbiAgICAgIHRoaXMucmVtb3ZlQWN0aXZlKGxpc3QpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudEZvY3VzID49IGxpc3QubGVuZ3RoKSB0aGlzLmN1cnJlbnRGb2N1cyA9IDA7XG4gICAgICBpZiAodGhpcy5jdXJyZW50Rm9jdXMgPCAwKSB0aGlzLmN1cnJlbnRGb2N1cyA9IChsaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgdGhpcy5zZWFyY2hiYXIudmFsdWUgPSBsaXN0W3RoaXMuY3VycmVudEZvY3VzXS5jaGlsZHJlblswXS50ZXh0Q29udGVudDtcbiAgICAgIGxpc3RbdGhpcy5jdXJyZW50Rm9jdXNdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKTtcbiAgICB9LFxuICAgIHJlbW92ZUFjdGl2ZTogZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaXN0W2ldLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlTGlzdDogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgIHZhciBsaXN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hdXRvY29tcGxldGUtaXRlbXMnKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbSAhPSBsaXN0c1tpXSAmJiBlbGVtICE9IHRoaXMuc2VhcmNoYmFyKSB7XG4gICAgICAgICAgbGlzdHNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsaXN0c1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBzZWFyY2g7XG5cbn0pKCk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvV0tUIChsYXllcikge1xuXHRcdHZhciBsbmcsIGxhdCwgY29vcmRzID0gW107XG5cdFx0aWYgKGxheWVyIGluc3RhbmNlb2YgTC5Qb2x5Z29uIHx8IGxheWVyIGluc3RhbmNlb2YgTC5Qb2x5bGluZSkge1xuXHRcdFx0dmFyIGxhdGxuZ3MgPSBsYXllci5nZXRMYXRMbmdzKCk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsYXRsbmdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBsYXRsbmdzMSA9IGxhdGxuZ3NbaV07XG5cdFx0XHRcdGlmIChsYXRsbmdzMS5sZW5ndGgpe1xuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGxhdGxuZ3MxLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0Y29vcmRzLnB1c2gobGF0bG5nczFbal0ubG5nICsgXCIgXCIgKyBsYXRsbmdzMVtqXS5sYXQpO1xuXHRcdFx0XHRcdGlmIChqID09PSAwKSB7XG5cdFx0XHRcdFx0XHRsbmcgPSBsYXRsbmdzMVtqXS5sbmc7XG5cdFx0XHRcdFx0XHRsYXQgPSBsYXRsbmdzMVtqXS5sYXQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb29yZHMucHVzaChsYXRsbmdzW2ldLmxuZyArIFwiIFwiICsgbGF0bG5nc1tpXS5sYXQpO1xuXHRcdFx0XHRcdGlmIChpID09PSAwKSB7XG5cdFx0XHRcdFx0XHRsbmcgPSBsYXRsbmdzW2ldLmxuZztcblx0XHRcdFx0XHRcdGxhdCA9IGxhdGxuZ3NbaV0ubGF0O1xuXHRcdFx0XHRcdH19XG5cdFx0fTtcblx0XHRcdGlmIChsYXllciBpbnN0YW5jZW9mIEwuUG9seWdvbikge1xuXHRcdFx0XHRyZXR1cm4gXCJQT0xZR09OKChcIiArIGNvb3Jkcy5qb2luKFwiLFwiKSArIFwiLFwiICsgbG5nICsgXCIgXCIgKyBsYXQgKyBcIikpXCI7XG5cdFx0XHR9IGVsc2UgaWYgKGxheWVyIGluc3RhbmNlb2YgTC5Qb2x5bGluZSkge1xuXHRcdFx0XHRyZXR1cm4gXCJMSU5FU1RSSU5HKFwiICsgY29vcmRzLmpvaW4oXCIsXCIpICsgXCIpXCI7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChsYXllciBpbnN0YW5jZW9mIEwuTWFya2VyKSB7XG5cdFx0XHRyZXR1cm4gXCJQT0lOVChcIiArIGxheWVyLmdldExhdExuZygpLmxuZyArIFwiIFwiICsgbGF5ZXIuZ2V0TGF0TG5nKCkubGF0ICsgXCIpXCI7XG5cdFx0fVxuXHR9O1xuIiwiY29uc3QgbWFwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL21hcC5qcycpO1xuY29uc3QgaW5zdHJ1Y3Rpb25TbGlkZXMgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvaW5zdHJ1Y3Rpb25TbGlkZXMuanMnKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgbWFwLmluaXQoKTtcbiAgaW5zdHJ1Y3Rpb25TbGlkZXMuaW5pdCgpO1xufSkgKCk7XG4iXX0=
