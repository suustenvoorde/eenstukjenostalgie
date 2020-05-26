var express = require('express');
var router = express.Router();
var controller = require('../controllers/controller.js');

// GET new story page:
router.get('/', controller.homepage);

// POST create story page:
router.post('/create-story', controller.postCreateStoryPage);

// GET create story page:
router.get('/:street/:id', controller.getCreateStoryPage);

// GET photo selection page:
router.get('/photo-selection/:id/:startIdx', controller.getPhotoSelectionPage);

// POST photo share page:
router.post('/photo', controller.postPhotoPage);

// GET photo share page:
router.get('/photo/:id', controller.getPhotoPage);

module.exports = router;
