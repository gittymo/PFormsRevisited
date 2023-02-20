function _Pform_CreateSelectField(pformFieldElement, maxOptionLines = 5) {
  var selectElement = null;
  if (_PForm_IsValidFieldElement(pformFieldElement)) {
    // The component the user will initially interact with for the dropdown (select) input field is a div.
    selectElement = document.createElement("div");
    selectElement.pformFieldElement = pformFieldElement;
    selectElement.className = "pformselectelement";

    if (pformFieldElement.getAttribute("pfvalue")) {
      pformFieldElement.values = pformFieldElement.getAttribute("pfvalue").split(",");
      if (Array.isArray(pformFieldElement.values) && pformFieldElement.values.length > 0) {
        pformFieldElement.pfselectedIndex = 0;
        pformFieldElement.pfmaxOptionLines = !isNaN(maxOptionLines) && maxOptionLines > 0 ? maxOptionLines : 5;
        pformFieldElement.pfselectOptionsBox = document.createElement("div");
        pformFieldElement.pfselectOptionsBox.className = "pformselectoptionsbox";
        pformFieldElement.pfselectOptionsBox.style = "display: none";
        pformFieldElement.appendChild(pformFieldElement.pfselectOptionsBox);
        for (var i = 0; i < pformFieldElement.values.length; i++) {
          pformFieldElement.pfselectOptionsBox.appendChild(_PForm_CreateSelectFieldOption(i, pformFieldElement));
        }
        selectElement.innerText = pformFieldElement.values[pformFieldElement.pfselectedIndex];
      }
    }

    selectElement.onclick = (event) => {  
      var selectElement = event.target;
      var optionsBox = selectElement.pformFieldElement.pfselectOptionsBox;
      var options = optionsBox.childNodes;
      if (options) {
        for (var i = 0; i < options.length; i++) {
          if (i >= selectElement.pformFieldElement.pfselectedIndex &&
              i < selectElement.pformFieldElement.pfselectedIndex + selectElement.pformFieldElement.pfmaxOptionLines)
          {
            options[i].style = "display: block";
          } else {
            options[i].style = "display: none";
          }
        }
      }
      optionsBox.style = "display: block; left: 17px; " + "top: " + (pformFieldElement.clientHeight - selectElement.clientHeight - 3) + "px; " + 
        "width: " + (selectElement.clientWidth) + "px;";
      _PF_ActiveSelectOptionBox = optionsBox;
      event.stopPropagation();
    }

    return selectElement;
  }
}

function _PForm_CreateSelectFieldOption(valueIndex, pformFieldElement) {
  var option = null;
  if (_PForm_IsValidFieldElement(pformFieldElement) && 
      valueIndex >= 0 && 
      pformFieldElement.values && 
      pformFieldElement.values.length > 0 &&
      valueIndex < pformFieldElement.values.length)
  {
    option = document.createElement("div");
    option.className = "pformselectoption";
    option.pformFieldElement = pformFieldElement;
    option.innerText = pformFieldElement.values[valueIndex];
    option.valueIndex = valueIndex;
    option.style = "display: none";
    option.onclick = (event) => {
      var clickedOption = event.target;
      option.pformFieldElement.pfvalueElement.innerText = clickedOption.innerText;
      clickedOption.pformFieldElement.pfselectOptionsBox.style = "display: none";
    }
    return option;
  }
}