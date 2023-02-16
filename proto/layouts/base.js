/*  base.js
    Object oriented and functional scripts for handling pform functionality.
    (C)2023 Morgan Evans */

// Internal utility method to check if the given variable is actually a string.
function _PForms_VariableIsString(givenVar) {
  return (typeof givenVar === 'string' || givenVar instanceof String);
}

// Internal utility method to check if the given element is actually an HTML element.
function _PForms_IsHTMLElement(element) {
  return typeof HTMLElement === "object" ? element instanceof HTMLElement : 
    element && typeof element === "object" && element !== null && element.nodeType === 1 && _PForms_VariableIsString(element.nodeName);
}

// Internal utility method to get the value of the requested element attribute.  Returns undefined if the attribute doesn't exist.
function _PForms_GetAttribute(attributeName, element) {
  var attributeValue = undefined;
  if (_PForms_VariableIsString(attributeName) && _PForms_IsHTMLElement(element)) {
    var attributeValue = element.getAttribute(attributeName);
  }
  return attributeValue;
}

// Internal utility methods to check if the given HTML element is a PForms field.
function _PForms_IsValidFieldElement(element) {
	return _PForms_IsHTMLElement(element) && element.classList.contains("pformfield");
}

// Definition for add-on object method 'GetValue' used by PForm field elements.
function _PForms_GetFieldValue() {
	// Set the default return value to null.
	var fieldValue = null;

	// Check to see if the given element has a pftype attribute.
	var pftype = _PForms_GetAttribute("pftype", this);
	if (pftype) {
		// It does, so find the child element whose value we're interested in.
		const valueElement = this.lastChild.firstChild;
		if (valueElement) {
			// If the child element exists, we can extract its value (if appropriate for the type).
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : fieldValue = valueElement.innerText; break;  // Get the inner text value of the first p child if it's a label element.
				case "TEXT" : fieldValue = valueElement.value; break;				// Get the value of the first input child if it's a text element.
				case "NUMERIC" : fieldValue = isNaN(valueElement.value) ? "0" : valueElement.value; break;
			}
		}
	}

	// Return the field value (or null if we couldn't find the child element holding it).
	return fieldValue;
}

// Definitions for add-on object method 'SetValue' used by PForm field elements.
function _PForms_SetFieldValue(newValue) {
	var pftype = _PForms_GetAttribute("pftype", this);
	if (pftype) {
		const valueElement = this.lastChild.firstChild;
		if (valueElement) {
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : valueElement.innerText = newValue; break;
				case "TEXT" : valueElement.value = newValue; break;
				case "NUMERIC" : valueElement.value = isNaN(newValue) ? "0" : newValue; break;
			}
		}
	}
}

function _PForms_NotifyValueChange() {
	for (var i = 0; i < this.pformsField.valueListeners.length; i++) {
		if (this.pformsField.valueListeners[i].DependencyValueChanged) {
			this.pformsField.valueListeners[i].DependencyValueChanged(this.pformsField);
		}
	}
}

function _PForms_ParseValue(element) {
	var interpretedValue = "";
	if (_PForms_IsValidFieldElement(element)) {
		var valueString = null;
		const pftype = element.getAttribute("pftype").toUpperCase().trim();
		if (!element.scripted && element.initialised) {
			switch (pftype) {
				case "LABEL" : valueString = element.lastChild.firstChild.innerText; break;
				case "TEXT", "NUMERIC" : valueString = element.lastChild.firstChild.value; break;
			}
		} else {
			valueString = element.getAttribute("pfvalue");
		}
		if (_PForms_VariableIsString(valueString)) {
			// Get rid of any excess space at either end of the string.
			valueString = valueString.trim();
			// Check to see if the first character of the string is a dollar sign ($).
			if (valueString[0] == '$') {
				element.scripted = true;
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
							pformsElement.AddValueListener(element);
							if (!element.DependencyValueChanged) {
								element.DependencyValueChanged = function(changedElement) {
									var pftype = _PForms_GetAttribute("pftype", this).toUpperCase().trim();
									switch (pftype) {
										case "LABEL" : this.lastChild.firstChild.innerText = _PForms_ParseValue(this); break;
										case "TEXT", "NUMERIC" : this.lastChild.firstChild.value = _PForms_ParseValue(this); break;
									}
								}
							}
						}
						i = re.lastIndex;
					}
				}
				interpretedValue += valueString.substring(i);
				interpretedValue = "" + eval(interpretedValue);
				if (pftype === "NUMERIC" && isNaN(interpretedValue)) interpretedValue = "0";
			} else {
				// It isn't, so we can only assume it's a literal value and make a copy of the string passed to the method.
				interpretedValue = valueString;
				if (pftype === "NUMERIC" && isNaN(interpretedValue)) interpretedValue = "0";
			}
		}
	}
	return interpretedValue;
}

// PFormsInit should be called by the onload event handler of the host page.  It configures all PFormField elements so that they are
// displayed correctly.
function PFormsInit() {
	var pformsElements = document.getElementsByClassName("pformfield");
	if (pformsElements) {
		for (var i = 0; i < pformsElements.length; i++) {
			_PForms_CreateField(pformsElements[i]);
		}
	}
}

// Internal utility method which is used to take an HTML div element with the appropriate pforms attributes and configure it so that 
// it provides the functionality required of a PForms field element.
function _PForms_CreateField(pformsElement) {
  if (_PForms_IsValidFieldElement(pformsElement)) {
		// Get all pforms attributes necessary to initialise the component.
		var pfheader = _PForms_GetAttribute("pfheader", pformsElement);
		var pftype = _PForms_GetAttribute("pftype", pformsElement);
		var pfValue = _PForms_GetAttribute("pfvalue", pformsElement);
		var pfHint = _PForms_GetAttribute("pfhint", pformsElement);

		if (pftype && !pformsElement.initialised) {
			// Check to see if the parent element is a line items container and mark the child as a line item field if necessary.
			const parentContainer = pformsElement.parentElement;
			if (parentContainer) {
				const parentContainerType = parentContainer.getAttribute("pftype");
				pformsElement.isLineItem = parentContainerType && parentContainerType.toUpperCase().trim() === "LINEITEMS" ? true : false;				
			}

			// Make sure to remove any existing child nodes and text from the element.
			while (pformsElement.firstChild) pformsElement.removeChild(pformsElement.lastChild);
			pformsElement.innerText = null;
			
			// Check to see if we have a header.  If so, add a child header (H1) element to this element.
			if (pfheader) {
				var headerElement = document.createElement("h1");
				headerElement.innerText = pfheader;
				pformsElement.appendChild(headerElement);
			}

			// Check to see if we have a hint.  If so, add it to this element.
			if (pfHint) {
				pformsElement.title = pfHint;
			}

			// Create an intemediary div element to place the text/input components into.
			var intermediaryDiv = document.createElement("div");
			pformsElement.appendChild(intermediaryDiv);

			// We now need to use the type of the element to determine what type of component to create.
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : {
					// It's a label (non editable text element).
					var labelParagraphElement = document.createElement("p");
					labelParagraphElement.pformsField = pformsElement;
					labelParagraphElement.innerText = _PForms_ParseValue(pformsElement);
					intermediaryDiv.appendChild(labelParagraphElement);
				} break;
				case "TEXT", "NUMERIC" : {
					// It's an editable text input.
					var textInputElement = document.createElement("input");
					textInputElement.pformsField = pformsElement;
					textInputElement.value = _PForms_ParseValue(pformsElement);
					textInputElement.onchange = _PForms_NotifyValueChange;
					if (pfHint) textInputElement.placeholder = pfHint;
					intermediaryDiv.appendChild(textInputElement);
				} break;
			}

			// Add new methods to the element so we can get and set its value easily.
			pformsElement.GetValue = _PForms_GetFieldValue;
			pformsElement.SetValue = _PForms_SetFieldValue;

			// Create an array that holds references to all other elements listening to changes in this element's value.
			pformsElement.valueListeners = new Array();

			// Add a method to allow an element to register as a value change listener.  The element should implement the 
			// following set of methods:
			// DependencyValueChanged(element) which is called when the value of pforms field 'element' has changed.
			pformsElement.AddValueListener = function (dependantElement) {
				if (!pformsElement.valueListeners.includes(dependantElement)) pformsElement.valueListeners[pformsElement.valueListeners.length] = dependantElement;
			}
			
			// Finally, set a flag property indicating that this element has been fully initialised as a PForms element.
			pformsElement.initialised = true;
		}
  }
}