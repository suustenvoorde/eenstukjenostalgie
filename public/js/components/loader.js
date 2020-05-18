const loader = {
  elem: document.querySelector('.loader'),
  show: function () {
    this.elem.classList.add('show');
  }
};

module.exports = loader;
