var imageDetail = require('./image-detail.js');
var shareModal = require('./share-modal.js');

const share = {
  elems: document.querySelectorAll('.share-btn'),
  init: async function () {
    this.elems.forEach(elem => {
      elem.addEventListener('click', (e) => {
        var img = elem.parentNode.querySelector('img');
        var photo = {
          src: img.src,
          alt: img.alt
        };

        fetch ('/photo', {
          method: 'post',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(photo)
        })
        .then(res => res.json())
        .then(photo => {
          if (imageDetail.modal.classList.contains('show')) imageDetail.modal.classList.remove('show');
          shareModal.openModal(photo.id);
        })
        .catch(err => console.log(err));
        e.preventDefault();
      });
    });
  }
};

module.exports = share;
