var imageDetail = require('./components/image-detail.js');
var share = require('./components/share.js');

const createStory = {
  init: function () {
    imageDetail.init();
    share.init();
  }
};

createStory.init();
