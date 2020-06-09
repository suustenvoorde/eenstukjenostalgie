var express = require('express');
var router = express.Router();
var controller = require('../controllers/controller.js');

// GET homepage:
router.get('/', controller.homepage);

// POST photo share page:
router.post('/foto', controller.postPhotoPage);

// GET photo share page:
router.get('/foto/:id', controller.getPhotoPage);

// GET about page:
router.get('/over', controller.getAboutPage);

// POST create story page:
router.post('/create-story', controller.postCreateStoryPage);

// GET create story page:
router.get('/:street/:id', controller.getCreateStoryPage);

// GET photo selection page:
router.get('/photo-selection/:id/:startYear/:startIdx', controller.getPhotoSelectionPage);

// GET error page:
router.get('/error', controller.getErrorPage);

// CATCH non existing page requests:
router.use(controller.catchNonExistingPages);

module.exports = router;
