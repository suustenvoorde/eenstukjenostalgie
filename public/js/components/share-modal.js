const shareModal = {
  modal: document.querySelector('.share-modal__overlay'),
  getQueries: function (url) {
    var queries = url.slice(1).split('&');
    return queries.map(query => {
      var split = query.split('=');
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
  closeModal: function () {
    this.modal.classList.remove('show');
  },
  init: function () {
    // Get the queries from the url:
    var queries = this.getQueries(window.location.search);

    // If query 'shared' exists:
    var shared = queries.find(query => query.name == 'shared');
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
        this.closeModal();
        e.preventDefault();
      });

      // Close modal on clicking outside of modal:
      document.body.addEventListener('click', (e) => {
        if (e.target == this.modal) this.closeModal();
      });
    }
  }
};

module.exports = shareModal;
