// Just as a test environment for the photo-share:
const share = {
  elem: document.querySelector('.photo-share'),
  init: function () {
    this.elem.addEventListener('submit', (e) => {
      e.preventDefault();

      var formdata = new FormData(e.target);
      var img = this.elem.nextElementSibling;
      var photo = {
        src: img.src,
        alt: img.alt
      };

      var http = new XMLHttpRequest();
      http.open('post', '/share/photo', true);
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
          console.log(http.responseURL);
          window.location = http.responseURL;
        }
      }
      http.send(JSON.stringify(photo));
    });
  }
};

share.init();

module.exports = share;
