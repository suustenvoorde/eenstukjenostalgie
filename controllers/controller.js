var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql.js');
var chapters = require('./chapters.js');

var database = [];

// Return the current story:
var findCurrentStory = function (arr, id) {
  return arr.find(story => story.id == id);
}

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

exports.postCreateStoryPage = function (req, res, next) {
  // Create a stories array in session:
  if (!req.session.stories) req.session.stories = [];

  // Create id for new story:
  var id = shortid.generate();

  // Create and push a story object in session, which we will fill in later:
  req.session.stories.push({
    "id": id,
    "key": null,
    "title": null,
    "meta": {},
    "newStoryData": req.body,
    "data": {},
    "selection": {}
  });

  res.redirect('/create-story/' + id);
}

exports.getCreateStoryPage = async function (req, res, next) {
  // Check if given id exists in database:
  var checkDatabase = database.some(story => story.id == req.params.id);
  var storage = checkDatabase ? database : req.session.stories;
  var currentStory = findCurrentStory(storage, req.params.id);

  if (!checkDatabase) {
    var result = await chapters.location(currentStory.newStoryData);
    currentStory.data = result.years;
  }

  var data = currentStory.data;
  var selection = currentStory.selection;

  res.render('create-story', {
    dataFirstQuery: data,
    selection: selection,
    id: req.params.id
  });
}
