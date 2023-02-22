/*  base.js
    Object oriented and functional scripts for handling pform functionality.
    (C)2023 Morgan Evans */

// Internal utility method to check if the given variable is actually a string.
function _PForm_VariableIsString(givenVar) {
  return (typeof givenVar === 'string' || givenVar instanceof String);
}

// Internal utility method to check if the given element is actually an HTML element.
function _PForm_IsHTMLElement(element) {
  return typeof HTMLElement === "object" ? element instanceof HTMLElement : 
    element && typeof element === "object" && element !== null && element.nodeType === 1 && _PForm_VariableIsString(element.nodeName);
}

// Internal utility method to get the value of the requested element attribute.  Returns undefined if the attribute doesn't exist.
function _PForm_GetAttribute(attributeName, element) {
  var attributeValue = undefined;
  if (_PForm_VariableIsString(attributeName) && _PForm_IsHTMLElement(element)) {
    var attributeValue = element.getAttribute(attributeName);
  }
  return attributeValue;
}

// Internal utility methods to check if the given HTML element is a PForms field.
function _PForm_IsValidFieldElement(element) {
	return _PForm_IsHTMLElement(element) && element.classList.contains("pformfield");
}

// PFormsInit should be called by the onload event handler of the host page.  It configures all PFormField elements so that they are
// displayed correctly.
function PFormInit() {
  // Initialise all pformfield div elements defined on the source page.
	var pformsElements = document.getElementsByClassName("pformfield");
	if (pformsElements) {
		for (var i = 0; i < pformsElements.length; i++) {
			_PForm_CreateFieldUsing(pformsElements[i]);
		}
	}
}