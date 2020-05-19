const lazyLoad = {
  images: document.querySelectorAll('.lazy'),
  fetchPhotoSelection: async function (startIdx) {
    var pathname = window.location.pathname.split('/');
    var id = pathname[pathname.length-1];

    // Fetch new photos:
    return await fetch ('/photo-selection/' + id + '/' + startIdx)
      .then(res => res.json())
      .catch(err => console.log(err));
  },
  init: async function () {
    // ...Create img element and place in correct year:
    // Maybe for extra beauty: Add placeholders for photos to come:

    var scrolling = true;
    var finalImg = this.images[this.images.length-1];
    var finalImgTop, scrollTop;

    // Calc the offsetTop of the final image:
    window.addEventListener('load', (e) => {
      finalImgTop = finalImg.offsetTop;
    });

    // Determine if scroll position >= position final img:
    document.addEventListener('scroll', async (e) => {
      if (scrolling) {
        scrollTop = window.scrollY;
        if (scrollTop >= finalImgTop) {
          scrolling = false;
          var selection = await this.fetchPhotoSelection(this.images.length);
          console.log(selection);
        }
      }
    });
  }
};

module.exports = lazyLoad;
