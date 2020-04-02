var fetch = require('node-fetch');
var sparqlqueries = require('./sparql');
var wellknown = require('wellknown');
var turf = require('@turf/turf');

exports.location = async function (newStoryData) {
  // Fetch the street Wkts for selected location and timestamp:
  var fetchStreetWkts = async function () {
    var url = sparqlqueries.url(sparqlqueries.getStreetWkts(newStoryData.wkt));

    return await fetch(url)
      .then((resp => resp.json()))
      .then(function (data) {
        return data.results.bindings;
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  var streetWkts = await fetchStreetWkts();

  // Check if a radius is selected, or just one street:
  // if (newStoryData.coords !== null && newStoryData.coords !== undefined) {
  //   console.log('has coords');
  // } else {
  //   console.log('does not have coords');
  // }

  var streetsInRadius = streetWkts.map(function (street) {
    var parseWkt = wellknown(street.wkt.value);
    var point = turf.point([newStoryData.coords[1], newStoryData.coords[0]]);
    var line;

    // Check what type the wkt is:
    if (parseWkt.type == 'MultiLineString') {
      line = turf.multiLineString(parseWkt.coordinates);
    } else if (parseWkt.type == 'LineString') {
      line = turf.lineString(parseWkt.coordinates);
    } else {
      // line = turf.point(parseWkt.coordinates);
      return;
    }

    var nearestPoint = turf.nearestPointOnLine(line, point, {units: 'kilometers'});

    return {
      'street': street.street.value,
      'streetLabel': street.streetLabel.value,
      'distance': nearestPoint.properties.dist * 1000
    };
  });

  // Sort the streets by distance to centerpoint (closes first):
  streetsInRadius.sort(function (a, b) {
    return a.distance - b.distance;
  });

  // Fetch the images for selected location and timestamp:
  var fetchLocationAndTimestamp = async function () {
    var url = sparqlqueries.url(sparqlqueries.getLocationAndTimestamp(newStoryData));

    return await fetch(url)
	    .then((resp) => resp.json()) // transform the data into json
      .then(function (data) {
			  return data.results.bindings;
      }).catch(function (error) {
        console.log(error);
      });
  }

  var allData = await fetchLocationAndTimestamp();

  var allDataMapped = {
    years: {}
  };

  allData.forEach(function(item, i, self) {
    var year = item.start.value.split('-')[0];
    var chapter;

    if (item.street.value == streetsInRadius[0].street) {
      chapter = streetsInRadius[0].streetLabel;
    } else {
      chapter = 'Jouw buurt';
    }

    // Add chapter to item:
    item.chapter = chapter;

    if (!allDataMapped.years[year]) {
      allDataMapped.years[year] = {};
    }
    if (!allDataMapped.years[year][chapter]) {
      allDataMapped.years[year][chapter] = [];
    }

    allDataMapped.years[year][chapter].push(item);
  });

  return allDataMapped;
};
