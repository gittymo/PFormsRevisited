// _Pform_ActiveSelectOptionBox is used to identify and close any open select option boxes when the user clicks outside the
// component area or resizes the display area (e.g. by resizing the browser window).
var _Pform_ActiveSelectOptionsBox = null;
var _Pform_ActiveSelectOptionsBoxSearchText = null;
var _Pform_ActiveSelectOptionsBoxSearchTicks = 0;

function _Pform_CreateSelectField(pformFieldElement, maxOptionLines = 5) {
	var selectElement = null;
	if (_PForm_IsValidFieldElement(pformFieldElement)) {
		// The component the user will initially interact with for the dropdown (select) input field is a div.
		selectElement = document.createElement("div");
		selectElement.pformFieldElement = pformFieldElement;
		selectElement.className = "pformselectelement";

		if (pformFieldElement.getAttribute("pfvalues")) {
			_Pform_CreateSelectOptionsBox(pformFieldElement, maxOptionLines);
			pformFieldElement.appendChild(pformFieldElement.pfselectOptionsBox);
			selectElement.pfoptionsBox = pformFieldElement.pfselectOptionsBox;
			selectElement.innerText = pformFieldElement.pfselectOptionsBox.childNodes[pformFieldElement.pfselectOptionsBox.selectedOption.GetValueIndex()].innerText;
		}

		selectElement.onclick = (event) => {
			var selectElement = event.target;
			var optionsBox = _Pform_ActiveSelectOptionsBox = selectElement.pfoptionsBox;
			var options = optionsBox.childNodes;
			if (options) {
				_Pform_UpdateActiveSelectOptionsBox();
			}
			optionsBox.style = "display: block; left: 17px; " + "top: " + (pformFieldElement.clientHeight - selectElement.clientHeight - 3) + "px; " +
				"width: " + (selectElement.clientWidth) + "px;";
			event.stopPropagation();
		}

		return selectElement;
	}
}

function _Pform_CreateSelectOptionsBox(pformFieldElement, maxOptionLines) {
	var selectOptionsBox = document.createElement("div");
	selectOptionsBox.className = "pformselectoptionsbox";
	selectOptionsBox.style = "display: none";
	selectOptionsBox.pformFieldElement = pformFieldElement;
	selectOptionsBox.maxOptionLines = !isNaN(maxOptionLines) && maxOptionLines > 0 ? maxOptionLines : 5;
	pformFieldElement.pfselectOptionsBox = selectOptionsBox;
	_Pform_CreateSelectFieldOptions(pformFieldElement);
	selectOptionsBox.selectedOption = selectOptionsBox.intendedSelectionOption = selectOptionsBox.previouslySelectedOption = selectOptionsBox.children.item(
		pformFieldElement.getAttribute("pfselectedIndex") &&
			pformFieldElement.getAttribute("pfselectedIndex") >= 0 &&
			pformFieldElement.getAttribute("pfselectedIndex") < selectOptionsBox.children.length ? pformFieldElement.getAttribute("pfselectedIndex") : 0
	);
}

function _Pform_UpdateActiveSelectOptionsBox() {
	if (_Pform_ActiveSelectOptionsBox) {
		var pformFieldElement = _Pform_ActiveSelectOptionsBox.pformFieldElement;
		if (pformFieldElement) {
			var options = _Pform_ActiveSelectOptionsBox.childNodes;
			const selectedEndOffset = _Pform_ActiveSelectOptionsBox.maxOptionLines - (options.length - _Pform_ActiveSelectOptionsBox.intendedSelectionOption.GetValueIndex());
			const startIndex = _Pform_ActiveSelectOptionsBox.intendedSelectionOption.GetValueIndex() - (selectedEndOffset > 0 ? selectedEndOffset : 0);
			const endIndex = startIndex + pformFieldElement.pfmaxOptionLines > options.length ? options.length : startIndex + _Pform_ActiveSelectOptionsBox.maxOptionLines;
			for (var i = 0; i < options.length; i++) {
				if (i >= startIndex && i < endIndex) {
					options[i].style = "display: block";
				} else {
					options[i].style = "display: none";
				}
			}
		}
	}
}

function _Pform_SelectFieldSelectOption(option) {
	if (option != option.optionsBox.previouslySelectedOption) {
		option.pformFieldElement.pfvalueElement.innerText = option.GetValue();
		option.optionsBox.selectedOption = option.optionsBox.previouslySelectedOption = option.optionsBox.intendedSelectionOption = option;
	}
	option.pformFieldElement.pfselectOptionsBox.style = "display: none";
	option.optionsBox.previouslySelectedOption = option;
}

function _Pform_CreateSelectFieldOptions(pformFieldElement) {
	if (_PForm_IsValidFieldElement(pformFieldElement) && pformFieldElement.pftype === "DROPDOWN" && pformFieldElement.pfselectOptionsBox) {
		const valuesArray = pformFieldElement.getAttribute("pfvalues").split(",");
		const optionsBox = pformFieldElement.pfselectOptionsBox;
		if (valuesArray && valuesArray.length > 0) {
			for (var i = 0; i < valuesArray.length; i++) {
				var option = document.createElement("div");
				option.className = "pformselectoption";
				option.optionsBox = optionsBox;
				option.pformFieldElement = pformFieldElement;
				option.innerText = valuesArray[i];
				option.style = "display: none";
				option.onclick = (event) => _Pform_SelectFieldSelectOption(event.target);

				option.onmouseenter = (event) => {
					const optionElement = event.target;
					if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption && _Pform_ActiveSelectOptionsBox.intendedSelectionOption != optionElement) {
						_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.remove("pfselectedOption");
					}
					optionElement.classList.add("pfintendedSelectionOption");
					_Pform_ActiveSelectOptionsBox.intendedSelectionOption = optionElement;
					_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.add("pfselectedOption");
				}

				option.GetValue = function () {
					return this.innerText;
				}

				option.GetValueIndex = function () {
					return Array.prototype.indexOf.call(this.parentNode.children, this);
				}

				optionsBox.appendChild(option);
			}
		}
	}
}

// Global click event capture. 
// Note: Will likely need to use a similar one for keypress and mousewheel events when it comes to select and type ahead input fields
document.querySelector("html").addEventListener('click', (event) => {
	if (_Pform_ActiveSelectOptionsBox && _Pform_ActiveSelectOptionsBox.style.display === "block" && event.target != _Pform_ActiveSelectOptionsBox) {
		_Pform_ActiveSelectOptionsBox.style = "display: none";
	}
}, true);

document.querySelector("html").addEventListener('keydown', (event) => {
	if (_Pform_ActiveSelectOptionsBox && _Pform_ActiveSelectOptionsBox.style.display === "block") {
		if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption) {
			_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.remove("pfselectedOption");
		}
		switch (event.key) {
			case "ArrowUp": {
				if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption.previousSibling) {
					_Pform_ActiveSelectOptionsBox.intendedSelectionOption = _Pform_ActiveSelectOptionsBox.intendedSelectionOption.previousSibling;
				}
			} break;
			case "ArrowDown": {
				if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption.nextSibling) {
					_Pform_ActiveSelectOptionsBox.intendedSelectionOption = _Pform_ActiveSelectOptionsBox.intendedSelectionOption.nextSibling;
				}
			} break;
			case "Enter": {
				_Pform_SelectFieldSelectOption(_Pform_ActiveSelectOptionsBox.intendedSelectionOption);
			} break;
			default: {
				// Try to match the first option value to the text the user is typing.
				var typedChar = String.fromCharCode(event.keyCode);
				if (_Pform_ActiveSelectOptionsBoxSearchText == null) _Pform_ActiveSelectOptionsBoxSearchText = typedChar;
				else _Pform_ActiveSelectOptionsBoxSearchText += typedChar;
				for (var i = 0; i < _Pform_ActiveSelectOptionsBox.children.length; i++) {
					if (_Pform_ActiveSelectOptionsBox.children.item(i).innerText.toUpperCase().indexOf(_Pform_ActiveSelectOptionsBoxSearchText.toUpperCase().trim()) >= 0) {
						if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption) {
							_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.remove("pfselectedOption");
						}
						_Pform_ActiveSelectOptionsBox.intendedSelectionOption = _Pform_ActiveSelectOptionsBox.children.item(i);
						_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.add("pfselectedOption");
						break;
					}
				}
				_Pform_ActiveSelectOptionsBoxSearchTicks = 20;
			}
		}
		_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.add("pfintendedSelectionOption");
		_Pform_UpdateActiveSelectOptionsBox();
	}
}, true);

document.querySelector("html").addEventListener('wheel', (event) => {
	if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption) {
		_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.remove("pfselectedOption");
	}

	if (event.deltaY < 0) {
		if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption.previousSibling) {
			_Pform_ActiveSelectOptionsBox.intendedSelectionOption = _Pform_ActiveSelectOptionsBox.intendedSelectionOption.previousSibling;
		}
	}

	if (event.deltaY > 0) {
		if (_Pform_ActiveSelectOptionsBox.intendedSelectionOption.nextSibling) {
			_Pform_ActiveSelectOptionsBox.intendedSelectionOption = _Pform_ActiveSelectOptionsBox.intendedSelectionOption.nextSibling;
		}
	}

	_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.add("pfselectedOption");
	_Pform_UpdateActiveSelectOptionsBox();
}, true);

// Global window resize event capture.
window.onresize = (event) => {
	if (_Pform_ActiveSelectOptionsBox && _Pform_ActiveSelectOptionsBox.style.display === "block") {
		_Pform_ActiveSelectOptionsBox.style = "display: none";
	}
}

window.setInterval(function() {
	if (_Pform_ActiveSelectOptionsBoxSearchTicks > 0) _Pform_ActiveSelectOptionsBoxSearchTicks--;
	if (_Pform_ActiveSelectOptionsBoxSearchTicks == 0 && _Pform_ActiveSelectOptionsBoxSearchText != null) _Pform_ActiveSelectOptionsBoxSearchText = null;
}, 50);