// Require JS files:
var circleToPolygon = require('./circletopolygon.js');
var toWKT = require('./towkt.js');
var search = require('./search.js');

module.exports = {
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

		// Make the circle draggable:
		var draggableCircle = new L.Draggable(this.circle._path);
		draggableCircle.enable();

		// Create the polygon, with the centerLatLng as coords:
		this.createPolygon(this.centerLatLng);

		// Add start and current position:
		this.startPos.x = this.circle._point.x;
		this.startPos.y = this.circle._point.y;
		this.moveRadiusSelect(this.startPos);

		var originCenterPoint = this.map.latLngToLayerPoint(this.centerLatLng);

		// Get all the streets:
		var allStreets = await this.getAllStreets();

		// Map the street names from allStreets for search:
		var streetNames = allStreets.map(street => street.properties.name);

		// Initialize the autocomplete search:
		search.init(this.searchbar, streetNames);

		// Add the streets data to geoJSON:
		this.geoJSON.addData(allStreets);

		// On map drag:
		this.map.on('drag', (e) => {
			this.currentPos.x = this.startPos.x + e.sourceTarget._newPos.x - this.distance.x - this.mapSize.x;
			this.currentPos.y = this.startPos.y + e.sourceTarget._newPos.y - this.distance.y - this.mapSize.y;
			this.moveRadiusSelect(this.currentPos);
		});

		// On map dragend:
		this.map.on('dragend', (e) => {
			this.startPos.x = this.currentPos.x;
			this.startPos.y = this.currentPos.y;

			this.distance.x = e.sourceTarget._newPos.x;
			this.distance.y = e.sourceTarget._newPos.y;
		});

		// On map zoomend:
		this.map.on('zoomend', (e) => {
			var newZoomLevel = Number(e.sourceTarget._animateToZoom);
			var newCenterPoint = this.map.latLngToLayerPoint(this.centerLatLng);

			this.map.setView(this.centerLatLng, newZoomLevel);

			this.startPos.x = originCenterPoint.x + this.mapSize.x;
			this.startPos.y = originCenterPoint.y + this.mapSize.y;

			this.distance.x = originCenterPoint.x - newCenterPoint.x;
			this.distance.y = originCenterPoint.y - newCenterPoint.y;

			this.moveRadiusSelect(this.startPos);
			var latLng = this.map.layerPointToLatLng(this.currentPos);
			this.createPolygon([latLng.lat, latLng.lng]);
		});

		// On map resize:
		this.map.on('resize', (e) => {
			var size = {
				x: (e.newSize.x - e.oldSize.x) / 2,
				y: (e.newSize.y - e.oldSize.y) / 2
			};

			this.startPos.x += size.x;
			this.startPos.y += size.y;

			this.mapSize.x += size.x;
			this.mapSize.y += size.y;

			this.moveRadiusSelect(this.startPos);
		});

		// This still has to work:

		// On circle drag:
		draggableCircle.on('drag', (e) => {
			this.currentPos.x = this.startPos.x + e.sourceTarget._newPos.x - this.distance.x - this.mapSize.x;
			this.currentPos.y = this.startPos.y + e.sourceTarget._newPos.y - this.distance.y - this.mapSize.y;
			this.moveRadiusSelect(this.currentPos);
		});

		// On circle dragend:
		draggableCircle.on('dragend', (e) => {
			this.startPos.x = this.currentPos.x;
			this.startPos.y = this.currentPos.y;

			this.distance.x = e.sourceTarget._newPos.x;
			this.distance.y = e.sourceTarget._newPos.y;

			// Move polygon to circle's location:
			var latLng = this.map.layerPointToLatLng(this.currentPos);
			this.createPolygon([latLng.lat, latLng.lng]);
		});
	},
	createPolygon: function (coords, radius = this.circle.getRadius(), numberOfEdges = 10) {
		//leaflet polygon to wkt
		var polygonCoords = circleToPolygon(coords, radius, numberOfEdges);

		// Set the new coords:
		this.polygon
			.setLatLngs(polygonCoords.coordinates[0])
			// .addTo(this.map) // Remove for production
			// .bringToBack(); // Remove for production

		// Create a wkt from the polygon:
		this.inputCircle = {
			wkt: toWKT(this.polygon),
			coords: coords
		};
	},
	getAllStreets: async function () {
		return fetch('/js/streets.json')
			.then(res => res.json())
			.catch(err => {
				console.log(err);
			});
	}
};

// Find a way to make this work:
// exports.selectedStreet = function (streetName) {
// 	map.geoJSON.eachLayer(layer => {
// 		if (layer.feature.properties.name === streetName) {
// 			var bounds = layer.getBounds();
// 			var center = bounds.getCenter();
//
// 			var layerPoint = map.map.latLngToLayerPoint([center.lat, center.lng]);
// 			map.map.setView([center.lat, center.lng], 14);
//
// 			map.startPos.x = layerPoint.x - map.currentPos.x;
// 			map.startPos.y = layerPoint.y - map.currentPos.y;
//
// 			map.moveCircle();
// 			map.createCircle([center.lat, center.lng]);
// 			map.createPolygon([center.lat, center.lng]);
// 		}
// 	});
// }
