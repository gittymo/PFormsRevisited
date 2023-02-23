// _Pform_ActiveSelectOptionBox is used to identify and close any open select option boxes when the user clicks outside the
// component area or chosen to resize the display area (e.g. by resizing the browser window or changing device orientation).
var _Pform_ActiveSelectOptionsBox = null;

// _Pform_ActiveSelectOptionsBoxSearchText holds the string the user types when the select options box is open.  This string
// is used to select the first matching option in options box (matching is done by searching for the user string anywhere in
// the option values).  The user typed value is temporary and will be reset if the user stops typing for one second.
var _Pform_ActiveSelectOptionsBoxSearchText = null;

// _Pform_ActiveSelectOptionsBoxSearchTicksLimit defines how many ticks are allowed before the value held in
// _Pform_ActiveSelectOptionsBoxSearchText is reset.
const _Pform_ActiveSelectOptionsBoxSearchTicksLimit = 20;

// _Pform_ActiveSelectOptionsBoxSearchTicks holds the current number of ticks left before the value in
// _Pform_ActiveSelectOptionsBoxSearchText is reset.  This value will decrease by one every 50th of a second.  Once the value
// reaches zero (0) the value of _Pform_ActiveSelectOptionsBoxSearchText.  If the user types a character, the value of
// _Pform_ActiveSelectOptionsBoxSearchTicks is reset to the value held in _Pform_ActiveSelectOptionsBoxSearchTicksLimit.
var _Pform_ActiveSelectOptionsBoxSearchTicks = 0;

// _Pform_CreateSelectField is used to create a drop down select field from a given HTML div element.  As with all 
// pform field components, the element will be checked to make sure it is a div and makes use of the pformfield css class.
// The parameter value pformFieldElement provides a reference to the HTML div element.
// The parameter maxOptionLines indicates how many options should be visible in the down down select field's options box.
// The method returns a pointer to the select field element, which is the pform field's value element and the element the 
// user will interact.
function _Pform_CreateSelectField(pformFieldElement, maxOptionLines = 5) {
	// Set the return select element value to null in case anything goes wrong.
	var selectElement = null;
	// Make the the parent element is a valid pform field element.
	if (_PForm_IsValidFieldElement(pformFieldElement)) {
		// The component the user will initially interact with for the dropdown (select) input field is a div.
		selectElement = document.createElement("div");
		// Set the select element's pform field property so that the element can reference its parent.
		selectElement.pformFieldElement = pformFieldElement;
		// Set the class for the select element so that it renders according to the user.css and base.css stylesheets.
		selectElement.className = "pformselectelement";

		// Check to see if the parent pform field has a pfvalues attribute.
		if (pformFieldElement.getAttribute("pfvalues")) {
			// It does, so we can create an options box.
			_Pform_CreateSelectOptionsBox(pformFieldElement, maxOptionLines);
			// Make the options box a child of the main body of the page (so it can be rendered correctly above everything else).
			document.body.appendChild(pformFieldElement.pfselectOptionsBox);
			// Add a property to the select element that allows it to reference its associated options box element.
			selectElement.optionsBox = pformFieldElement.pfselectOptionsBox;
			// Set the textual value of the select element to reflect the currently selected option.
			selectElement.innerText = pformFieldElement.pfselectOptionsBox.childNodes[pformFieldElement.pfselectOptionsBox.selectedOption.GetValueIndex()].innerText;
		}

		// Click event handler for select element.  If the user clicks on the select element and the element has options, 
		// this will display the options box.
		selectElement.onclick = (event) => {
			// Get the element that was clicked.
			var selectElement = event.target;
			// Grab the focus
			selectElement.focus();
			// Get the reference to the select element's options box and record it both in the local variable 'optionsBox'
			// and the global varible '_Pform_ActiveSelectOptionsBox'.
			var optionsBox = _Pform_ActiveSelectOptionsBox = selectElement.optionsBox;
			// Get the reference to the array of child elements (nodes) for the options box.
			var options = optionsBox.childNodes;
			// Check to make sure reference is valid and that the array contains something.
			if (options && options.length > 0) {
				// Show the options box.
				_Pform_ShowSelectOptionsBox(selectElement);
				// Prevent the click event from bubbling any further.
				event.stopPropagation();
			}
		}
		// Return the reference to the created select element (or null if something went wrong).
		return selectElement;
	}
}

function _Pform_ShowSelectOptionsBox(selectElement) {
	if (selectElement.optionsBox) {
		// Configure the options box so that it shows an appropriate selection of options.
		_Pform_UpdateActiveSelectOptionsBox();
		// Get the bounding rectangle (co-ordinates) of the select element and set the position and size of the options
		// box so that it appears over and stretches below the select element.
		const selectElementBoundingRect = selectElement.getBoundingClientRect();
		const optionsBoxStyleString = "display: block; left: " + selectElementBoundingRect.left + "px; " + 
																			"top: " + selectElementBoundingRect.top + "px; " +
																			"width: " + (selectElement.clientWidth) + "px;";
		selectElement.optionsBox.style = optionsBoxStyleString;
		selectElement.optionsBox.selectedOption.classList.add("pfselectedOption");
	}
}

// _Pform_CreateSelectOptionsBox creates the options box that is displayed whe the user clicks on the pform field's value.
// The parameter pformFieldElement is a reference to the pform field element that holds the select element.
// The parameter maxOptionLines gives the maxmimum number of lines to display in the options box (defaults to 5).
function _Pform_CreateSelectOptionsBox(pformFieldElement, maxOptionLines = 5) {
	// Create the options box element and apply the appropriate css class and style information.
	var selectOptionsBox = document.createElement("div");
	selectOptionsBox.className = "pformselectoptionsbox";
	selectOptionsBox.style = "display: none";
	// Record a reference to the parent pform field element so the options box element can reference it.
	selectOptionsBox.pformFieldElement = pformFieldElement;
	// Likewise create a reference for the options box within its parent pform field.
	pformFieldElement.pfselectOptionsBox = selectOptionsBox;
	// Sanitise the given 'maxOptionLines' parameter value and store it as a parameter for the options box element so that it
	// knows how many option lines to display.
	selectOptionsBox.maxOptionLines = !isNaN(maxOptionLines) && maxOptionLines > 0 ? maxOptionLines : 5;
	// Create the options box options from the values taken from the parent pform field's pfvalues attribute.
	_Pform_CreateSelectFieldOptions(pformFieldElement);
	// Make sure the options box is correctly configured, so that the correct option is selected (or the first one if the pform field 
	// has no selected option index).
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
				option.onclick = (event) => _Pform_SelectFieldSelectOption(option.optionsBox.intendedSelectionOption);

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
			case "Escape": {
				_Pform_ActiveSelectOptionsBox.style.display="none";
				_Pform_ActiveSelectOptionsBox = null;
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
				_Pform_ActiveSelectOptionsBoxSearchTicks = _Pform_ActiveSelectOptionsBoxSearchTicksLimit;
			}
		}
		if (_Pform_ActiveSelectOptionsBox != null) {
			_Pform_ActiveSelectOptionsBox.intendedSelectionOption.classList.add("pfselectedOption");
			_Pform_UpdateActiveSelectOptionsBox();
		}
	} else {
		// Check to see if the current element is an select (dropdown) field.
		if (event.target.optionsBox) {
			switch (event.key) {
				case "Enter"," " : {
					_Pform_ActiveSelectOptionsBox = event.target.optionsBox;
					_Pform_ShowSelectOptionsBox(event.target);
				} break;
			}
		}
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