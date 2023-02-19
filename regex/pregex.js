/*  pregex.js
		Library to deal with regular expression matching in a progessive fashion.
		This allows for realtime validation as the user enters information into form fields.
		(C)2023 Morgan Evans */

class PRegexPart {
	constructor(value = null, minimumInstances = -1, maximumInstances = -1) {
		this.value = value;
		this.minInstances = minimumInstances;
		this.maxInstances = maximumInstances;
	}

	ToString() {
		if (this.minInstances > this.maxInstances) {
			var actualMaxInstances = this.minInstances;
			this.minInstances = this.maxInstances;
			this.maxInstances = actualMaxInstances;
		}

		var regexPartString = null;

		if (this.value) {
			regexPartString = this.value;
			if (this.minInstances == 0 && this.maxInstances == 1)
				regexPartString += "?";
			else if (this.minInstances == 1 && this.maxInstances == -1)
				regexPartString += "+";
			else if (this.minInstances == 0 && this.maxInstances == -1)
				regexPartString += "*";
			else if (this.minInstances > 0 && this.maxInstances == -1)
				regexPartString += "{" + this.minInstances + ",}";
			else if (this.minInstances >= 0 && this.maxInstances > 0) {
				if (this.minInstances == this.maxInstances) {
					regexPartString += "{" + this.minInstances + "}";
				} else {
					regexPartString += "{" + this.minInstances + "," + this.maxInstances + "}";
				}
			}
		}
		return regexPartString;
	}

	MakeBetween(minimumInstances, maximumInstances) {
		if (!isNaN(minimumInstances) && !isNaN(maximumInstances) && minimumInstances >= 0 && maximumInstances >= 0) {
			this.minInstances = minimumInstances;
			this.maxInstances = maximumInstances;
		}
	}

	MakeMinOrMany(minimumInstances) {
		if (!isNaN(minimumInstances) && minimumInstances > 0) {
			this.minInstances = minimumInstances;
			this.maxInstances = -1;
		}
	}

	MakeZeroOrMany() {
		this.minInstances = 0;
		this.maxInstances = -1;
	}

	MakeOneOrMany() {
		this.minInstances = 1;
		this.maxInstances = -1;
	}

	MakeOneOrNone() {
		this.minInstances = 0;
		this.maxInstances = 1;
	}
}

class PRegex {
	constructor(regexString) {
		// Pre allocate an array (which will hold each part of the regular expression).  This is for performance reasons.
		this.pregexParts = new Array(10);
		// pregexCount gives the total number of parts in the regular expression.
		this.pregexCount = 0;

		// Initialise a load of variable that deal with parsing the regex.
		this._ResetParseVars();

		// Remove any whitespace from either end of the regular expression string.
		regexString = regexString.trim();

		if ((typeof regexString === 'string' || regexString instanceof String) && regexString.length > 0) {
			for (var i = 0; i < regexString.length; i++) {
				if (!this._rangeOpen) this._partRegexString += regexString[i];
				if (this._escaped) {
					this._escaped = false;
					if (this._bracketListClosed || this._rangeClosed) {
						this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
					}
				} else {
					if (regexString[i] == '$' || regexString[i] == '^') continue;
					switch (regexString[i]) {
						case '\\': {
							this._escaped = !this._escaped;
						} break;
						case '[': {
							if (this._bracketListClosed || this._rangeClosed) {
								this._partRegexString = this._partRegexString.substring(0, this._partRegexString.length - 1);
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
								i--;
							}
							this._bracketListOpen = true;	
						} break;
						case ']': {
							this._bracketListOpen = false;
							this._bracketListClosed = true;
						} break;
						case '*': {
							this._MakePRegexPart(this._partRegexString, 0, -1);
						} break;
						case '+': {
							this._MakePRegexPart(this._partRegexString, 1, -1);		
						} break;
						case '?': {
							this._MakePRegexPart(this._partRegexString, 0, 1);
						} break;
						case '{': {
							this._partRegexString = this._partRegexString.substring(0, this._partRegexString.length - 1);
							this._rangeOpen = true;
						} break;
						case '}': {
							if (this._rangeFirst) this._minimumInstances = this._maximumInstances = parseInt(this._rangeValueString);
							else this._maximumInstances = parseInt(this._rangeValueString);
							this._rangeOpen = false;
							this._rangeClosed = true;
						} break;
						default: {
							if (this._bracketListClosed && !this._rangeOpen) {
								this._partRegexString = this._partRegexString.substring(0, this._partRegexString.length - 1);
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
								i--;
							} else {
								if (this._rangeOpen) {
									if (regexString[i] == ',') {
										if (this._rangeCommas == 0) {
											this._rangeCommas = 1;
											this._minimumInstances = parseInt(this._rangeValueString);
											this._rangeFirst = false;
											this._rangeValueString = "";
										}
							 		} else this._rangeValueString += regexString[i];
								}
							}
						}
					}
				}
			}
			if (this._partRegexString.length > 0) {
				this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
			}
		}
	}

	_MakePRegexPart(regexPartString, minimumInstances, maximumInstances)
	{
		this.pregexParts[this.pregexCount++] = new PRegexPart(regexPartString, minimumInstances, maximumInstances);
		this._ResetParseVars();
	}

	_ResetParseVars() {
		this._escaped = false;
		this._bracketListOpen = this._bracketListClosed = false;
		this._partRegexString = "";
		this._minimumInstances = this._maximumInstances = -1;
		this._ResetRangeParseVars();
	}

	_ResetRangeParseVars() {
		this._rangeOpen = this._rangeClosed = false;
		this._rangeFirst = true;
		this._rangeCount = this._rangeCommas = 0;
		this._rangeValueSet = false;
		this._rangeValueString = "";
	}

	IsMatch(valueString) {
		var matched = false;
		var regexString = "";
		for (var i = 0; i < this.pregexCount && !matched; i++) {
			regexString += this.pregexParts[i].ToString();
			var finalRegexString = "^" + regexString + "$";
			var re = new RegExp(finalRegexString);
			matched = re.test(valueString);
		}
		return matched;
	}

	ToString() {
		var regexString = "";
		for (var i = 0; i < this.pregexCount; i++) {
			regexString += this.pregexParts[i].ToString();
		}
		return regexString;
	}
}