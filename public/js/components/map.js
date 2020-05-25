// Require JS files:
var circleToPolygon = require('./circle-to-polygon.js');
var toWKT = require('./to-wkt.js');
var search = require('./search.js');

const map = {
	mapElem: document.getElementById('map'),
	searchbar: document.querySelector('.searchbar'),
	radiusSelect: document.querySelector('.radius-select'),
	mapboxAccessToken: 'pk.eyJ1IjoibWF4ZGV2cmllczk1IiwiYSI6ImNqZWZydWkyNjF3NXoyd28zcXFqdDJvbjEifQ.Dl3DvuFEqHVAxfajg0ESWg',
	map: L.mapbox.map('map'),
	circle: L.circle(),
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
		L.mapbox.accessToken = this.mapboxAccessToken;

		// Set the original view of the map:
		this.map.setView(this.centerLatLng, 14);

		// Give the map the correct style:
		this.map.addLayer(L.mapbox.styleLayer('mapbox://styles/maxdevries95/ckai3ajbs0jig1ir1pq2k4nbr'));

		// Add city districts to the map:
		await this.getCityDistricts()
			.then(result => {
				this.cityDistricts = L.geoJson(result, {
					style: (feature) => {
						return {
							fillColor: '#FFFFFF',
							fillOpacity: 1,
							color: '#000000',
							opacity: 1,
							weight: 5
						}
					}
				}).addTo(this.map);
			})
			.catch(err => console.log(err));

		// Add the circle to the map
		this.map.createPane('circle');
		this.circle
			.setStyle({ className: 'radius', pane: 'circle' })
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

		draggableCircle.on('drag', (e) => {
			this.currentPos.x = e.sourceTarget._newPos.x;
			this.currentPos.y = e.sourceTarget._newPos.y;
		});

		draggableCircle.on('dragend', (e) => {
			var x = this.startPos.x + this.currentPos.x;
			var y = this.startPos.y + this.currentPos.y;
			var latLng = this.map.layerPointToLatLng({ x: x, y: y });

			this.centerLatLng = Object.values(latLng);
			this.createPolygon(this.centerLatLng);
		});

		this.map.on('zoomend', (e) => {
			var newZoomLevel = Number(e.sourceTarget._animateToZoom);
			var centerPoint = this.map.latLngToLayerPoint(this.centerLatLng);
			this.map.setView(this.centerLatLng, newZoomLevel);
			this.startPos.x = centerPoint.x - this.currentPos.x;
			this.startPos.y = centerPoint.y - this.currentPos.y;

			var latLng = this.map.layerPointToLatLng({ x: this.startPos.x, y: this.startPos.y });
			this.circle.setLatLng(Object.values(latLng));

			// Change city district stroke width:
			this.cityDistricts.eachLayer(layer => {
				var weight = newZoomLevel >= 8 && newZoomLevel < 11
					? 1 : newZoomLevel >= 11 && newZoomLevel < 13
					? 2 : newZoomLevel >= 13 && newZoomLevel < 15
					? 5 : newZoomLevel >= 15
					? 7 : 0;
				layer.setStyle({ weight: weight });
			});
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
	getCityDistricts: async function () {
		return await fetch ('/json/amsterdam-districts.geojson')
			.then(res => res.json())
			.catch(err => console.log(err));
	},
	getAllStreets: async function () {
		return fetch('/json/streets.json')
			.then(res => res.json())
			.catch(err => console.log(err));
	},
	changeRadius: function () {
		this.radiusSelect.addEventListener('change', (e) => {
			var latlng = this.circle.getLatLng();
			var meters = e.target.value / 2;
			this.createCircle(Object.values(latlng), meters);
			this.createPolygon(this.centerLatLng, meters);
		});
	},
	createPolygon: function (coords, radius = this.circle.getRadius(), numberOfEdges = 10) {
		//leaflet polygon to wkt
		var polygonCoords = circleToPolygon(coords, radius, numberOfEdges);

		// Set the new coords:
		if (!this.polygon) this.polygon = L.polygon(polygonCoords.coordinates[0]);

		this.polygon
			.setLatLngs(polygonCoords.coordinates[0])
			.addTo(this.map); // Remove for production

		// Create a wkt from the polygon:
		this.inputCircle = {
			wkt: toWKT(this.polygon),
			coords: coords
		};
	},
};

module.exports = map;

exports.selectedStreet = function (streetName) {
	map.geoJSON.eachLayer(layer => {
		if (layer.feature.properties.name === streetName) {
			var bounds = layer.getBounds();

			map.centerLatLng = Object.values(bounds.getCenter());
			map.map.setView(map.centerLatLng, map.map.getZoom());
			map.createPolygon(map.centerLatLng);

			var centerPoint = map.map.latLngToLayerPoint(map.centerLatLng);

			map.startPos.x = centerPoint.x - map.currentPos.x;
			map.startPos.y = centerPoint.y - map.currentPos.y;

			var latLng = map.map.layerPointToLatLng({ x: map.startPos.x, y: map.startPos.y });
			map.circle.setLatLng(Object.values(latLng));
		}
	});
}
