/*  pformfield.js */

function PFormsCreateFieldUsing(htmlElement) {
  if (_PForms_IsValidFieldElement(htmlElement)) {
    // Because we're building the PFormsField element ontop of an existing HTML element, that element can't have anything 
    // inside it, so make sure to remove any existing child nodes and text from it.
		while (htmlElement.firstChild) htmlElement.removeChild(htmlElement.lastChild);
		htmlElement.innerText = null;

    // pftype provides a textual value used to identify and control how the field displays its data and controls its input.
    htmlElement.pftype = _PForms_GetAttribute("pftype", htmlElement).toUpperCase().trim();

		if (htmlElement.pftype && !htmlElement._pfinit) {
      // If the parent container element is a suitable line items container, mark this element as a line item.
			htmlElement.pflineItem = htmlElement.parentElement && htmlElement.parentElement.classList.contains("pfcontainer") && 
        htmlElement.parentElement.getAttribute("pftype") && 
        htmlElement.parentElement.getAttribute("pftype").toUpperCase().trim() === "LINEITEMS" ? true : false;

			// Check to see if we have a header.  If so, add a child header (H1) element to this element.
      const headerText = _PForms_GetAttribute("pfheader", htmlElement);
			if (headerText) {
				htmlElement.pfheaderElement = document.createElement("h1");
				htmlElement.pfheaderElement.innerText = headerText;
				htmlElement.appendChild(htmlElement.pfheaderElement);
        htmlElement.removeAttribute("pfheader");
			}

			// Check to see if we have a hint attribute.  If so, add it to this element.
      htmlElement.pfHintText = _PForms_GetAttribute("pfhint", htmlElement);
			if (htmlElement.pfHintText) {
				htmlElement.title = htmlElement.pfHintText;
        htmlElement.removeAttribute("pfhint");
			}

			// Add the pform field's value ui element as a child to this element.
			htmlElement.pfvalueElement = _PForms_CreateFieldValueElement(htmlElement);


			// Create an array that holds references to all other elements listening to changes in this element's value.
			htmlElement._pfvalueListeners = new Array();

			// Add a method to allow an element to register as a value change listener.  The element should implement the 
			// following set of methods:
			// DependencyValueChanged(element) which is called when the value of pforms field 'element' has changed.
			htmlElement.AddValueListener = function(dependantField) {
        if (!this._pfvalueListeners.includes(dependantField)) this._pfvalueListeners[this._pfvalueListeners.length] = dependantField;
      }

      // GetValue method returns the value of the field, or nothing where appropriate.
      htmlElement.GetValue = _PForms_GetFieldValue;

      // SetValue method sets the value of the field.  Note, this method does not directly trigger a value change event.
      htmlElement.SetValue = _PForms_SetFieldValue;

      // Finally, set a flag property indicating that this element has been fully initialised as a PForms element.
			htmlElement._pfinit = true;
		}
  }
}

// Internal utility methods

function _PForms_CreateFieldValueElement(pformsFieldElement) {
  var valueElement = null;
	if (_PForms_IsValidFieldElement(pformsFieldElement)) {
		// Create an intemediary div element to place the text/input components into.
		var intermediaryDiv = document.createElement("div");
		pformsFieldElement.appendChild(intermediaryDiv);

		// We now need to use the type of the element to determine what type of component to create.
		switch (pformsFieldElement.pftype) {
			case "LABEL" : {
				// It's a label (non editable text element).
				valueElement = _PForms_CreateFieldValueElementUsingTag("p", pformsFieldElement);
				valueElement.innerText = _PForms_ParseFieldValue(pformsFieldElement);
			} break;
			case "TEXT", "NUMERIC" : {
				// It's an editable text input.
				valueElement = _PForms_CreateFieldValueElementUsingTag("input", pformsFieldElement, true);
			  valueElement.value = _PForms_ParseFieldValue(pformsFieldElement);
				if (pformsFieldElement.pfHint) textInputElement.placeholder = pformsFieldElement.pfHint;
			} break;
		}
    if (valueElement) intermediaryDiv.appendChild(valueElement);
	}
  return valueElement;
}

// Definition for add-on object method 'GetValue' used by PForm field elements.
function _PForms_GetFieldValue() {
  // Set the default return value to null.
  var fieldValue = null;

  // Check to see if the given element has a pftype attribute and a child element that hosts the field's value.
  if (this.pftype && this.pfvalueElement) {
    // It does, so use the field's type to extract the field value from the appropriate child element.
    switch (this.pftype) {
      case "LABEL" : fieldValue = this.pfvalueElement.innerText; break;  // Get the inner text value of the first p child if it's a label element.
      case "TEXT" : fieldValue = this.pfvalueElement.value; break;				// Get the value of the first input child if it's a text element.
      case "NUMERIC" : fieldValue = isNaN(this.pfvalueElement.value) ? "0" : this.pfvalueElement.value; break;
    }
  }
  return fieldValue;
}

// Definitions for add-on object method 'SetValue' used by PForm field elements.
function _PForms_SetFieldValue(newValue) {
	if (this.pftype) {
		if (this.valueElement) {
			switch (this.pftype) {
				case "LABEL" : this.valueElement.innerText = newValue; break;
				case "TEXT" : this.valueElement.value = newValue; break;
				case "NUMERIC" : this.valueElement.value = isNaN(newValue) ? "0" : newValue; break;
			}
		}
	}
}

function _PForms_ParseFieldValue(pformfieldElement) {
	var interpretedValue = "";
	if (_PForms_IsValidFieldElement(pformfieldElement)) {
		var valueString = null;
		if (!pformfieldElement.scripted && pformfieldElement._pfinit) {
			switch (pformfieldElement.pftype) {
				case "LABEL" : valueString = pformfieldElement.valueElement.innerText; break;
				case "TEXT", "NUMERIC" : valueString = pformfieldElement.valueElement.value; break;
			}
		} else {
			valueString = pformfieldElement.getAttribute("pfvalue");
		}
		if (_PForms_VariableIsString(valueString)) {
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
						if (pformsElement && _PForms_IsValidFieldElement(pformsElement)) {
							interpretedValue += pformsElement.GetValue();
							pformsElement.AddValueListener(pformfieldElement);
							if (!pformfieldElement.DependencyValueChanged) {
								pformfieldElement.DependencyValueChanged = function(changedElement) {
									var pftype = _PForms_GetAttribute("pftype", this).toUpperCase().trim();
									switch (pftype) {
										case "LABEL" : this.lastChild.firstChild.innerText = _PForms_ParseFieldValue(this); break;
										case "TEXT", "NUMERIC" : this.lastChild.firstChild.value = _PForms_ParseFieldValue(this); break;
									}
								}
							}
						}
						i = re.lastIndex;
					}
				}
				interpretedValue += valueString.substring(i);
				interpretedValue = Function("return " + interpretedValue)();
				if (pformfieldElement.pftype === "NUMERIC" && isNaN(interpretedValue)) interpretedValue = "0";
			} else {
				// It isn't, so we can only assume it's a literal value and make a copy of the string passed to the method.
				interpretedValue = valueString;
				if (pformfieldElement.pftype === "NUMERIC" && isNaN(interpretedValue)) interpretedValue = "0";
			}
		}
	}
	return interpretedValue;
}

function _PForms_NotifyValueChange() {
	for (var i = 0; i < this.pformsField._pfvalueListeners.length; i++) {
		if (this.pformsField._pfvalueListeners[i].DependencyValueChanged) {
			this.pformsField._pfvalueListeners[i].DependencyValueChanged(this.pformsField);
		}
	}
}

function _PForms_CreateFieldValueElementUsingTag(tagname, pformsFieldElement, notifyValueChanged = false) {
  var valueElement = null;
  if (_PForms_IsValidFieldElement(pformsFieldElement)) {
    valueElement = document.createElement(tagname);
		valueElement.pformsField = pformsFieldElement;
    pformsFieldElement.pfvalueElement = valueElement;
    if (notifyValueChanged) valueElement.onchange = _PForms_NotifyValueChange;
  }
  return valueElement;
}