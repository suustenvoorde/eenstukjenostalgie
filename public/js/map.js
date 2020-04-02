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
