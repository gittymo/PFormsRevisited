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

		var escaped = false;
		var bracketListOpen = false;
		var bracketListClosed = false;
		var rangeOpen = false;
		var rangeClosed = false;
		var rangeFirst = true;
		var rangeCount = 0;
		var rangeValueSet = false;
		var rangeValueString = "";
		var rangeCommas = 0;

		// Remove any whitespace from either end of the regular expression string.
		regexString = regexString.trim();
		var partRegexString = "";
		var minimumInstances = -1;
		var maximumInstances = -1;

		if ((typeof regexString === 'string' || regexString instanceof String) && regexString.length > 0) {
			for (var i = 0; i < regexString.length; i++) {
				switch (regexString[i]) {
					case '\\': {
						if (!rangeOpen) escaped = !escaped;
						if (bracketListClosed || rangeClosed) {
							this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
							bracketListClosed = false;
							partRegexString = "";
							minimumInstances = 0;
							maximumInstances = 0;
							rangeOpen = rangeClosed = false;
							rangeFirst = true;
							rangeValueSet = false;
							rangeCommas = 0;
							rangeValueString = "";
						}
						partRegexString += '\\';
					} break;
					case '[': {
						if (escaped) {
							escaped = false;
							partRegexString += '[';
						} else {
							if (bracketListClosed) {
								this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
								partRegexString = "";
								minimumInstances = 0;
								maximumInstances = 0;
								rangeOpen = rangeClosed = false;
								bracketListClosed = bracketListOpen = false;
								rangeFirst = true;
								rangeValueSet = false;
								rangeCommas = 0;
								rangeValueString = "";
							}
							if (!bracketListOpen) {
								partRegexString += '[';
								bracketListOpen = true;
							} else {
								partRegexString += "\\[";
							}
						}
					} break;
					case ']': {
						if (escaped) {
							escaped = false;
							partRegexString += ']';
						} else {
							if (bracketListOpen) {
								bracketListOpen = false;
								bracketListClosed = true;
								partRegexString += ']';
							}
						}
					} break;
					case '*': {
						if (escaped) {
							escaped = false;
							partRegexString += '*';
						} else {
							if (rangeOpen) {
								if (rangeCount == 0) {
									if (rangeFirst) partRegexString += '0';
									rangeValueSet = true;
								}
							}
							if (rangeClosed || rangeCount == 0) {
								partRegexString += '*';
								this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
								partRegexString = "";
								minimumInstances = 0;
								maximumInstances = 0;
								rangeOpen = rangeClosed = false;
								bracketListClosed = bracketListOpen = false;
								rangeFirst = true;
								rangeValueSet = false;
								rangeCommas = 0;
								rangeValueString = "";
							}
						}
					} break;
					case '+': {
						if (escaped) {
							escaped = false;
							partRegexString += '+';
						} else {
							if (rangeOpen) {
								if (rangeCount == 0) {
									if (rangeFirst) partRegexString += '1';
									rangeValueSet = true;
								}
							}
							if (rangeClosed || rangeCount == 0) {
								partRegexString += '+';
								this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
								partRegexString = "";
								minimumInstances = 0;
								maximumInstances = 0;
								rangeOpen = rangeClosed = false;
								bracketListClosed = bracketListOpen = false;
								rangeFirst = true;
								rangeValueSet = false;
								rangeCommas = 0;
								rangeValueString = "";
							}
						}
					} break;
					case '?': {
						if (escaped) {
							escaped = false;
							partRegexString += '?';
						} else {
							if (rangeOpen) {
								if (rangeCount == 0) {
									if (rangeFirst) partRegexString += '0';
									else partRegexString += '1';
									rangeValueSet = true;
								}
							}
							if (rangeClosed || rangeCount == 0) {
								partRegexString += '?';
								this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
								partRegexString = "";
								minimumInstances = 0;
								maximumInstances = 0;
								rangeOpen = rangeClosed = false;
								bracketListClosed = bracketListOpen = false;
								rangeFirst = true;
								rangeValueSet = false;
								rangeCommas = 0;
								rangeValueString = "";
							}
						}
					} break;
					case '{': {
						if (escaped) {
							escaped = false;
							partRegexString += '{';
						} else {
							if (!rangeOpen) {
								if (bracketListClosed) bracketListClosed = false;
								rangeOpen = true;
								rangeClosed = false;
								rangeCount = 0;
								rangeValueSet = false;
								rangeValueString = "";
								rangeCommas = 0;
							}
						}
					} break;
					case '}': {
						if (escaped) {
							escaped = false;
							partRegexString += '}';
						} else {
							if (rangeOpen) {
								if (rangeFirst) minimumInstances = parseInt(rangeValueString);
								else maximumInstances = parseInt(rangeValueString);
								rangeValueString = "";
								rangeOpen = false;
								rangeClosed = true;
								rangeCount = 0;
								rangeFirst = true;
								rangeCommas = 0;
								rangeValueSet = false;
							} else {
								partRegexString += '}';
							}
						}
					} break;
					default: {
						if (escaped) {
							escaped = false;
							partRegexString += regexString[i];
							this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
							partRegexString = "";
							minimumInstances = 0;
							maximumInstances = 0;
							rangeOpen = rangeClosed = false;
							rangeFirst = true;
							rangeValueSet = false;
							rangeCommas = 0;
							rangeValueString = "";
							bracketListClosed = bracketListOpen = false;
						} else {
							if (bracketListClosed || rangeClosed) {
								this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
								partRegexString = "";
								minimumInstances = 0;
								maximumInstances = 0;
								rangeOpen = rangeClosed = false;
								rangeFirst = true;
								rangeValueSet = false;
								rangeCommas = 0;
								rangeValueString = "";
								bracketListClosed = bracketListOpen = false;
								i--;
							} else {
								if (rangeOpen) {
									if (regexString[i] >= '0' && regexString[i] <= '9' && !rangeValueSet) {
										rangeValueString += regexString[i];
									} else if (regexString[i] == ',') {
										if (rangeCommas == 0) {
											rangeCommas++;
											minimumInstances = parseInt(rangeValueString);
											rangeFirst = false;
											rangeValueString = "";
										}
									}
								} else {
									if (bracketListOpen) partRegexString += regexString[i];
									else {
										if (regexString[i] != '$' && regexString[i] != '^') {
											this.pregexParts[this.pregexCount++] = MakePRegexPart(regexString[i], -1, -1);
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
			if (partRegexString.length > 0) this.pregexParts[this.pregexCount++] = MakePRegexPart(partRegexString, minimumInstances, maximumInstances);
		}
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

function MakePRegexPart(regexPartString, minimumInstances, maximumInstances)
{
	return new PRegexPart(regexPartString, minimumInstances, maximumInstances);
}