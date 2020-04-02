// (function() {
// "use strict";
//
// var supportsMultiple = self.HTMLInputElement && "valueLow" in HTMLInputElement.prototype;
//
// var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
//
// self.multirange = function(input) {
// 	if (supportsMultiple || input.classList.contains("multirange")) {
// 		return;
// 	}
//
// 	var value = input.getAttribute("value");
// 	var values = value === null ? [] : value.split(",");
// 	var min = +(input.min || 0);
// 	var max = +(input.max || 100);
// 	var ghost = input.cloneNode();
//
// 	input.classList.add("multirange", "original");
// 	ghost.classList.add("multirange", "ghost");
//
// 	input.value = values[0] || min + (max - min) / 2;
// 	ghost.value = values[1] || min + (max - min) / 2;
//
// 	input.addEventListener('change', function(e){
// 		var min = document.getElementById('rangevalueMin');
// 		min.textContent = input.value.substr(0, 4);
//
// 		//dynamic range slider output
// 		var min = document.querySelector('input[type="range"]').min;
// 		var max = document.querySelector('input[type="range"]').max;
// 		var timestamp = max - min;
//
// 		var first = input;
// 		var second = ghost;
//
// 		var timestamp1 = Number(first.value.substr(0, 4)) - Number(min);
// 		var timestamp2 = Number(max) - Number(second.value.substr(0, 4));
// 		var percentageBar = timestamp1 / timestamp * 100;
//
// 		var textMin = document.querySelector('#rangevalueMin');
// 		textMin.style.top = 'calc(' + percentageBar  + '% + 25px)';
//
// 		console.log(percentageBar, textMin.style.top);
//
// 	});
//
// 	ghost.addEventListener('mousemove', function(){
// 		var max = document.getElementById('rangevalueMax');
// 		max.textContent = ghost.value;
//
// 		//dynamic range slider output
// 		var min = document.querySelector('input[type="range"]').min;
// 		var max = document.querySelector('input[type="range"]').max;
// 		var maxValue = Number(document.querySelector('#rangevalueMax').value);
// 		var timestamp1 = 1971 - min;
// 		var timestamp2 = max - 1976;
// 		var timestamp = timestamp1 + timestamp2;
// 		var maxHeight = ((max - maxValue) / timestamp) * 100;
// 		// var newPoint = (maxValue - min) / (max - min);
//
// 		document.querySelector('#rangevalueMax').style.bottom = 'calc(' + maxHeight  + 'vh - 5px)';
// 	});
//
// 	input.parentNode.insertBefore(ghost, input.nextSibling);
//
// 	Object.defineProperty(input, "originalValue", descriptor.get ? descriptor : {
// 		// Fuck you Safari >:(
// 		get: function() { return this.value; },
// 		set: function(v) { this.value = v; }
// 	});
//
// 	Object.defineProperties(input, {
// 		valueLow: {
// 			get: function() { return Math.min(this.originalValue, ghost.value); },
// 			set: function(v) { this.originalValue = v; },
// 			enumerable: true
// 		},
// 		valueHigh: {
// 			get: function() { return Math.max(this.originalValue, ghost.value); },
// 			set: function(v) { ghost.value = v; },
// 			enumerable: true
// 		}
// 	});
//
// 	if (descriptor.get) {
// 		// Again, fuck you Safari
// 		Object.defineProperty(input, "value", {
// 			get: function() { return this.valueLow + "," + this.valueHigh; },
// 			set: function(v) {
// 				var values = v.split(",");
// 				this.valueLow = values[0];
// 				this.valueHigh = values[1];
// 				update();
// 			},
// 			enumerable: true
// 		});
// 	}
//
// 	if (typeof input.oninput === "function") {
// 		ghost.oninput = input.oninput.bind(input);
// 	}
//
// 	function update() {
// 		ghost.style.setProperty("--low", 100 * ((input.valueLow - min) / (max - min)) + 1 + "%");
// 		ghost.style.setProperty("--high", 100 * ((input.valueHigh - min) / (max - min)) - 1 + "%");
// 	}
//
// 	input.addEventListener("input", update);
// 	ghost.addEventListener("input", update);
//
// 	update();
// }
//
// multirange.init = function() {
// 	[].slice.call(document.querySelectorAll("input[type=range][multiple]:not(.multirange)")).forEach(multirange);
// }
//
// if (document.readyState == "loading") {
// 	document.addEventListener("DOMContentLoaded", multirange.init);
// }
// else {
// 	multirange.init();
// }
//
// })();
