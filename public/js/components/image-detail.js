const imageDetail = {
  photos: document.querySelectorAll('.year .photo__img'),
  modal: document.querySelector('.photo-detail-modal__overlay'),
  openModal: function (src, alt) {
    this.modalImg.src = src;
    this.modalImg.alt = alt;
    this.modalDesc.textContent = alt;
    this.modal.classList.add('show');
  },
  closeModal: function () {
    this.modal.classList.remove('show');
  },
  init: function () {
    this.modalImg = this.modal.querySelector('.photo-detail__img');
    this.modalDesc = this.modal.querySelector('.photo-detail__desc');
    this.closeBtn = this.modal.querySelector('.close-btn');

    this.photos.forEach(photo => {
      photo.addEventListener('click', (e) => {
        var img = photo.querySelector('img');
        this.openModal(img.src, img.alt);
        e.preventDefault();
      });
    });

    this.closeBtn.addEventListener('click', (e) => {
      this.closeModal();
      e.preventDefault();
    });

    document.body.addEventListener('click', (e) => {
      if (e.target == this.modal) this.closeModal();
    });
  }
};

module.exports = imageDetail;
