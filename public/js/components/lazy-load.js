const lazyLoad = {
  scrolling: true,
  images: document.querySelectorAll('.lazy'),
  fetchPhotoSelection: async function (startIdx) {
    var pathname = window.location.pathname.split('/');
    var id = pathname[pathname.length-1];

    // Fetch new photos:
    return await fetch ('/photo-selection/' + id + '/' + startIdx)
      .then(res => res.json())
      .catch(err => console.log(err));
  },
  addPhotos: function (selection) {
    console.log(selection);
    // Create img element and place it in the correct year:
    // Replace lastImg variable:
    // Replace lastImgTop value:
    // Toggle scrolling boolean:
  },
  init: function () {
    // Add loader:
    // Maybe for extra beauty: Add placeholders for photos to come:

    this.lastImg = this.images[this.images.length-1];
    var scrollTop;

    // Calc the offsetTop of the last image:
    window.addEventListener('load', (e) => {
      this.lastImgTop = this.lastImg.offsetTop;
    });

    // Determine if scroll position >= position last img:
    document.addEventListener('scroll', async (e) => {
      if (this.scrolling) {
        scrollTop = window.scrollY;
        if (scrollTop >= this.lastImgTop) {
          this.scrolling = false;
          var selection = await this.fetchPhotoSelection(this.images.length);
          this.addPhotos(selection);
        }
      }
    });
  }
};

module.exports = lazyLoad;
