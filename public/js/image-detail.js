'use strict';

(function () {

  var imageDetail = {
    trigger: document.querySelectorAll('.openDetail'),
    detail: document.querySelector('.detail'),
    init: function () {
      this.detailImg = this.detail.getElementsByTagName('img')[0];
      this.detailText = this.detail.getElementsByTagName('p')[0];
      this.detailCloseBtn = this.detail.querySelector('.popupCloseButton');

      this.trigger.forEach(elem => {
        elem.addEventListener('click', (e) => {
          this.openDetail(elem.dataset.image, elem.dataset.text);
          e.preventDefault();
        });
      });

      this.detailCloseBtn.addEventListener('click', (e) => {
        this.closeDetail();
        e.preventDefault();
      });

      this.detail.addEventListener('click', (e) => {
        this.closeDetail();
        e.preventDefault();
      });
    },
    openDetail: function (img, text = '') {
      // Add image to popup:
      this.detailImg.src = img;
      this.detailImg.alt = text;
      this.detailText.textContent = text;

      // Show the popup:
      this.detail.classList.add('show');
    },
    closeDetail: function () {
      this.detail.classList.remove('show');
    }
  };

  imageDetail.init();
})();
