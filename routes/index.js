var express = require('express');
var router = express.Router();
var controller = require('../controllers/controller.js');

// GET new story page:
router.get('/', controller.homepage);

// POST search location page:
router.post('/search-location', controller.searchLocationPage);

// POST create story page:
router.post('/create-story', controller.postCreateStoryPage);

// GET create story page:
router.get('/create-story/:id', controller.getCreateStoryPage);

// POST photo share page:
router.post('/share/photo', controller.postPhotoSharePage);

// GET photo share page:
router.get('/share/photo/:id', controller.getPhotoSharePage);

module.exports = router;
