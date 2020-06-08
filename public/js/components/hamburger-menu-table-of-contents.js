var lazyLoad = require('./lazy-load.js');
var loader = require('./loader.js');

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
          e.preventDefault();
          menu.classList.remove('open-menu');
          menu.classList.add('close-menu');
          close.style.display = "none";
          open.style.display = "block";

          var link = el.children[0].href;
          var startYear = link.slice(link.indexOf('#') + 6);

          loader.show();

          var selection = await lazyLoad.fetchPhotoSelection(startYear, lazyLoad.startIdx);
          lazyLoad.addPhotos(selection);

          var yearElem = document.getElementById('year-' + startYear);
          window.scrollTo(0, yearElem.offsetTop);
          loader.hide();
        })
      })
    }
  }
}

module.exports = hamburgerMenu;
