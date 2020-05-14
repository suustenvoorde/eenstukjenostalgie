var map = require('./map.js');

(function () {
  const search = {
    currentFocus: 0,
    init: function (searchbar, data) {
      // Add the given searchbar to this object:
      this.searchbar = searchbar;

      // Event listener for input value:
      this.searchbar.addEventListener('input', (e) => {
        this.closeList();
        if (!e.target.value) return false;
        this.currentFocus = -1;
        var results = this.getAutocomplete(data, e.target.value);
        this.setAutocomplete(results, e.target.value.length);
      });

      // Event listener for keyboard functions:
      this.searchbar.addEventListener('keydown', (e) => {
        var list = document.querySelector('.autocomplete-items');

        if (list) list = list.querySelectorAll('li');

        switch (e.keyCode) {
          // Key down:
          case 40:
            this.currentFocus++;
            this.addActive(list);
            break;
          // Key up:
          case 38:
            this.currentFocus--;
            this.addActive(list);
            break;
        }
      });

      // Event for submitting the form:
      this.searchbar.addEventListener('submit', (e) => {
        var value = new FormData(e.target).get('searchLocation');

        // Return if value is empty:
        if (!value) return;

        // Get the search results for current value:
        var results = this.getAutocomplete(data, value);

        // Add first search result to the map:
        map.selectedStreet(results[0]);

        // Show first search result as searchbar value:
        this.searchbar.querySelector('input').value = results[0];
        e.preventDefault();
      });

      // Event listener when clicking the document:
      document.addEventListener('click', (e) => {
        this.closeList(e.target);
      });
    },
    getAutocomplete: function (data, val) {
      // Check what data matches the search query:
      return data.filter(str => str.substr(0, val.length).toUpperCase() == val.toUpperCase());
    },
    setAutocomplete: function (results, length) {
      var autocomplete = document.querySelector('.autocomplete');
      var ul = document.createElement('ul');
      var li = document.createElement('li');
      var a = document.createElement('a');
      var strong = document.createElement('strong');
      var fragment = document.createDocumentFragment();

      ul.classList.add('autocomplete-items');
      fragment.appendChild(ul);

      results.forEach((result, i) => {
        if (i < 3) {
          var cloneLi = li.cloneNode(true);
          var cloneA = a.cloneNode(true);
          var cloneStrong = strong.cloneNode(true);

          ul.appendChild(cloneLi);

          cloneA.href = '#';
          cloneLi.appendChild(cloneA);

          cloneStrong.textContent = result.slice(0, length);
          cloneA.appendChild(cloneStrong);
          cloneA.appendChild(document.createTextNode(result.slice(length)));

          cloneA.addEventListener('click', (e) => {
            this.searchbar.querySelector('input').value = e.target.textContent;
            this.closeList();
            map.selectedStreet(e.target.textContent);
            e.preventDefault();
          });
        }
      });
      autocomplete.appendChild(fragment);
    },
    addActive: function (list) {
      if (!list) return false;
      this.removeActive(list);

      if (this.currentFocus >= list.length) this.currentFocus = 0;
      if (this.currentFocus < 0) this.currentFocus = (list.length - 1);

      this.searchbar.querySelector('input').value = list[this.currentFocus].children[0].textContent;
      list[this.currentFocus].children[0].classList.add('autocomplete-active');
    },
    removeActive: function (list) {
      for (var i = 0; i < list.length; i++) {
        list[i].children[0].classList.remove('autocomplete-active');
      }
    },
    closeList: function (elem) {
      var lists = document.querySelectorAll('.autocomplete-items');

      for (var i = 0; i < lists.length; i++) {
        if (elem != lists[i] && elem != this.searchbar) {
          lists[i].parentNode.removeChild(lists[i]);
        }
      }
    }
  };

  module.exports = search;
}) ();
