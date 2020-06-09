var fetch = require('node-fetch');
var uuid = require('uuid/v1');
var shortid = require('shortid');
var sparqlqueries = require('./sparql.js');
var chapters = require('./chapters.js');
var database = require('./database.js');
var errorStatus = require('./error-status.js');

exports.homepage = async function (req, res, next) {
  // Render the homepage:
  res.render('index');
}

exports.postCreateStoryPage = async function (req, res, next) {
  // Check for error startyear > endyear:
  if (req.body.startyear > req.body.endyear) {
    res.redirect('/error?status=incorrectTimestamp');
    return;
  }

  // Get the photos from the API:
  var photos = await chapters.getPhotos(req.body);

  // Check for API error:
  if (!photos) {
    res.redirect('/error?status=noApiConnection');
    return;
  }

  // Check for error no photos found:
  if (Object.values(photos).length == 0) {
    res.redirect('/error?status=noPhotosFound');
    return;
  }

  // Create a story object:
  var story = {
    id: shortid.generate(),
    date: new Date(Date.now()),
    data: photos
  };

  var street = story.data[Object.keys(story.data)[0]][0].uri;
  street = street.split('/')[street.split('/').length-2];
  street = street.split('-').join('');

  // Add story to the database:
  await database.addItem(database.stories, story)
    .then(result => {
      // When added, redirect:
      res.redirect('/' + street + '/' + story.id);
    })
    .catch(err => res.redirect('/error?status=noPhotosToDB'));
}

exports.getCreateStoryPage = async function (req, res, next) {
  // Get the story from database using the id:
  var selection = await chapters.getPhotoSelection(req.params.id, null, 0);

  if (!selection) {
    res.redirect('/error?status=noPhotosFromDB');
    return;
  }

  // Render the create story page:
  res.render('create-story', {
    data: selection,
    sharedPhoto: req.sharedPhoto
  });
}

exports.getPhotoSelectionPage = async function (req, res, next) {
  var sizesQueue = [];
  var selection = await chapters.getPhotoSelection(req.params.id, Number(req.params.startYear), Number(req.params.startIdx));

  for (var year in selection) {
    if (selection.hasOwnProperty(year) && selection[year].length > 0) {
      var photos = selection[year].map(street => street.photos);
      photos = [].concat.apply([], photos);
      photos.forEach(photo => sizesQueue.push(chapters.getPhotoSize(photo.url)));
    } else {
      delete selection[year];
    }
  }

  Promise.all(sizesQueue)
    .then(sizes => {
      for (var year in selection) {
        if (selection.hasOwnProperty(year)) {
          for (var street of selection[year]) {
            street.photos = street.photos.map(photo => {
              var size = sizes.find(size => size.url === photo.url);
              photo.width = size.width;
              photo.height = size.height;
              return photo;
            });
          }
        }
      }
      res.json(selection);
    })
    .catch(err => console.log(err));
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
    .catch(err => res.redirect('/error?status=noPhotoFromDB'));
}

exports.getAboutPage = function (req, res, next) {
  res.render('about');
}

exports.getErrorPage = function (req, res, next) {
  var status = errorStatus[req.query.status];
  res.render('error', {
    status: status
  });
}

exports.catchNonExistingPages = function (req, res, next) {
  res.status(404).redirect('/error?status=pageNotFound');
}
