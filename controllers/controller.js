var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql.js');
var chapters = require('./chapters.js');
var database = require('./database.js');

exports.homepage = async function (req, res, next) {
  // Render the homepage:
  res.render('index');
}

exports.searchLocationPage = function (req, res, next) {
  var url = sparqlqueries.url(sparqlqueries.getLocationBySearch(req.body.searchLocation));

  fetch (url)
    .then(res => res.json())
    .then(data => {
      var rows = data.results.bindings;
      req.session.searchResults = rows;
      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
    });
}

exports.postCreateStoryPage = async function (req, res, next) {
  // Get the photos from the API:
  var photos = await chapters.getPhotos(req.body);

  // Create a story object:
  var story = {
    id: shortid.generate(),
    data: photos
  };

  // Add story to the database:
  await database.addItem(database.stories, story)
    .then(result => {
      // When added, redirect:
      res.redirect('/create-story/' + story.id);
    })
    .catch(err => console.log(err));
}

exports.getCreateStoryPage = async function (req, res, next) {
  // Get the story from database using the id:
  await database.getItem(database.stories, req.params.id)
    .then(result => {
      res.render('create-story', {
        data: result.data,
        id: result.id
      });
    })
    .catch(err => console.log(err));
}

exports.postPhotoSharePage = async function (req, res, next) {
  // Create the photo data:
  var photo = req.body;
  photo.id = shortid.generate();

  // Add the photo to the database:
  await database.addItem(database.photos, photo)
    .then(result => {
      res.redirect('/share/photo/' + photo.id);
    })
    .catch(err => console.log(err));
}

exports.getPhotoSharePage = async function (req, res, next) {
  // Get the photo from the database:
  await database.getItem(database.photos, req.params.id)
    .then(result => {
      res.render('photo-share', {
        src: result.src,
        alt: result.alt
      });
    })
    .catch(err => console.log(err));
}
