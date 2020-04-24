var fetch = require('node-fetch');
var sparqlqueries = require('./sparql');
var wellknown = require('wellknown');
var turf = require('@turf/turf');

exports.location = async function (newStoryData) {
  // Fetch the street Wkts for selected location and timestamp:
  var fetchStreetWkts = async function () {
    var url = sparqlqueries.url(sparqlqueries.getStreetWkts(newStoryData.wkt));

    return await fetch(url)
      .then(res => res.json())
      .then(data => data.results.bindings)
      .catch((err) => {
        console.log(err);
      });
  }

  var streetWkts = await fetchStreetWkts();

  var streetsInRadius = streetWkts.map(street => {
    var parseWkt = wellknown(street.wkt.value);
    var point = turf.point([newStoryData.coords[1], newStoryData.coords[0]]);
    var line = parseWkt.type == 'MultiLineString'
      ? turf.multiLineString(parseWkt.coordinates) : parseWkt.type == 'LineString'
      ? turf.lineString(parseWkt.coordinates)
      : null;

    var nearestPoint = turf.nearestPointOnLine(line, point, {units: 'kilometers'});

    return {
      'street': street.uri.value,
      'label': street.label.value,
      'distance': nearestPoint.properties.dist * 1000
    };
  });

  // Sort the streets by distance to centerpoint (closes first):
  streetsInRadius.sort((a,b) => a.distance - b.distance);

  // Fetch the images for selected location and timestamp:
  var fetchLocationAndTimestamp = async function () {
    var url = sparqlqueries.url(sparqlqueries.getLocationAndTimestamp(newStoryData));

    return await fetch(url)
	    .then(res => res.json())
      .then(data => data.results.bindings)
      .catch(err => {
        console.log(err);
      });
  }

  var allData = await fetchLocationAndTimestamp();

  var allDataMapped = {
    years: {}
  };

  allData.forEach(item => {
    var year = item.start.value.split('-')[0];
    item.chapter = item.street.value == streetsInRadius[0].street
      ? streetsInRadius[0].label
      : 'Jouw buurt';

    if (!allDataMapped.years[year]) allDataMapped.years[year] = {};
    if (!allDataMapped.years[year][item.chapter]) allDataMapped.years[year][item.chapter] = [];

    allDataMapped.years[year][item.chapter].push(item);
  });

  return allDataMapped;
};
