var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql.js');
var chapters = require('./chapters.js');
var database = require('./database.js');

exports.homepage = function (req, res, next) {
  res.render('index', {
    data: req.session.searchResults
  });
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
  await database.addItem(story)
    .then(result => {
      // When added, redirect:
      res.redirect('/create-story/' + story.id);
    })
    .catch(err => console.log(err));
}

exports.getCreateStoryPage = async function (req, res, next) {
  // Put the following in its own function to be called by lazy load later:

  // Get the story from database using the id:
  await database.getItem(req.params.id)
    .then(result => {
      // Search the result.data for this first 50 images:

      res.render('create-story', {
        data: result.data,
        id: result.id
      });
    })
    .catch(err => console.log(err));
}
