/*  base.js
    Object oriented and functional scripts for handling pform functionality.
    (C)2023 Morgan Evans */

// _PF_ActiveSelectOptionBox is used to identify and close any open select option boxes when the user clicks outside the
// component area or resizes the display area (e.g. by resizing the browser window).
var _PF_ActiveSelectOptionBox = null;

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
	var pformsElements = document.getElementsByClassName("pformfield");
	if (pformsElements) {
		for (var i = 0; i < pformsElements.length; i++) {
			_PForm_CreateFieldUsing(pformsElements[i]);
		}
	}

  document.querySelector("html").addEventListener('click', (event) => {
    if (_PF_ActiveSelectOptionBox.style.display === "block" && event.target != _PF_ActiveSelectOptionBox) {
      _PF_ActiveSelectOptionBox.style = "display: none";
    }
  }, true);

  window.onresize = (event) => {
    if (_PF_ActiveSelectOptionBox.style.display === "block") {
      _PF_ActiveSelectOptionBox.style = "display: none";
    }
  }
}