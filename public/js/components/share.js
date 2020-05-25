const share = {
  elems: document.querySelectorAll('.photo-share'),
  init: function () {
    this.elems.forEach(elem => {
      elem.addEventListener('submit', (e) => {
        var img = elem.parentNode.querySelector('img');
        var photo = {
          src: img.src,
          alt: img.alt
        };

        var http = new XMLHttpRequest();
        http.open('post', '/photo', true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function () {
          if (http.readyState == 4 && http.status == 200) {
            console.log(http.responseURL);
            window.location = http.responseURL;
          }
        }
        http.send(JSON.stringify(photo));
        e.preventDefault();
      });
    });
  }
};

module.exports = share;
