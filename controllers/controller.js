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
  console.log(req.params);
  var selection = await chapters.getPhotoSelection(req.params.id, 0);

  // Render the create story page:
  res.render('create-story', {
    data: selection,
    sharedPhoto: req.sharedPhoto
  });
}

exports.getPhotoSelectionPage = async function (req, res, next) {
  var selection = await chapters.getPhotoSelection(req.params.id, Number(req.params.startYear), Number(req.params.startIdx));
  for (var year in selection) {
    if (selection.hasOwnProperty(year) && selection[year].length == 0) delete selection[year];
  }
  res.json(selection);
}

exports.postPhotoPage = async function (req, res, next) {
  // Create the photo data:
  var photo = req.body;
  photo.id = shortid.generate();

  // Add the photo to the database:
  await database.addItem(database.photos, photo)
    .then(result => {
      res.send(JSON.stringify(photo));
    })
    .catch(err => console.log(err));
}

exports.getPhotoPage = async function (req, res, next) {
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
