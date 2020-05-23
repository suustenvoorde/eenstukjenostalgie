var lazyLoad = require('./components/lazy-load.js');
var imageDetail = require('./components/image-detail.js');
var share = require('./components/share.js');
var shareModal = require('./components/share-modal.js');
var hamburgerMenu = require('./components/hamburger-menu-table-of-contents.js');
var activeYear = require('./components/active-year-class.js');

const createStory = {
  init: function () {
    lazyLoad.init();
    imageDetail.init();
    share.init();
    shareModal.init();
    hamburgerMenu.init();
    activeYear.init();
  }
};

createStory.init();
