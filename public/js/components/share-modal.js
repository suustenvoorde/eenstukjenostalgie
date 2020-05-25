const shareModal = {
  modal: document.querySelector('.share-modal__overlay'),
  getParams: function (url) {
    var params = url.search.slice(1).split('&');
    return params.map(param => {
      var split = param.split('=');
      return {
        name: split[0],
        value: split[1]
      };
    });
  },
  openModal: function (modal, photoId) {
    this.modal.classList.add('show');
  },
  copy: function (input) {
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices
    input.parentNode.classList.add('copied');
    document.execCommand('copy');
    setTimeout(() => { input.parentNode.classList.remove('copied'); }, 800);
  },
  closeModal: function (url) {
    var newUrl = url.origin + url.pathname;
    history.replaceState({}, document.title, newUrl);
    this.modal.classList.remove('show');
  },
  init: function () {
    // Get the queries from the url:
    var url = new URL(window.location.href);
    var params = this.getParams(url);

    // If query 'shared' exists:
    var shared = params.find(param => param.name == 'shared');
    if (shared) {
      this.copyToClipboard = this.modal.querySelector('.copy-to-clipboard > input');
      this.copyBtn = this.modal.querySelector('.copy-btn');
      this.closeBtn = this.modal.querySelector('.close-btn');

      this.openModal(this.modal);

      // Copy url on clicking copyBtn:
      this.copyBtn.addEventListener('click', (e) => {
        this.copy(this.copyToClipboard);
        e.preventDefault();
      });

      // Close modal on clicking closeBtn:
      this.closeBtn.addEventListener('click', (e) => {
        this.closeModal(url);
        e.preventDefault();
      });
    }
  }
};

module.exports = shareModal;
