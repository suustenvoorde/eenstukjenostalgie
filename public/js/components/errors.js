const status = {
  incorrectTimestamp: {
    msg: "Het ingevoerde beginjaar is groter dan het eindjaar. Voer een eindjaar in dat na het beginjaar komt."
  },
  noSelectionFound: {
    msg: "Er kunnen momenteel geen nieuwe foto's opgehaald worden. Probeer het later nog eens."
  },
  noPhotoToDB: {
    msg: "Helaas kan de foto momenteel niet gedeeld worden. Probeer het later nog eens."
  }
};

const errors = {
  fire: function (name) {
    var err = status[name];
    this.addErrorMsg(err);
  },
  addErrorMsg: function (err) {
    var fragment = document.createDocumentFragment();
    var div = document.createElement('div');
    var p = document.createElement('p');
    var button = document.createElement('button');
    var img = document.createElement('img');

    div.classList.add('error-msg');
    fragment.appendChild(div);

    p.textContent = err.msg;
    div.appendChild(p);

    button.classList.add('close-btn');
    button.type = 'button';
    div.appendChild(button);

    img.src = '../../images/icons/close.svg';
    img.alt = '';
    button.appendChild(img);

    button.addEventListener('click', (e) => {
      this.closeErrorMsg();
      e.preventDefault();
    });

    document.body.appendChild(fragment);
  },
  closeErrorMsg: function () {
    var errorMsgs = document.querySelectorAll('.error-msg');
    var errorMsg = errorMsgs[errorMsgs.length-1];
    errorMsg.parentNode.removeChild(errorMsg);
  }
};

module.exports = errors;
