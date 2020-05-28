const status = {
  incorrectTimestamp: {
    msg: "Incorrect ingevulde jaartallen."
  },
  noSelectionFound: {
    msg: "Kan geen nieuwe foto's laden."
  },
  noPhotoToDB: {
    msg: "Kan de foto niet opslaan in de database."
  }
};

const errors = {
  fire: function (name) {
    var msg = status[name].msg;
    console.log(msg);
  }
};

module.exports = errors;
