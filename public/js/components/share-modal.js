const shareModal = {
  modal: document.querySelector('.share-modal__overlay'),
  openModal: function (photoId) {
    var url = new URL(window.location.href);
    var link = 'www.' + url.host + '/photo/' + photoId;

    this.copyToClipboard.value = link;
    this.modal.classList.add('show');
  },
  closeModal: function () {
    this.modal.classList.remove('show');
  },
  copy: function (input) {
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices
    input.parentNode.classList.add('copied');
    document.execCommand('copy');
    setTimeout(() => { input.parentNode.classList.remove('copied'); }, 800);
  },
  init: function () {
    this.copyToClipboard = this.modal.querySelector('.copy-to-clipboard > input');
    this.copyBtn =  this.modal.querySelector('.copy-btn');
    this.closeBtn = this.modal.querySelector('.close-btn');

    // Copy url on clicking copyBtn:
    this.copyBtn.addEventListener('click', (e) => {
      this.copy(this.copyToClipboard);
      e.preventDefault();
    });

    // Close modal on clicking closeBtn:
    this.closeBtn.addEventListener('click', (e) => {
      this.closeModal();
      e.preventDefault();
    });
  }
};

module.exports = shareModal;
