var imageDetail = require('./image-detail.js');
var share = require('./share.js');
var errors = require('./errors.js');

const lazyLoad = {
  scrolling: false,
  photos: function () { return Array.from(document.querySelectorAll('.photo')); },
  fetchPhotoSelection: async function (startYear, startIdx) {
    var pathname = window.location.pathname.split('/');
    var id = pathname[pathname.length-1];

    // Fetch new photos:
    return await fetch ('/photo-selection/' + id + '/' + startYear + '/' + startIdx)
      .then(res => res.json())
      .catch(err => errors.fire('noSelectionFound'));
  },
  addPhotos: function (selection) {
    var img = document.createElement('img');
    var h2 = document.createElement('h2');
    var ul = document.createElement('ul');
    var li = document.createElement('li');
    var a = document.createElement('a');
    var p = document.createElement('p');
    var button = document.createElement('button');

    for (var year in selection) {
      if (selection.hasOwnProperty(year)) {
        var yearElem = document.getElementById('year-' + year);
        var fragment = document.createDocumentFragment();

        if (yearElem.children.length === 0) {
          var crosses = img.cloneNode(true);
          crosses.classList.add('crosses');
          crosses.src = '/images/crosses-amsterdam.svg';
          crosses.alt = '';
          fragment.appendChild(crosses);
        }

        selection[year].forEach(street => {
          var cloneH2 = h2.cloneNode(true);
          cloneH2.textContent = street.label;
          fragment.appendChild(cloneH2);

          var classname = street.uri.split('/')[street.uri.split('/').length-2];
          var cloneUl = ul.cloneNode(true);
          cloneUl.classList.add('street');
          cloneUl.classList.add(classname);
          fragment.appendChild(cloneUl);

          street.photos.forEach(photo => {
            var cloneLi = li.cloneNode(true);
            cloneLi.classList.add('photo');
            cloneLi.classList.add('lazy');
            cloneLi.style.height = Math.round((this.photos()[0].offsetWidth / photo.width) * photo.height) + 'px';
            this.lazyObserver.observe(cloneLi);
            cloneUl.appendChild(cloneLi);

            var cloneA = a.cloneNode(true);
            cloneA.classList.add('photo__img');
            cloneLi.appendChild(cloneA);

            var cloneImg = img.cloneNode(true);
            cloneImg.src = '';
            cloneImg.alt = photo.title;
            cloneImg.setAttribute('data-src', photo.url);
            cloneA.appendChild(cloneImg);

            cloneA.addEventListener('click', (e) => {
              imageDetail.openModal(cloneImg.src, cloneImg.alt);
              e.preventDefault();
            });

            var cloneP = p.cloneNode(true);
            cloneP.classList.add('photo__desc');
            cloneP.textContent = photo.title;
            cloneLi.appendChild(cloneP);

            var cloneButton = button.cloneNode(true);
            cloneButton.classList.add('share-btn');
            cloneButton.type = 'button';
            cloneLi.appendChild(cloneButton);

            var cloneButtonImage = img.cloneNode(true);
            cloneButtonImage.src = '/images/icons/share.svg';
            cloneButton.appendChild(cloneButtonImage);

            cloneButton.addEventListener('click', (e) => {
              share.postPhoto(cloneButton);
            });
          });
        });

        yearElem.appendChild(fragment);
      }
    }

    this.startIdx = this.photos().length;
    var lastPhoto = this.photos()[this.startIdx-1];
    this.startYear = lastPhoto.parentNode.parentNode.id.slice(5);
    this.lastPhotoTop = lastPhoto.offsetTop;
    this.scrolling = true;
  },
  init: function () {
    this.startIdx = this.photos().length;
    var lastPhoto = this.photos()[this.startIdx-1];
    var lastImg = lastPhoto.querySelector('img');
    var scrollTop, screenHeight;
    this.startYear = lastPhoto.parentNode.parentNode.id.slice(5);

    lastImg.addEventListener('load', (e) => {
      this.scrolling = true;
      this.lastPhotoTop = lastPhoto.offsetTop;
      screenHeight = window.innerHeight;
    });

    document.addEventListener('scroll', async (e) => {
      if (this.scrolling) {
        scrollTop = window.scrollY;

        if (scrollTop >= this.lastPhotoTop - (2 * screenHeight)) {
          this.scrolling = false;
          var selection = await this.fetchPhotoSelection(this.startYear, this.startIdx);
          this.addPhotos(selection);
        }
      }
    });

    document.addEventListener('DOMContentLoaded', (e) => {
      if ('IntersectionObserver' in window) {
        this.lazyObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              var lazy = entry.target;
              var img = lazy.querySelector('img');

              img.src = img.dataset.src;

              img.addEventListener('load', (e) => {
                lazy.classList.remove('lazy');
                lazy.style.height = 'auto';
                this.lazyObserver.unobserve(lazy);
              });
            }
          });
        });
      } else {
        // Fallback
      }
    });
  }
};

module.exports = lazyLoad;
