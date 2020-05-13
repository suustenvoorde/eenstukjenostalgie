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

module.exports = router;
