/*  base.js
    Object oriented and functional scripts for handling pform functionality.
    (C)2023 Morgan Evans */

function _PForms_VariableIsString(givenVar) {
  return (typeof givenVar === 'string' || givenVar instanceof String);
}

function _PForms_IsHTMLElement(element) {
  return typeof HTMLElement === "object" ? element instanceof HTMLElement : 
    element && typeof element === "object" && element !== null && element.nodeType === 1 && _PForms_VariableIsString(element.nodeName);
}

function _PForms_GetAttribute(attributeName, element) {
  var attributeValue = undefined;
  if (_PForms_VariableIsString(attributeName) && _PForms_IsHTMLElement(element)) {
    var attributeValue = element.getAttribute(attributeName);
  }
  return attributeValue;
}

function _PForms_IsValidFieldElement(element) {
	return _PForms_IsHTMLElement(element) && element.classList.contains("pformfield");
}

function _PForms_GetFieldValue() {
	var fieldValue = null;
	var pftype = _PForms_GetAttribute("pftype", this);
	if (pftype) {
		const valueElement = this.lastChild.firstChild;
		if (valueElement) {
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : fieldValue = valueElement.innerText; break;
				case "TEXT" : fieldValue = valueElement.value; break;
			}
		}
	}
	return fieldValue;
}

function _PForms_SetFieldValue(newValue) {
	var pftype = _PForms_GetAttribute("pftype", this);
	if (pftype) {
		const valueElement = this.lastChild.firstChild;
		if (valueElement) {
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : valueElement.innerText = newValue; break;
				case "TEXT" : valueElement.value = newValue; break;
			}
		}
	}
}

function PFormsInit() {
	var pformsElements = document.getElementsByClassName("pformfield");
	if (pformsElements) {
		for (var i = 0; i < pformsElements.length; i++) {
			CreatePFormField(pformsElements[i]);
		}
	}
}

function CreatePFormField(htmlElement) {
  if (_PForms_IsValidFieldElement(htmlElement)) {
		// Get all pforms attributes necessary to initialise the component.
		var pfheader = _PForms_GetAttribute("pfheader", htmlElement);
		var pftype = _PForms_GetAttribute("pftype", htmlElement);
		var pfValue = _PForms_GetAttribute("pfvalue", htmlElement);
		var pfHint = _PForms_GetAttribute("pfhint", htmlElement);

		if (pftype && !htmlElement.initialised) {
			htmlElement.initialised = true;

			// Check to see if the parent element is a line items container and mark the child as a line item field if necessary.
			const parentContainer = htmlElement.parentElement;
			if (parentContainer) {
				const parentContainerType = parentContainer.getAttribute("pftype");
				htmlElement.isLineItem = parentContainerType && parentContainerType.toUpperCase().trim() === "LINEITEMS" ? true : false;				
			}

			// Make sure to remove any existing child nodes and text from the element.
			while (htmlElement.firstChild) htmlElement.removeChild(htmlElement.lastChild);
			htmlElement.innerText = null;
			
			// Check to see if we have a header.  If so, add a child header (H1) element to this element.
			if (pfheader) {
				var headerElement = document.createElement("h1");
				headerElement.innerText = pfheader;
				htmlElement.appendChild(headerElement);
			}

			// Check to see if we have a hint.  If so, add it to this element.
			if (pfHint) {
				htmlElement.title = pfHint;
			}

			// Create an intemediary div element to place the text/input components into.
			var intermediaryDiv = document.createElement("div");
			htmlElement.appendChild(intermediaryDiv);

			// We now need to use the type of the element to determine what type of component to create.
			pftype = pftype.toUpperCase().trim();
			switch (pftype) {
				case "LABEL" : {
					// It's a label (non editable text element).
					var labelParagraphElement = document.createElement("p");
					labelParagraphElement.innerText = pfValue ? pfValue : "";
					intermediaryDiv.appendChild(labelParagraphElement);
				} break;
				case "TEXT" : {
					// It's an editable text input.
					var textInputElement = document.createElement("input");
					textInputElement.value = pfValue ? pfValue : "";
					if (pfHint) textInputElement.placeholder = pfHint;
					intermediaryDiv.appendChild(textInputElement);
				} break;
			}

			// Add a new method to the element so we can get it's value easily.
			htmlElement.GetValue = _PForms_GetFieldValue;
			htmlElement.SetValue = _PForms_SetFieldValue;
		}
  }
}