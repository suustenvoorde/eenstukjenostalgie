var lazyLoad = require('./lazy-load.js');
var loader = require('./loader.js');

//hamburger menu mobile table of contents
const hamburgerMenu = {
  fetchSelection: async function (startYear) {
    var selection = await lazyLoad.fetchPhotoSelection(startYear, lazyLoad.startIdx);
    lazyLoad.addPhotos(selection);

    var lastYear = Object.keys(selection).find((year, i, self) => i === self.length-1);
    var yearElem = lastYear >= startYear ? startYear : lastYear;
    var fetched = lastYear >= startYear ? true : false;

    window.scrollTo(0, document.getElementById('year-' + yearElem).offsetTop);
    return fetched;
  },
  init: function(){
    if('querySelector' in document && 'querySelectorAll' in document && 'addEventListener' in window) {
      var open = document.querySelector('.open');
      var close = document.querySelector('.close');
      var menu = document.querySelector('nav ol');
      var items = document.querySelectorAll('nav ol li');
      menu.classList.add('first');
      open.addEventListener('click', function(){
        menu.classList.add('open-menu');
        menu.classList.remove('close-menu');
        open.style.display = "none";
        close.style.display = "block";
      })
      close.addEventListener('click', function(){
        menu.classList.remove('open-menu');
        menu.classList.add('close-menu');
        close.style.display = "none";
        open.style.display = "block";
      })
      items.forEach(el => {
        el.children[0].addEventListener('click', async (e) => {
          e.preventDefault();
          menu.classList.remove('open-menu');
          menu.classList.add('close-menu');
          close.style.display = "none";
          open.style.display = "block";

          var link = el.children[0].href;
          var startYear = link.slice(link.indexOf('#') + 6);
          var yearElem = document.getElementById('year-' + startYear);

          if (yearElem.children.length === 0) {
            var fetched = false;

            loader.show();

            while (fetched == false) {
              fetched = await this.fetchSelection(startYear);
            }

            loader.hide();
          } else {
            window.scrollTo(0, yearElem.offsetTop);
          }
        })
      })
    }
  }
}

module.exports = hamburgerMenu;
