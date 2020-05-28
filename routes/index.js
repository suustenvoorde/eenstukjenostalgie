var express = require('express');
var router = express.Router();
var controller = require('../controllers/controller.js');

// GET new story page:
router.get('/', controller.homepage);

// POST photo share page:
router.post('/foto', controller.postPhotoPage);

// GET photo share page:
router.get('/foto/:id', controller.getPhotoPage);

// POST create story page:
router.post('/create-story', controller.postCreateStoryPage);

// GET create story page:
router.get('/:street/:id', controller.getCreateStoryPage);

// GET photo selection page:
router.get('/photo-selection/:id/:startYear/:startIdx', controller.getPhotoSelectionPage);

module.exports = router;
