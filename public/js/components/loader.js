const loader = {
  elem: document.querySelector('.loader'),
  show: function () {
    this.elem.classList.add('show');
  },
  hide: function () {
    this.elem.classList.remove('show');
  }
};

module.exports = loader;
