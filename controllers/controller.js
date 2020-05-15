var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql.js');
var chapters = require('./chapters.js');
var database = require('./database.js');

// Return the current story:
// var findCurrentStory = function (arr, id) {
//   return arr.find(story => story.id == id);
// }

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
  // Create a story object:
  var story = {
    id: shortid.generate(),
    location: req.body.wkt,
    coords: req.body.coords,
    startyear: req.body.startyear,
    endyear: req.body.endyear
  };

  // Add story to the database:
  await database.addItem(story)
    .then(result => {
      // When added, redirect:
      res.redirect('/create-story/' + story.id);
    })
    .catch(err => {
      console.log(err);
    });
}

exports.getCreateStoryPage = async function (req, res, next) {
  // // Check if given id exists in database:
  // var checkDatabase = database.some(story => story.id == req.params.id);
  // var storage = checkDatabase ? database : req.session.stories;
  // var currentStory = findCurrentStory(storage, req.params.id);
  //
  // if (!checkDatabase) {
  //   var result = await chapters.location(currentStory.newStoryData);
  //   currentStory.data = result.years;
  // }
  //
  // var data = currentStory.data;
  // var selection = currentStory.selection;

  // res.render('create-story', {
  //   dataFirstQuery: data,
  //   selection: selection,
  //   id: req.params.id
  // });

  // Temporary
  res.render('create-story', {
    dataFirstQuery: [],
    selection: [],
    id: req.params.id
  });
}
