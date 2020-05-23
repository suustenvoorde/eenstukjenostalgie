const hamburgerMenu = {
  init: function(){
    var sections = document.querySelectorAll('section.year');
    var main = document.querySelector('body');
    var yearTitle = document.querySelectorAll('.year-title');
    window.addEventListener('scroll', function(){
      for (var i = 0; i < sections.length; i++) {
        if(sections[i].offsetTop <= window.scrollY && (sections[i].offsetTop + sections[i].offsetHeight) > window.scrollY+5) {
          yearTitle[i].classList.add('active-year');
        } else {
          yearTitle[i].classList.remove('active-year');
        }
      }
    });
  }
}

module.exports = hamburgerMenu;
