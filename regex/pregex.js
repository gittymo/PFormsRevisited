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
		// A few flag members to tell us more about the regex.
		this.startFlagSet = false; // True if ^ used at start of regex.
		this.endFlagSet = false; // True if $ used at end of regex.

		// Initialise a load of variable that deal with parsing the regex.
		this._ResetParseVars();

		// Remove any whitespace from either end of the regular expression string.
		regexString = regexString.trim();

		if ((typeof regexString === 'string' || regexString instanceof String) && regexString.length > 0) {
			for (var i = 0; i < regexString.length; i++) {
				switch (regexString[i]) {
					case '\\': {
						if (!this._rangeOpen) this._escaped = !this._escaped;
						if (this._bracketListClosed || this._rangeClosed) {
							this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
						}
						this._partRegexString += '\\';
					} break;
					case '[': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '[';
						} else {
							if (this._bracketListClosed) {
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
							}
							if (!this._bracketListOpen) {
								this._partRegexString += '[';
								this._bracketListOpen = true;
							} else {
								this._partRegexString += "\\[";
							}
						}
					} break;
					case ']': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += ']';
						} else {
							if (this._bracketListOpen) {
								this._bracketListOpen = false;
								this._bracketListClosed = true;
								this._partRegexString += ']';
							}
						}
					} break;
					case '*': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '*';
						} else {
							if (this._rangeOpen) {
								if (this._rangeCount == 0) {
									if (this._rangeFirst) this._partRegexString += '0';
									this._rangeValueSet = true;
								}
							}
							if (this._rangeClosed || this._rangeCount == 0) {
								this._partRegexString += '*';
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
							}
						}
					} break;
					case '+': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '+';
						} else {
							if (this._rangeOpen) {
								if (this._rangeCount == 0) {
									if (this._rangeFirst) this._partRegexString += '1';
									this._rangeValueSet = true;
								}
							}
							if (this._rangeClosed || this._rangeCount == 0) {
								this._partRegexString += '+';
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);		
							}
						}
					} break;
					case '?': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '?';
						} else {
							if (this._rangeOpen) {
								if (this._rangeCount == 0) {
									if (this._rangeFirst) this._partRegexString += '0';
									else this._partRegexString += '1';
									this._rangeValueSet = true;
								}
							}
							if (this._rangeClosed || this._rangeCount == 0) {
								this._partRegexString += '?';
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
							}
						}
					} break;
					case '{': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '{';
						} else {
							if (!this._rangeOpen) {
								if (this._bracketListClosed) this._bracketListClosed = false;
								this._ResetRangeParseVars();
								this._rangeOpen = true;
							}
						}
					} break;
					case '}': {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += '}';
						} else {
							if (this._rangeOpen) {
								if (this._rangeFirst) this._minimumInstances = parseInt(this._rangeValueString);
								else this._maximumInstances = parseInt(this._rangeValueString);
								this._ResetRangeParseVars();
								this._rangeClosed = true;
							} else {
								this._partRegexString += '}';
							}
						}
					} break;
					default: {
						if (this._escaped) {
							this._escaped = false;
							this._partRegexString += regexString[i];
							this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
						} else {
							if (this._bracketListClosed || this._rangeClosed) {
								this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
								i--;
							} else {
								if (this._rangeOpen) {
									if (regexString[i] >= '0' && regexString[i] <= '9' && !this._rangeValueSet) {
										this._rangeValueString += regexString[i];
									} else if (regexString[i] == ',') {
										if (this._rangeCommas == 0) {
											this._rangeCommas = 1;
											this._minimumInstances = parseInt(this._rangeValueString);
											this._rangeFirst = false;
											this._rangeValueString = "";
										}
									}
								} else {
									if (this._bracketListOpen) this._partRegexString += regexString[i];
									else {
										if (regexString[i] != '$' && regexString[i] != '^') {
											this._MakePRegexPart(regexString[i], -1, -1);
										}
										if (regexString[i] == '^') this.startFlagSet = true;
										if (regexString[i] == '$') this.endFlagSet = true;
									}
								}
							}
						}
					}
				}
			}
			if (this._partRegexString.length > 0) this.pregexParts[this.pregexCount++] = 
				this._MakePRegexPart(this._partRegexString, this._minimumInstances, this._maximumInstances);
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
		var regexString = this.startFlagSet ? "^" : "";
		for (var i = 0; i < this.pregexCount && !matched; i++) {
			regexString += this.pregexParts[i].ToString();
			var finalRegexString = regexString + (this.endFlagSet ? "$" : "");
			// console.log(finalRegexString);
			var re = new RegExp(finalRegexString);
			matched = re.test(valueString);
		}
		return matched;
	}

	ToString() {
		var regexString = this.startFlagSet ? "^" : "";
		for (var i = 0; i < this.pregexCount; i++) {
			regexString += this.pregexParts[i].ToString();
		}
		if (this.endFlagSet) regexString += "$";
		return regexString;
	}
}