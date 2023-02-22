/*  pformfield.js */

function _PForm_CreateFieldUsing(htmlElement) {
  if (_PForm_IsValidFieldElement(htmlElement) && !htmlElement._pfinit) {
    // Because we're building the PFormsField element ontop of an existing HTML element, that element can't have anything 
    // inside it, so make sure to remove any existing child nodes and text from it.
		while (htmlElement.firstChild) htmlElement.removeChild(htmlElement.lastChild);
		htmlElement.innerText = null;

    // pftype provides a textual value used to identify and control how the field displays its data and controls its input.
    htmlElement.pftype = _PForm_GetAttribute("pftype", htmlElement).toUpperCase().trim();

		if (htmlElement.pftype) {
      // If the parent container element is a suitable line items container, mark this element as a line item.
			htmlElement.pflineItem = htmlElement.parentElement && htmlElement.parentElement.classList.contains("pfcontainer") && 
        htmlElement.parentElement.getAttribute("pftype") && 
        htmlElement.parentElement.getAttribute("pftype").toUpperCase().trim() === "LINEITEMS" ? true : false;

			// Check to see if we have a header.  If so, add a child header (H1) element to this element.
      const headerText = _PForm_GetAttribute("pfheader", htmlElement);
			if (headerText) {
				htmlElement.pfheaderElement = document.createElement("h1");
				htmlElement.pfheaderElement.innerText = headerText;
				htmlElement.appendChild(htmlElement.pfheaderElement);
        htmlElement.removeAttribute("pfheader");
			}

			// Check to see if we have a hint attribute.  If so, add it to this element.
      htmlElement.pfHintText = _PForm_GetAttribute("pfhint", htmlElement);
			if (htmlElement.pfHintText) {
				htmlElement.title = htmlElement.pfHintText;
        htmlElement.removeAttribute("pfhint");
			}

			// Add the pform field's value ui element as a child to this element.
			htmlElement.pfvalueElement = _PForm_CreateFieldValueElement(htmlElement);

			// Check to see if the field has a pattern to verify input against.
			if (htmlElement.pftype === "CUSTOM") {
				// It does, so only allow input that matches the pattern.
        htmlElement.pfvalueElement.onkeypress = function(event) {
          var match = htmlElement.pfpattern.IsMatch(htmlElement.pfvalueElement.value + String.fromCharCode(event.keyCode));
          if (!match) {
            event.preventDefault();
            return false;
          }
        }
      }

			// Create an array that holds references to all other elements listening to changes in this element's value.
			htmlElement._pfvalueListeners = new Array();

			// Add a method to allow an element to register as a value change listener.  The element should implement the 
			// following set of methods:
			// DependencyValueChanged(element) which is called when the value of pforms field 'element' has changed.
			htmlElement.AddValueListener = function(dependantField) {
        if (!this._pfvalueListeners.includes(dependantField)) this._pfvalueListeners[this._pfvalueListeners.length] = dependantField;
      }

      // GetValue method returns the value of the field, or nothing where appropriate.
      htmlElement.GetValue = _PForm_GetFieldValue;

      // SetValue method sets the value of the field.  Note, this method does not directly trigger a value change event.
      htmlElement.SetValue = _PForm_SetFieldValue;

      // Finally, set a flag property indicating that this element has been fully initialised as a PForms element.
			htmlElement._pfinit = true;
		}
  }
}

// Internal utility methods

function _PForm_CreateFieldValueElement(pformFieldElement) {
  var valueElement = null;
	if (_PForm_IsValidFieldElement(pformFieldElement)) {
		// Create an intemediary div element to place the text/input components into.
		var intermediaryDiv = document.createElement("div");
		intermediaryDiv.className = "pfinputElementContainer";
		pformFieldElement.appendChild(intermediaryDiv);

		// We now need to use the type of the element to determine what type of component to create.
		switch (pformFieldElement.pftype) {
			case "LABEL" : {
				// It's a label (non editable text element).
				valueElement = _PForm_CreateFieldValueElementUsingTag("p", pformFieldElement);
				valueElement.innerText = _PForm_ParseFieldValue(pformFieldElement);
			} break;
			case "DROPDOWN" : {
				// It's a drop-down list.
				valueElement = _Pform_CreateSelectField(pformFieldElement);
			} break;
			default : {
				// For now, let's just assume we're working with input as the only other HTML element.
				valueElement = _PForm_CreateFieldValueElementUsingTag("input", pformFieldElement, true);
			  valueElement.value = _PForm_ParseFieldValue(pformFieldElement);
				if (pformFieldElement.pfHint) textInputElement.placeholder = pformFieldElement.pfHint;
			}
		}

		// If we have a valid value element, we need to add it to the intermediary div and also create a circular link between the
		// value element and it's host pformfield element.
    if (valueElement) {
			intermediaryDiv.appendChild(valueElement);
			valueElement.pformfieldElement = pformFieldElement;
		}
	}

	// Return the created value element.
  return valueElement;
}

// Definition for add-on object method 'GetValue' used by PForm field elements.
function _PForm_GetFieldValue() {
  // Set the default return value to null.
  var fieldValue = null;
  // Check to see if the given element has a pftype attribute and a child element that hosts the field's value.
  if (this.pftype && this.pfvalueElement) {
    // It does, so use the field's type to extract the field value from the appropriate child element.
    switch (this.pftype) {
      case "LABEL" : fieldValue = this.pfvalueElement.innerText; break;  // Get the inner text value of the first p child if it's a label element.
      case "TEXT" : fieldValue = this.pfvalueElement.value; break;				// Get the value of the first input child if it's a text element.
      case "NUMBER" : fieldValue = isNaN(this.pfvalueElement.value) ? "0" : this.pfvalueElement.value; break;
			case "DROPDOWN" : fieldValue = this.pfselectOptionsBox.selectedOption ? this.pfselectOptionsBox.selectedOption.GetValue() : null;
    }
  }
  return fieldValue;
}

// Definitions for add-on object method 'SetValue' used by PForm field elements.
function _PForm_SetFieldValue(newValue) {
	if (this.pftype) {
		if (this.valueElement) {
			switch (this.pftype) {
				case "LABEL" : this.valueElement.innerText = newValue; break;
				case "TEXT" : this.valueElement.value = newValue; break;
				case "NUMBER" : this.valueElement.value = isNaN(newValue) ? "0" : newValue; break;
			}
		}
	}
}

function _PForm_ParseFieldValue(pformfieldElement) {
	var interpretedValue = "";
	if (_PForm_IsValidFieldElement(pformfieldElement)) {
		var valueString = null;
		if (!pformfieldElement.scripted && pformfieldElement._pfinit) {
			switch (pformfieldElement.pftype) {
				case "LABEL" : valueString = pformfieldElement.valueElement.innerText; break;
				case "TEXT", "NUMBER" : valueString = pformfieldElement.valueElement.value; break;
			}
		} else {
			valueString = pformfieldElement.getAttribute("pfvalue");
		}
		if (_PForm_VariableIsString(valueString)) {
			// Get rid of any excess space at either end of the string.
			valueString = valueString.trim();
			// Check to see if the first character of the string is a dollar sign ($).
			if (valueString[0] == '$') {
				pformfieldElement.scripted = true;
				// It is, so we've got a script string.
				var re = /{[A-Za-z0-9.]+}/g;
				var i = 1;
				while ((match = re.exec(valueString)) != null) {
					if (match) {
						var matchLength = re.lastIndex - match.index;
						var matchString = valueString.substr(match.index, matchLength);
						if (match.index - i > 0) interpretedValue = interpretedValue + valueString.substr(i, match.index - i);
						var pformsElement = document.getElementById(matchString.substr(1, matchLength - 2));
						if (pformsElement && _PForm_IsValidFieldElement(pformsElement)) {
							interpretedValue += pformsElement.GetValue();
							pformsElement.AddValueListener(pformfieldElement);
							if (!pformfieldElement.DependencyValueChanged) {
								pformfieldElement.DependencyValueChanged = function() {
									var pftype = _PForm_GetAttribute("pftype", this).toUpperCase().trim();
									switch (pftype) {
										case "LABEL" : {
											try {
												this.pfvalueElement.innerText = _PForm_ParseFieldValue(this); 
											} catch {
												this.pfvalueElement.innerText = "";
											}
										} break;
										case "TEXT", "NUMBER" : {
											try {
												this.pfvalueElement.value = _PForm_ParseFieldValue(this);
											} catch {
												this.pfvalueElement.value = "";
											}
										 } break;
									}
								}
							}
						}
						i = re.lastIndex;
					}
				}
				interpretedValue += valueString.substring(i);
				interpretedValue = Function("return " + interpretedValue)();
				if (pformfieldElement.pftype === "NUMBER" && isNaN(interpretedValue)) interpretedValue = "0";
			} else {
				// It isn't, so we can only assume it's a literal value and make a copy of the string passed to the method.
				interpretedValue = valueString;
				if (pformfieldElement.pftype === "NUMBER" && isNaN(interpretedValue)) interpretedValue = "0";
			}
		} else {
      if (pformfieldElement.pftype === "NUMBER") interpretedValue = "0";
    }
	}
	return interpretedValue;
}

function _PForm_NotifyValueChange() {
	for (var i = 0; i < this.pformsField._pfvalueListeners.length; i++) {
		if (this.pformsField._pfvalueListeners[i].DependencyValueChanged) {
			this.pformsField._pfvalueListeners[i].DependencyValueChanged(this.pformsField);
		}
	}
}

function _PForm_CreateFieldValueElementUsingTag(tagname, pformFieldElement, notifyValueChanged = false) {
  var valueElement = null;
  if (_PForm_IsValidFieldElement(pformFieldElement)) {
    valueElement = document.createElement(tagname);
		switch (pformFieldElement.pftype) {
			case "CUSTOM" : {
				if (pformFieldElement.getAttribute("pfpattern")) {
					pformFieldElement.pfpattern = new PRegex(pformFieldElement.getAttribute("pfpattern"));	
				}
			} break;
			default: valueElement.type = pformFieldElement.pftype;
		}
		valueElement.pformsField = pformFieldElement;
    pformFieldElement.pfvalueElement = valueElement;
    if (notifyValueChanged) valueElement.onchange = _PForm_NotifyValueChange;
  }
  return valueElement;
}