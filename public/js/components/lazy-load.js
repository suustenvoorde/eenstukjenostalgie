var imageDetail = require('./image-detail.js');

const lazyLoad = {
  scrolling: true,
  lazies: document.querySelectorAll('.lazy'),
  fetchPhotoSelection: async function (startIdx) {
    var pathname = window.location.pathname.split('/');
    var id = pathname[pathname.length-1];

    // Fetch new photos:
    return await fetch ('/photo-selection/' + id + '/' + startIdx)
      .then(res => res.json())
      .catch(err => console.log(err));
  },
  addPhotos: function (selection) {
    var h2 = document.createElement('h2');
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

          //Create the h2 elem:
          var cloneH2 = h2.cloneNode(true);
          cloneH2.textContent = street.label;
          fragment.insertBefore(cloneH2, cloneUl);


          street.photos.forEach(photo => {
            // Add one to the startIdx value:
            this.startIdx++;

            // Create the li elem:
            var cloneLi = li.cloneNode(true);
            cloneLi.classList.add('photo');
            cloneLi.classList.add('lazy');
            cloneLi.classList.add('placeholder');
            cloneUl.appendChild(cloneLi);

            // Create the a elem:
            var cloneA = a.cloneNode(true);
            cloneA.classList.add('photo__img');
            cloneLi.appendChild(cloneA);

            // Create the img elem:
            var cloneImg = img.cloneNode(true);
            cloneImg.src = photo.url;
            cloneImg.alt = photo.title;
            cloneA.appendChild(cloneImg);

            cloneImg.addEventListener('load', (e) => {
              cloneLi.classList.remove('placeholder');
            });

            // Create the p elem:
            var cloneP = p.cloneNode(true);
            cloneP.classList.add('photo__desc');
            cloneP.textContent = photo.title;
            cloneLi.appendChild(cloneP);

            cloneA.addEventListener('click', (e) => {
              imageDetail.openModal(cloneImg.src, cloneImg.alt);
              e.preventDefault();
            });
          });
        });

        // Append the fragment to the year elem:
        yearElem.appendChild(fragment);
      }

      // Find last year:
      if (year == Object.keys(selection).find((year, i, self) => i == self.length-1)) {
        // Find the last lazy:
        var lastStreet = selection[year].find((street, i, self) => i == self.length-1);
        var lastPhoto = lastStreet.photos.find((photo, i, self) => i == self.length-1);
        this.lastLazy = Array.from(document.querySelectorAll('.lazy')).find(li => li.querySelector('img').src == lastPhoto.url);
        var lastImg = this.lastLazy.querySelector('img');

        lastImg.addEventListener('load', (e) => {
          this.lastLazyTop = this.lastLazy.offsetTop;
          this.scrolling = true;
        });
      }
    }
  },
  init: function () {
    // Define startIdx:
    this.startIdx = this.lazies.length;

    this.lastLazy = Array.from(this.lazies).find((lazy, i, self) => i == self.length-1);
    var scrollTop;

    // Calc the offsetTop of the last image:
    window.addEventListener('load', (e) => {
      this.lastLazyTop = this.lastLazy.offsetTop;
    });

    // Determine if scroll position >= position last img:
    document.addEventListener('scroll', async (e) => {
      if (this.scrolling) {
        scrollTop = window.scrollY;
        if (scrollTop >= this.lastLazyTop - 100) {
          this.scrolling = false;
          var selection = await this.fetchPhotoSelection(this.startIdx);
          this.addPhotos(selection);
        }
      }
    });
  }
};

module.exports = lazyLoad;
