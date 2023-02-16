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

// PFormsInit should be called by the onload event handler of the host page.  It configures all PFormField elements so that they are
// displayed correctly.
function PFormsInit() {
	var pformsElements = document.getElementsByClassName("pformfield");
	if (pformsElements) {
		for (var i = 0; i < pformsElements.length; i++) {
			PFormsCreateFieldUsing(pformsElements[i]);
		}
	}
}
