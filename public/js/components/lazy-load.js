var imageDetail = require('./image-detail.js');
var share = require('./share.js');
var errors = require('./errors.js');

const lazyLoad = {
  scrolling: true,
  lazies: document.querySelectorAll('.lazy'),
  fetchPhotoSelection: async function (startYear, startIdx) {
    var pathname = window.location.pathname.split('/');
    var id = pathname[pathname.length-1];

    // Fetch new photos:
    return await fetch ('/photo-selection/' + id + '/' + startYear + '/' + startIdx)
      .then(res => res.json())
      .catch(err => errors.fire('noSelectionFound'));
  },
  addPhotos: function (selection) {
    var h2 = document.createElement('h2');
    var ul = document.createElement('ul');
    var li = document.createElement('li');
    var a = document.createElement('a');
    var img = document.createElement('img');
    var p = document.createElement('p');
    var button = document.createElement('button');

    for (var year in selection) {
      if (selection.hasOwnProperty(year)) {
        var yearElem = document.getElementById('year-' + year);
        var crosses = img.cloneNode(true);
        var fragment = document.createDocumentFragment();

        this.startYear = Object.keys(selection)[Object.keys(selection).length-1];

        crosses.classList.add('crosses');
        crosses.src = '/images/crosses-amsterdam.svg';
        crosses.alt = '';
        fragment.appendChild(crosses);

        selection[year].forEach((street, i) => {
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

          street.photos.forEach((photo, j) => {
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

              if (i == selection[year].length-1 && j == street.photos.length-1) {
                this.lastLazyTop = cloneLi.offsetTop;
                this.scrolling = true;
              }
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

            var cloneButton = button.cloneNode(true);
            cloneButton.classList.add('share-btn');
            cloneButton.type = 'button';
            cloneLi.appendChild(cloneButton);

            var cloneButtonImage = img.cloneNode(true);
            cloneButtonImage.src = '../../images/icons/share.svg';
            cloneButton.appendChild(cloneButtonImage);

            cloneButton.addEventListener('click', (e) => {
              share.postPhoto(cloneButton);
            });
          });
        });

        // Append the fragment to the year elem:
        yearElem.appendChild(fragment);
      }
    }
  },
  init: function () {
    // Define startIdx:
    this.startIdx = this.lazies.length;

    // Define last lazy image:
    this.lastLazy = Array.from(this.lazies).find((lazy, i, self) => i == self.length-1);

    // Define startYear:
    this.startYear = this.lastLazy.parentNode.parentNode.id.slice(5);

    var scrollTop, screenHeight;

    // Calc the offsetTop of the last image:
    window.addEventListener('load', (e) => {
      this.lastLazyTop = this.lastLazy.offsetTop;
    });

    // Determine if scroll position >= position last img:
    document.addEventListener('scroll', async (e) => {
      if (this.scrolling) {
        scrollTop = window.scrollY;
        screenHeight = window.innerHeight;

        if (scrollTop + screenHeight >= this.lastLazyTop) {
          this.scrolling = false;
          var selection = await this.fetchPhotoSelection(this.startYear, this.startIdx);
          this.addPhotos(selection);
        }
      }
    });
  }
};

module.exports = lazyLoad;
