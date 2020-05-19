var imageDetail = require('./components/image-detail.js');
var share = require('./components/share.js');
var shareModal = require('./components/share-modal.js');

const createStory = {
  init: function () {
    imageDetail.init();
    share.init();
    shareModal.init();
  }
};

createStory.init();
