var fetch = require('node-fetch');
var wellknown = require('wellknown');
var turf = require('@turf/turf');
var sparqlqueries = require('./sparql.js');
var database = require('./database.js');
var sizeOf = require('probe-image-size');

const chapters = {
  getPhotos: async function (formdata) {
    // Fetch the images for selected location and timestamp:
    var photos = await this.fetchLocationAndTimestamp(formdata.startyear, formdata.endyear, formdata.wkt);

    if (!photos) return undefined;

    // Map the photos with the street distance from centerPoint:
    photos = photos.map(photo => {
      var parseWkt = wellknown(photo.wkt);
      var point = turf.point([formdata.coords[1], formdata.coords[0]]);
      var line = parseWkt.type == 'MultiLineString'
        ? turf.multiLineString(parseWkt.coordinates) : parseWkt.type == 'LineString'
        ? turf.lineString(parseWkt.coordinates)
        : null;

      var nearestPoint = turf.nearestPointOnLine(line, point, { units: 'kilometers' });

      return {
        url: photo.img.split(':')[0].length == 5 ? photo.img : photo.img.split(':').join('s:'),
        title: photo.title,
        year: photo.start.slice(0,4),
        street: {
          uri: photo.street,
          label: photo.streetLabel,
          distanceFromCenter: nearestPoint.properties.dist * 1000
        }
      };
    });

    // Filter photos with year <= current year:
    photos = photos.filter(photo => photo.year <= formdata.endyear);

    // Filter out photos that have no .jpg extension:
    photos = photos.filter(photo => photo.url.includes('.jpg'));

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
      .catch(err => undefined);
  },
  getPhotoSelection: async function (id, startYear, startIdx) {
    var counter = 0;
    var max = startIdx + 500;
    return await database.getItem(database.stories, id)
      .then(result => {
        // Filter the result for streets until we reach more than 50 photos:
        for (var year in result.data) {
          if (result.data.hasOwnProperty(year)) {
            if (startYear == null) startYear = Number(Object.keys(result.data)[0]);

            result.data[year] = result.data[year].filter(street => {
              var selection;

              if (Number(year) < startYear && counter >= startIdx && counter <= max) {
                selection = street;
                startIdx += street.photos.length;
              } else if (Number(year) >= startYear && counter >= startIdx && counter < startIdx+50) {
                selection = street;
              }

              counter += street.photos.length;
              return selection;
            });
          }
        }
        return result.data;
      })
      .catch(err => undefined);
  },
  getPhotoSize: async function (url) {
    return await sizeOf(url)
      .then(image => {
        return {
          url: image.url,
          width: image.width,
          height: image.height
        };
      })
      .catch(err => console.log(err));
  }
};

module.exports = chapters;
