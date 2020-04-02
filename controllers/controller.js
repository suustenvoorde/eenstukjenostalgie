var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql');
var chapters = require('./chapters.js');

/*
  Story data structure:
  ---------------------

  story: {
    "id": 0001,
    "key": "A0B1CC2",
    "title": "Mijn verhaal van Amsterdam",
    "meta": {
      "name": "Anne Frank",
      "birthyear": 1929
    },
    "data": {
      "1940": {
        "de buurt": [img, img],
        "de overige straten": [img, img]
      },
      "1941": {
        "Sint Agnietenstraat": [img],
        "de buurt": [img, img],
        "de overige straten": [img, img],
        "basisschool": [img, img],
        "posters": [img, img]
      }
    },
    "selection": {
      "1940": {
        "de buurt": [img]
      }
    }
  }
*/

var database = [];

// Return the current story:
var findCurrentStory = function (arr, id) {
  return arr.find(function (story) {
    return story.id == id;
  });
}

exports.homePage = function (req, res, next) {
  res.render('index');
}

exports.newStoryPage = function (req, res, next) {
  res.render('new-story', {
    data: req.session.searchResults
  });
}

exports.searchLocationPage = function (req, res, next) {
  var url = sparqlqueries.url(sparqlqueries.getLocationBySearch(req.body.searchLocation));

  fetch(url)
    .then((resp) => resp.json())
    .then(function (data) {
      var rows = data.results.bindings;
      req.session.searchResults = rows;
      res.redirect('/new-story');
    })
    .catch(function (error) {
      console.log(error);
    });
}

exports.postCreateStoryPage = function (req, res, next) {
  console.log('client post works');

  // Create a stories array in session:
  if (!req.session.stories) {
    req.session.stories = [];
  }

  // Create id for new story:
  var id = shortid.generate();

  // Create a story object, which we will fill in later:
  var story = {
    "id": id,
    "key": null,
    "title": null,
    "meta": {},
    "newStoryData": req.body,
    "data": {},
    "selection": {}
  };

  // Push story object in stories array in session:
  req.session.stories.push(story);

  res.redirect('/create-story/' + id);
}

exports.getCreateStoryPage = async function (req, res, next) {
  // Check if given id exists in database:
  var checkDatabase = database.some(function (story) {
    return story.id == req.params.id;
  });

  var data;
  var selection;

  if (checkDatabase) {
    var currentStory = findCurrentStory(database, req.params.id);
    data = currentStory.data;
    selection = currentStory.selection;
  } else {
    var currentStory = findCurrentStory(req.session.stories, req.params.id);
    var result = await chapters.location(currentStory.newStoryData);

    currentStory.data = result.years;
    data = currentStory.data;
    selection = currentStory.selection;
  }

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
  var arr = allChapters.map(function (chapter) {
    return [].concat.apply([], Object.values(chapter));
  });

  // Merge all the images from different chapters in one array:
  var merged = [].concat.apply([], arr);

  var selection = [];

  // Push all selected images with meta data in selection array:
  selectedImages.forEach(function (image) {
    merged.filter(function (item, i) {
      if (item.img.value == image) {
        selection.push(item);
      }
    });
  });

  var imgs = selection.map(function (item) {
    return item.img.value;
  });

  selection = selection.filter(function (item, i) {
    if (imgs.indexOf(item.img.value) === i) {
      return item;
    }
  });

  // Map the selection by year and chapter:
  selection.forEach(function (item) {
    var year = item.start.value.split('-')[0];
    var chapter = item.chapter;

    // Remove img from original data:
    currentStory.data[year][chapter].splice(currentStory.data[year][chapter].indexOf(item), 1);

    // If there are no images in chapter, remove chapter:
    if (!currentStory.data[year][chapter].length) {
      delete currentStory.data[year][chapter];
    }

    // If there are no chapters in year, remove year:
    if (!Object.keys(currentStory.data[year]).length) {
      delete currentStory.data[year];
    }

    if (!currentStory.selection[year]) {
      currentStory.selection[year] = {};
    }
    if (!currentStory.selection[year][chapter]) {
      currentStory.selection[year][chapter] = [];
    }

    currentStory.selection[year][chapter].push(item);
  });

  var thisStory = req.session.stories.find(function (story) {
    return story.id == id;
  });

  // database.splice(0, database.length);

  database.push(thisStory);

  res.redirect('/my-story/' + id);
}

exports.getMyStoryPage = function (req, res, next) {
  // Check if given id exists in database:
  var checkDatabase = database.some(function (story) {
    return story.id == req.params.id;
  });

  var selection;

  if (checkDatabase) {
    var currentStory = findCurrentStory(database, req.params.id);
    selection = currentStory.selection;
  } else {
    var currentStory = findCurrentStory(req.session.stories, req.params.id);
    selection = currentStory.selection;
  }

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

  var currentStory = req.session.stories.find(function (story) {
    return story.id == req.params.id;
  });

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

  // res.render('save-story', {
  //   url: url,
  //   key: key
  // });
}

exports.editStoryPage = function (req, res, next) {
  var currentStory = req.session.stories.find(function (story) {
    return story.id == req.params.id;
  });
  currentStory.edit = true;
  res.redirect('/my-story/' + req.params.id);
}

exports.photoBookPage = function(req, res, next) {
	res.render('photobook');
}
