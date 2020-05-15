var fetch = require('node-fetch');
var sparqlqueries = require('./sparql');
var wellknown = require('wellknown');
var turf = require('@turf/turf');

const chapters = {
  getPhotos: async function (formdata) {
    // Fetch the images for selected location and timestamp:
    var photos = await this.fetchLocationAndTimestamp(formdata.startyear, formdata.endyear, formdata.wkt);

    // Map the photos with the street distance from centerPoint:
    photos = photos.map(photo => {
      var parseWkt = wellknown(photo.wkt.value);
      var point = turf.point([formdata.coords[1], formdata.coords[0]]);
      var line = parseWkt.type == 'MultiLineString'
        ? turf.multiLineString(parseWkt.coordinates) : parseWkt.type == 'LineString'
        ? turf.lineString(parseWkt.coordinates)
        : null;

      var nearestPoint = turf.nearestPointOnLine(line, point, { units: 'kilometers' });

      return {
        url: photo.img.value.split(':').join('s:'),
        title: photo.title.value,
        year: photo.start.value.slice(0,4),
        street: {
          label: photo.streetLabel.value,
          uri: photo.street.value,
          distanceFromCenter: nearestPoint.properties.dist * 1000
        }
      };
    });

    // Filter photos with year <= current year:
    photos = photos.filter(photo => photo.year <= formdata.endyear);

    // Get the unique streets:
    var streets = photos.map(photo => photo.street.label);
    var uniqueStreets = this.removeDuplicates(streets);

    // Create the data object:
    var data = {};

    // Add the years to the data:
    photos.forEach(photo => {
      var year = photo.year;
      if (!data[year]) data[year] = [];
    });

    // Add unique streets to the data:
    uniqueStreets.forEach(label => {
      for (var year in data) {
        if (data.hasOwnProperty(year)) {
          data[year].push({
            label: label,
            photos: []
          });
        }
      }
    });

    // Add photos to correct year and street:
    photos.forEach(photo => {
      var year = photo.year;
      var street = data[year].find(street => street.label == photo.street.label);

      street.uri = photo.street.uri;
      street.distanceFromCenter = photo.street.distanceFromCenter;
      street.photos.push({
        url: photo.url,
        title: photo.title
      });

      // Sort the streets by distance from centerPoint (nearest first):
      data[year].sort((a,b) => a.distanceFromCenter - b.distanceFromCenter);
    });

    return data;
  },
  fetchLocationAndTimestamp: async function (startyear, endyear, wkt) {
    var url = sparqlqueries.getLocationAndTimestamp(startyear, endyear, wkt);

    return await fetch (url)
      .then(res => res.json())
      .then(data => data.results.bindings)
      .catch(err => console.log(err));
  },
  removeDuplicates: function (arr) {
    var unique = [];
    arr.forEach(item => {
      if (!unique.includes(item)) unique.push(item);
    });
    return unique;
  }
};

module.exports = chapters;
