'use strict';

(function () {

  var imageDetail = {
    trigger: document.querySelectorAll('.openDetail'),
    detail: document.querySelector('.detail'),
    detailImg: document.querySelector('.detail img'),
    detailText: document.querySelector('.detail p'),
    detailCloseBtn: document.querySelector('.detail .popupCloseButton'),
    init: function () {
      var self = this;

      this.trigger.forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          self.openDetail(this.dataset.image, this.dataset.text);
        });
      });

      this.detailCloseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.closeDetail();
      });

      this.detail.addEventListener('click', function (e) {
        e.preventDefault();
        self.closeDetail();
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
