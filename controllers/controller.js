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

exports.newStoryPage = function (req, res, next) {
  res.render('new-story', {
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

exports.postMyStoryPage = function (req, res, next) {
  var id = req.params.id;

  // Place the selected images from data to selection:
  var currentStory = findCurrentStory(req.session.stories, id);
  var selectedImages = [].concat.apply([], Object.values(req.body));

  // Create an array of all chapters:
  var allChapters = Object.values(currentStory.data);
  var mergedChapters = [].concat.apply([], allChapters.map(chapter => [].concat.apply([], Object.values(chapter))));
  var selection = [];

  // Push all selected images with meta data in selection array:
  selectedImages.forEach(image => {
    mergedChapters.filter(item => {
      if (item.img.value == image) selection.push(item);
    });
  });

  var imgs = selection.map(item => item.img.value);
  selection = selection.filter((item, i) => imgs.indexOf(item.img.value) == i);

  // Map the selection by year and chapter:
  selection.forEach(item => {
    var year = item.start.value.split('-')[0];
    var chapter = item.chapter;

    // Remove img from original data:
    currentStory.data[year][chapter].splice(currentStory.data[year][chapter].indexOf(item), 1);

    // If there are no images in chapter, remove chapter:
    if (!currentStory.data[year][chapter].length) delete currentStory.data[year][chapter];

    // If there are no chapters in year, remove year:
    if (!Object.keys(currentStory.data[year]).length) delete currentStory.data[year];

    if (!currentStory.selection[year]) currentStory.selection[year] = {};
    if (!currentStory.selection[year][chapter]) currentStory.selection[year][chapter] = [];

    currentStory.selection[year][chapter].push(item);
  });

  database.push(req.session.stories.find(story => story.id == id));
  res.redirect('/my-story/' + id);
}

exports.getMyStoryPage = function (req, res, next) {
  // Check if given id exists in database:
  var checkDatabase = database.some(story => story.id == req.params.id);
  var storage = checkDatabase ? database : req.session.stories;
  var currentStory = findCurrentStory(storage, req.params.id);
  var selection = currentStory.selection;

  res.render('my-story', {
    selection: selection,
    id: req.params.id,
    link: req.headers.host + req.path,
    edit: currentStory.edit
  });
}

exports.saveStoryPage = function (req, res, next) {
  // Generate new key:
  var key = uuid();
  var currentStory = req.session.stories.find(story => story.id == req.params.id);

  // Add key to story data:
  currentStory.key = key;
  currentStory.edit = false;

  // Temporary empty database for dev:
  database.splice(0, database.length);

  // Push the story object in temporary database:
  database.push(currentStory);

  // Create the new url:
  var url = req.get('host') + '/my-story/' + req.params.id;
  res.redirect('/my-story/' + req.params.id);
}

exports.editStoryPage = function (req, res, next) {
  var currentStory = req.session.stories.find(story => story.id == req.params.id);
  currentStory.edit = true;
  res.redirect('/my-story/' + req.params.id);
}

exports.photoBookPage = function(req, res, next) {
	res.render('photobook');
}
