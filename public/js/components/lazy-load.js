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

    var ul = document.createElement('ul');
    var li = document.createElement('li');
    var a = document.createElement('a');
    var img = document.createElement('img');
    var p = document.createElement('p');

    for (var year in selection) {
      if (selection.hasOwnProperty(year)) {
        var yearElem = document.getElementById('year-' + year);
        var fragment = document.createDocumentFragment();

        selection[year].forEach(street => {
          // Create the new street ul elem:
          var classname = street.uri.split('/')[street.uri.split('/').length-2];
          var cloneUl = ul.cloneNode(true);
          cloneUl.classList.add('street');
          cloneUl.classList.add(classname);
          fragment.appendChild(cloneUl);

          street.photos.forEach(photo => {
            // Add one to the startIdx value:
            this.startIdx++;

            // Create the li elem:
            var cloneLi = li.cloneNode(true);
            cloneLi.classList.add('photo');
            cloneUl.appendChild(cloneLi);

            // Create the a elem:
            var cloneA = a.cloneNode(true);
            cloneA.classList.add('photo__img');
            cloneLi.appendChild(cloneA);

            // Create the img elem:
            var cloneImg = img.cloneNode(true);
            cloneImg.classList.add('lazy');
            cloneImg.src = photo.url;
            cloneImg.alt = photo.title;
            cloneA.appendChild(cloneImg);

            // Create the p elem:
            var cloneP = p.cloneNode(true);
            cloneP.classList.add('photo__desc');
            cloneP.textContent = photo.title;
            cloneLi.appendChild(cloneP);
          });
        });

        // Append the fragment to the year elem:
        yearElem.appendChild(fragment);
      }

      // Find last img:
      if (year == Object.keys(selection)[Object.keys(selection).length-1]) {
        var lastImg = selection[year][selection[year].length-1].photos.find((photo, i, self) => i == self.length-1);
        this.lastImg = Array.from(document.querySelectorAll('.lazy')).find(img => img.src == lastImg.url);

        this.lastImg.addEventListener('load', () => {
          // Define the new lastImgTop
          this.lastImgTop = this.lastImg.offsetTop;

          // Define the new startIdx:
          console.log(this.startIdx);

          // Toggle scrolling boolean:
          this.scrolling = true;
        });
      }
    }
  },
  init: function () {
    // Add loader:
    // Maybe for extra beauty: Add placeholders for photos to come:

    // Define startIdx:
    this.startIdx = this.images.length;

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
        if (scrollTop >= this.lastImgTop - 100) {
          this.scrolling = false;
          var selection = await this.fetchPhotoSelection(this.startIdx);
          this.addPhotos(selection);
        }
      }
    });
  }
};

module.exports = lazyLoad;
