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
          uri: photo.street.value,
          label: photo.streetLabel.value,
          distanceFromCenter: nearestPoint.properties.dist * 1000
        }
      };
    });

    // Filter photos with year <= current year:
    photos = photos.filter(photo => photo.year <= formdata.endyear);

    // Create the data object:
    var data = {};

    photos.forEach(photo => {
      // Add the year to the data:
      var year = photo.year;
      if (!data[year]) data[year] = [];

      // Add the street to the data:
      if (!Object.values(data[year]).find(street => street.uri == photo.street.uri)) {
        data[year].push({
          uri: photo.street.uri,
          label: photo.street.label,
          distanceFromCenter: photo.street.distanceFromCenter,
          photos: []
        });
      }

      // Add the photos to the data:
      var street = data[year].find(street => street.uri == photo.street.uri);
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
  }
};

module.exports = chapters;
