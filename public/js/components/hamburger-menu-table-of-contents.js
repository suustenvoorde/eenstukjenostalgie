var lazyLoad = require('./lazy-load.js');

//hamburger menu mobile table of contents
const hamburgerMenu = {
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
      items.forEach(function(el){
        el.children[0].addEventListener('click', async function(e){
          menu.classList.remove('open-menu');
          menu.classList.add('close-menu');
          close.style.display = "none";
          open.style.display = "block";

          var link = el.children[0].href;
          var startYear = link.slice(link.indexOf('#') + 6);
          var selection = await lazyLoad.fetchPhotoSelection(startYear, lazyLoad.startIdx);

          lazyLoad.addPhotos(selection);

          if (selection[startYear]) {
            var lastStreet = selection[startYear].find((street, i, self) => i == self.length-1);
            var lastPhoto = lastStreet.photos.find((photo, i, self) => i == self.length-1);
            var lastLazy = Array.from(document.querySelectorAll('.lazy')).find(lazy => lazy.querySelector('img').src == lastPhoto.url);

            lastLazy.querySelector('img').addEventListener('load', (e) => {
              var startYearTop = document.getElementById('year-' + startYear).offsetTop;
              window.scrollTo(0, startYearTop);
            });
          }
        })
      })
    }
  }
}

module.exports = hamburgerMenu;
