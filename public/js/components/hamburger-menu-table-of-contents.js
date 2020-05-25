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
        el.addEventListener('click', function(){
          menu.classList.remove('open-menu');
          menu.classList.add('close-menu');
          close.style.display = "none";
          open.style.display = "block";
        })
      })
    }
  }
}

module.exports = hamburgerMenu;
