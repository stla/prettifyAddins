require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
/*! https://mths.be/regenerate v1.4.2 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js/io.js or Browserified code,
	// and use it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var ERRORS = {
		'rangeOrder': 'A range\u2019s `stop` value must be greater than or equal ' +
			'to the `start` value.',
		'codePointRange': 'Invalid code point value. Code points range from ' +
			'U+000000 to U+10FFFF.'
	};

	// https://mathiasbynens.be/notes/javascript-encoding#surrogate-pairs
	var HIGH_SURROGATE_MIN = 0xD800;
	var HIGH_SURROGATE_MAX = 0xDBFF;
	var LOW_SURROGATE_MIN = 0xDC00;
	var LOW_SURROGATE_MAX = 0xDFFF;

	// In Regenerate output, `\0` is never preceded by `\` because we sort by
	// code point value, so let’s keep this regular expression simple.
	var regexNull = /\\x00([^0123456789]|$)/g;

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var extend = function(destination, source) {
		var key;
		for (key in source) {
			if (hasOwnProperty.call(source, key)) {
				destination[key] = source[key];
			}
		}
		return destination;
	};

	var forEach = function(array, callback) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			callback(array[index], index);
		}
	};

	var toString = object.toString;
	var isArray = function(value) {
		return toString.call(value) == '[object Array]';
	};
	var isNumber = function(value) {
		return typeof value == 'number' ||
			toString.call(value) == '[object Number]';
	};

	// This assumes that `number` is a positive integer that `toString()`s nicely
	// (which is the case for all code point values).
	var zeroes = '0000';
	var pad = function(number, totalCharacters) {
		var string = String(number);
		return string.length < totalCharacters
			? (zeroes + string).slice(-totalCharacters)
			: string;
	};

	var hex = function(number) {
		return Number(number).toString(16).toUpperCase();
	};

	var slice = [].slice;

	/*--------------------------------------------------------------------------*/

	var dataFromCodePoints = function(codePoints) {
		var index = -1;
		var length = codePoints.length;
		var max = length - 1;
		var result = [];
		var isStart = true;
		var tmp;
		var previous = 0;
		while (++index < length) {
			tmp = codePoints[index];
			if (isStart) {
				result.push(tmp);
				previous = tmp;
				isStart = false;
			} else {
				if (tmp == previous + 1) {
					if (index != max) {
						previous = tmp;
						continue;
					} else {
						isStart = true;
						result.push(tmp + 1);
					}
				} else {
					// End the previous range and start a new one.
					result.push(previous + 1, tmp);
					previous = tmp;
				}
			}
		}
		if (!isStart) {
			result.push(tmp + 1);
		}
		return result;
	};

	var dataRemove = function(data, codePoint) {
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var length = data.length;
		while (index < length) {
			start = data[index];
			end = data[index + 1];
			if (codePoint >= start && codePoint < end) {
				// Modify this pair.
				if (codePoint == start) {
					if (end == start + 1) {
						// Just remove `start` and `end`.
						data.splice(index, 2);
						return data;
					} else {
						// Just replace `start` with a new value.
						data[index] = codePoint + 1;
						return data;
					}
				} else if (codePoint == end - 1) {
					// Just replace `end` with a new value.
					data[index + 1] = codePoint;
					return data;
				} else {
					// Replace `[start, end]` with `[startA, endA, startB, endB]`.
					data.splice(index, 2, start, codePoint, codePoint + 1, end);
					return data;
				}
			}
			index += 2;
		}
		return data;
	};

	var dataRemoveRange = function(data, rangeStart, rangeEnd) {
		if (rangeEnd < rangeStart) {
			throw Error(ERRORS.rangeOrder);
		}
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		while (index < data.length) {
			start = data[index];
			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.

			// Exit as soon as no more matching pairs can be found.
			if (start > rangeEnd) {
				return data;
			}

			// Check if this range pair is equal to, or forms a subset of, the range
			// to be removed.
			// E.g. we have `[0, 11, 40, 51]` and want to remove 0-10 → `[40, 51]`.
			// E.g. we have `[40, 51]` and want to remove 0-100 → `[]`.
			if (rangeStart <= start && rangeEnd >= end) {
				// Remove this pair.
				data.splice(index, 2);
				continue;
			}

			// Check if both `rangeStart` and `rangeEnd` are within the bounds of
			// this pair.
			// E.g. we have `[0, 11]` and want to remove 4-6 → `[0, 4, 7, 11]`.
			if (rangeStart >= start && rangeEnd < end) {
				if (rangeStart == start) {
					// Replace `[start, end]` with `[startB, endB]`.
					data[index] = rangeEnd + 1;
					data[index + 1] = end + 1;
					return data;
				}
				// Replace `[start, end]` with `[startA, endA, startB, endB]`.
				data.splice(index, 2, start, rangeStart, rangeEnd + 1, end + 1);
				return data;
			}

			// Check if only `rangeStart` is within the bounds of this pair.
			// E.g. we have `[0, 11]` and want to remove 4-20 → `[0, 4]`.
			if (rangeStart >= start && rangeStart <= end) {
				// Replace `end` with `rangeStart`.
				data[index + 1] = rangeStart;
				// Note: we cannot `return` just yet, in case any following pairs still
				// contain matching code points.
				// E.g. we have `[0, 11, 14, 31]` and want to remove 4-20
				// → `[0, 4, 21, 31]`.
			}

			// Check if only `rangeEnd` is within the bounds of this pair.
			// E.g. we have `[14, 31]` and want to remove 4-20 → `[21, 31]`.
			else if (rangeEnd >= start && rangeEnd <= end) {
				// Just replace `start`.
				data[index] = rangeEnd + 1;
				return data;
			}

			index += 2;
		}
		return data;
	};

	 var dataAdd = function(data, codePoint) {
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var lastIndex = null;
		var length = data.length;
		if (codePoint < 0x0 || codePoint > 0x10FFFF) {
			throw RangeError(ERRORS.codePointRange);
		}
		while (index < length) {
			start = data[index];
			end = data[index + 1];

			// Check if the code point is already in the set.
			if (codePoint >= start && codePoint < end) {
				return data;
			}

			if (codePoint == start - 1) {
				// Just replace `start` with a new value.
				data[index] = codePoint;
				return data;
			}

			// At this point, if `start` is `greater` than `codePoint`, insert a new
			// `[start, end]` pair before the current pair, or after the current pair
			// if there is a known `lastIndex`.
			if (start > codePoint) {
				data.splice(
					lastIndex != null ? lastIndex + 2 : 0,
					0,
					codePoint,
					codePoint + 1
				);
				return data;
			}

			if (codePoint == end) {
				// Check if adding this code point causes two separate ranges to become
				// a single range, e.g. `dataAdd([0, 4, 5, 10], 4)` → `[0, 10]`.
				if (codePoint + 1 == data[index + 2]) {
					data.splice(index, 4, start, data[index + 3]);
					return data;
				}
				// Else, just replace `end` with a new value.
				data[index + 1] = codePoint + 1;
				return data;
			}
			lastIndex = index;
			index += 2;
		}
		// The loop has finished; add the new pair to the end of the data set.
		data.push(codePoint, codePoint + 1);
		return data;
	};

	var dataAddData = function(dataA, dataB) {
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var data = dataA.slice();
		var length = dataB.length;
		while (index < length) {
			start = dataB[index];
			end = dataB[index + 1] - 1;
			if (start == end) {
				data = dataAdd(data, start);
			} else {
				data = dataAddRange(data, start, end);
			}
			index += 2;
		}
		return data;
	};

	var dataRemoveData = function(dataA, dataB) {
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var data = dataA.slice();
		var length = dataB.length;
		while (index < length) {
			start = dataB[index];
			end = dataB[index + 1] - 1;
			if (start == end) {
				data = dataRemove(data, start);
			} else {
				data = dataRemoveRange(data, start, end);
			}
			index += 2;
		}
		return data;
	};

	var dataAddRange = function(data, rangeStart, rangeEnd) {
		if (rangeEnd < rangeStart) {
			throw Error(ERRORS.rangeOrder);
		}
		if (
			rangeStart < 0x0 || rangeStart > 0x10FFFF ||
			rangeEnd < 0x0 || rangeEnd > 0x10FFFF
		) {
			throw RangeError(ERRORS.codePointRange);
		}
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var added = false;
		var length = data.length;
		while (index < length) {
			start = data[index];
			end = data[index + 1];

			if (added) {
				// The range has already been added to the set; at this point, we just
				// need to get rid of the following ranges in case they overlap.

				// Check if this range can be combined with the previous range.
				if (start == rangeEnd + 1) {
					data.splice(index - 1, 2);
					return data;
				}

				// Exit as soon as no more possibly overlapping pairs can be found.
				if (start > rangeEnd) {
					return data;
				}

				// E.g. `[0, 11, 12, 16]` and we’ve added 5-15, so we now have
				// `[0, 16, 12, 16]`. Remove the `12,16` part, as it lies within the
				// `0,16` range that was previously added.
				if (start >= rangeStart && start <= rangeEnd) {
					// `start` lies within the range that was previously added.

					if (end > rangeStart && end - 1 <= rangeEnd) {
						// `end` lies within the range that was previously added as well,
						// so remove this pair.
						data.splice(index, 2);
						index -= 2;
						// Note: we cannot `return` just yet, as there may still be other
						// overlapping pairs.
					} else {
						// `start` lies within the range that was previously added, but
						// `end` doesn’t. E.g. `[0, 11, 12, 31]` and we’ve added 5-15, so
						// now we have `[0, 16, 12, 31]`. This must be written as `[0, 31]`.
						// Remove the previously added `end` and the current `start`.
						data.splice(index - 1, 2);
						index -= 2;
					}

					// Note: we cannot return yet.
				}

			}

			else if (start == rangeEnd + 1 || start == rangeEnd) {
				data[index] = rangeStart;
				return data;
			}

			// Check if a new pair must be inserted *before* the current one.
			else if (start > rangeEnd) {
				data.splice(index, 0, rangeStart, rangeEnd + 1);
				return data;
			}

			else if (rangeStart >= start && rangeStart < end && rangeEnd + 1 <= end) {
				// The new range lies entirely within an existing range pair. No action
				// needed.
				return data;
			}

			else if (
				// E.g. `[0, 11]` and you add 5-15 → `[0, 16]`.
				(rangeStart >= start && rangeStart < end) ||
				// E.g. `[0, 3]` and you add 3-6 → `[0, 7]`.
				end == rangeStart
			) {
				// Replace `end` with the new value.
				data[index + 1] = rangeEnd + 1;
				// Make sure the next range pair doesn’t overlap, e.g. `[0, 11, 12, 14]`
				// and you add 5-15 → `[0, 16]`, i.e. remove the `12,14` part.
				added = true;
				// Note: we cannot `return` just yet.
			}

			else if (rangeStart <= start && rangeEnd + 1 >= end) {
				// The new range is a superset of the old range.
				data[index] = rangeStart;
				data[index + 1] = rangeEnd + 1;
				added = true;
			}

			index += 2;
		}
		// The loop has finished without doing anything; add the new pair to the end
		// of the data set.
		if (!added) {
			data.push(rangeStart, rangeEnd + 1);
		}
		return data;
	};

	var dataContains = function(data, codePoint) {
		var index = 0;
		var length = data.length;
		// Exit early if `codePoint` is not within `data`’s overall range.
		var start = data[index];
		var end = data[length - 1];
		if (length >= 2) {
			if (codePoint < start || codePoint > end) {
				return false;
			}
		}
		// Iterate over the data per `(start, end)` pair.
		while (index < length) {
			start = data[index];
			end = data[index + 1];
			if (codePoint >= start && codePoint < end) {
				return true;
			}
			index += 2;
		}
		return false;
	};

	var dataIntersection = function(data, codePoints) {
		var index = 0;
		var length = codePoints.length;
		var codePoint;
		var result = [];
		while (index < length) {
			codePoint = codePoints[index];
			if (dataContains(data, codePoint)) {
				result.push(codePoint);
			}
			++index;
		}
		return dataFromCodePoints(result);
	};

	var dataIsEmpty = function(data) {
		return !data.length;
	};

	var dataIsSingleton = function(data) {
		// Check if the set only represents a single code point.
		return data.length == 2 && data[0] + 1 == data[1];
	};

	var dataToArray = function(data) {
		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var result = [];
		var length = data.length;
		while (index < length) {
			start = data[index];
			end = data[index + 1];
			while (start < end) {
				result.push(start);
				++start;
			}
			index += 2;
		}
		return result;
	};

	/*--------------------------------------------------------------------------*/

	// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	var floor = Math.floor;
	var highSurrogate = function(codePoint) {
		return parseInt(
			floor((codePoint - 0x10000) / 0x400) + HIGH_SURROGATE_MIN,
			10
		);
	};

	var lowSurrogate = function(codePoint) {
		return parseInt(
			(codePoint - 0x10000) % 0x400 + LOW_SURROGATE_MIN,
			10
		);
	};

	var stringFromCharCode = String.fromCharCode;
	var codePointToString = function(codePoint) {
		var string;
		// https://mathiasbynens.be/notes/javascript-escapes#single
		// Note: the `\b` escape sequence for U+0008 BACKSPACE in strings has a
		// different meaning in regular expressions (word boundary), so it cannot
		// be used here.
		if (codePoint == 0x09) {
			string = '\\t';
		}
		// Note: IE < 9 treats `'\v'` as `'v'`, so avoid using it.
		// else if (codePoint == 0x0B) {
		// 	string = '\\v';
		// }
		else if (codePoint == 0x0A) {
			string = '\\n';
		}
		else if (codePoint == 0x0C) {
			string = '\\f';
		}
		else if (codePoint == 0x0D) {
			string = '\\r';
		}
		else if (codePoint == 0x2D) {
			// https://mathiasbynens.be/notes/javascript-escapes#hexadecimal
			// Note: `-` (U+002D HYPHEN-MINUS) is escaped in this way rather
			// than by backslash-escaping, in case the output is used outside
			// of a character class in a `u` RegExp. /\-/u throws, but
			// /\x2D/u is fine.
			string = '\\x2D';
		}
		else if (codePoint == 0x5C) {
			string = '\\\\';
		}
		else if (
			codePoint == 0x24 ||
			(codePoint >= 0x28 && codePoint <= 0x2B) ||
			codePoint == 0x2E || codePoint == 0x2F ||
			codePoint == 0x3F ||
			(codePoint >= 0x5B && codePoint <= 0x5E) ||
			(codePoint >= 0x7B && codePoint <= 0x7D)
		) {
			// The code point maps to an unsafe printable ASCII character;
			// backslash-escape it. Here’s the list of those symbols:
			//
			//     $()*+./?[\]^{|}
			//
			// This matches SyntaxCharacters as well as `/` (U+002F SOLIDUS).
			// https://tc39.github.io/ecma262/#prod-SyntaxCharacter
			string = '\\' + stringFromCharCode(codePoint);
		}
		else if (codePoint >= 0x20 && codePoint <= 0x7E) {
			// The code point maps to one of these printable ASCII symbols
			// (including the space character):
			//
			//      !"#%&',/0123456789:;<=>@ABCDEFGHIJKLMNO
			//     PQRSTUVWXYZ_`abcdefghijklmnopqrstuvwxyz~
			//
			// These can safely be used directly.
			string = stringFromCharCode(codePoint);
		}
		else if (codePoint <= 0xFF) {
			string = '\\x' + pad(hex(codePoint), 2);
		}
		else { // `codePoint <= 0xFFFF` holds true.
			// https://mathiasbynens.be/notes/javascript-escapes#unicode
			string = '\\u' + pad(hex(codePoint), 4);
		}

		// There’s no need to account for astral symbols / surrogate pairs here,
		// since `codePointToString` is private and only used for BMP code points.
		// But if that’s what you need, just add an `else` block with this code:
		//
		//     string = '\\u' + pad(hex(highSurrogate(codePoint)), 4)
		//     	+ '\\u' + pad(hex(lowSurrogate(codePoint)), 4);

		return string;
	};

	var codePointToStringUnicode = function(codePoint) {
		if (codePoint <= 0xFFFF) {
			return codePointToString(codePoint);
		}
		return '\\u{' + codePoint.toString(16).toUpperCase() + '}';
	};

	var symbolToCodePoint = function(symbol) {
		var length = symbol.length;
		var first = symbol.charCodeAt(0);
		var second;
		if (
			first >= HIGH_SURROGATE_MIN && first <= HIGH_SURROGATE_MAX &&
			length > 1 // There is a next code unit.
		) {
			// `first` is a high surrogate, and there is a next character. Assume
			// it’s a low surrogate (else it’s invalid usage of Regenerate anyway).
			second = symbol.charCodeAt(1);
			// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
			return (first - HIGH_SURROGATE_MIN) * 0x400 +
				second - LOW_SURROGATE_MIN + 0x10000;
		}
		return first;
	};

	var createBMPCharacterClasses = function(data) {
		// Iterate over the data per `(start, end)` pair.
		var result = '';
		var index = 0;
		var start;
		var end;
		var length = data.length;
		if (dataIsSingleton(data)) {
			return codePointToString(data[0]);
		}
		while (index < length) {
			start = data[index];
			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.
			if (start == end) {
				result += codePointToString(start);
			} else if (start + 1 == end) {
				result += codePointToString(start) + codePointToString(end);
			} else {
				result += codePointToString(start) + '-' + codePointToString(end);
			}
			index += 2;
		}
		return '[' + result + ']';
	};

	var createUnicodeCharacterClasses = function(data) {
		// Iterate over the data per `(start, end)` pair.
		var result = '';
		var index = 0;
		var start;
		var end;
		var length = data.length;
		if (dataIsSingleton(data)) {
			return codePointToStringUnicode(data[0]);
		}
		while (index < length) {
			start = data[index];
			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.
			if (start == end) {
				result += codePointToStringUnicode(start);
			} else if (start + 1 == end) {
				result += codePointToStringUnicode(start) + codePointToStringUnicode(end);
			} else {
				result += codePointToStringUnicode(start) + '-' + codePointToStringUnicode(end);
			}
			index += 2;
		}
		return '[' + result + ']';
	};

	var splitAtBMP = function(data) {
		// Iterate over the data per `(start, end)` pair.
		var loneHighSurrogates = [];
		var loneLowSurrogates = [];
		var bmp = [];
		var astral = [];
		var index = 0;
		var start;
		var end;
		var length = data.length;
		while (index < length) {
			start = data[index];
			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.

			if (start < HIGH_SURROGATE_MIN) {

				// The range starts and ends before the high surrogate range.
				// E.g. (0, 0x10).
				if (end < HIGH_SURROGATE_MIN) {
					bmp.push(start, end + 1);
				}

				// The range starts before the high surrogate range and ends within it.
				// E.g. (0, 0xD855).
				if (end >= HIGH_SURROGATE_MIN && end <= HIGH_SURROGATE_MAX) {
					bmp.push(start, HIGH_SURROGATE_MIN);
					loneHighSurrogates.push(HIGH_SURROGATE_MIN, end + 1);
				}

				// The range starts before the high surrogate range and ends in the low
				// surrogate range. E.g. (0, 0xDCFF).
				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
					bmp.push(start, HIGH_SURROGATE_MIN);
					loneHighSurrogates.push(HIGH_SURROGATE_MIN, HIGH_SURROGATE_MAX + 1);
					loneLowSurrogates.push(LOW_SURROGATE_MIN, end + 1);
				}

				// The range starts before the high surrogate range and ends after the
				// low surrogate range. E.g. (0, 0x10FFFF).
				if (end > LOW_SURROGATE_MAX) {
					bmp.push(start, HIGH_SURROGATE_MIN);
					loneHighSurrogates.push(HIGH_SURROGATE_MIN, HIGH_SURROGATE_MAX + 1);
					loneLowSurrogates.push(LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1);
					if (end <= 0xFFFF) {
						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
					} else {
						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
						astral.push(0xFFFF + 1, end + 1);
					}
				}

			} else if (start >= HIGH_SURROGATE_MIN && start <= HIGH_SURROGATE_MAX) {

				// The range starts and ends in the high surrogate range.
				// E.g. (0xD855, 0xD866).
				if (end >= HIGH_SURROGATE_MIN && end <= HIGH_SURROGATE_MAX) {
					loneHighSurrogates.push(start, end + 1);
				}

				// The range starts in the high surrogate range and ends in the low
				// surrogate range. E.g. (0xD855, 0xDCFF).
				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
					loneHighSurrogates.push(start, HIGH_SURROGATE_MAX + 1);
					loneLowSurrogates.push(LOW_SURROGATE_MIN, end + 1);
				}

				// The range starts in the high surrogate range and ends after the low
				// surrogate range. E.g. (0xD855, 0x10FFFF).
				if (end > LOW_SURROGATE_MAX) {
					loneHighSurrogates.push(start, HIGH_SURROGATE_MAX + 1);
					loneLowSurrogates.push(LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1);
					if (end <= 0xFFFF) {
						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
					} else {
						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
						astral.push(0xFFFF + 1, end + 1);
					}
				}

			} else if (start >= LOW_SURROGATE_MIN && start <= LOW_SURROGATE_MAX) {

				// The range starts and ends in the low surrogate range.
				// E.g. (0xDCFF, 0xDDFF).
				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
					loneLowSurrogates.push(start, end + 1);
				}

				// The range starts in the low surrogate range and ends after the low
				// surrogate range. E.g. (0xDCFF, 0x10FFFF).
				if (end > LOW_SURROGATE_MAX) {
					loneLowSurrogates.push(start, LOW_SURROGATE_MAX + 1);
					if (end <= 0xFFFF) {
						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
					} else {
						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
						astral.push(0xFFFF + 1, end + 1);
					}
				}

			} else if (start > LOW_SURROGATE_MAX && start <= 0xFFFF) {

				// The range starts and ends after the low surrogate range.
				// E.g. (0xFFAA, 0x10FFFF).
				if (end <= 0xFFFF) {
					bmp.push(start, end + 1);
				} else {
					bmp.push(start, 0xFFFF + 1);
					astral.push(0xFFFF + 1, end + 1);
				}

			} else {

				// The range starts and ends in the astral range.
				astral.push(start, end + 1);

			}

			index += 2;
		}
		return {
			'loneHighSurrogates': loneHighSurrogates,
			'loneLowSurrogates': loneLowSurrogates,
			'bmp': bmp,
			'astral': astral
		};
	};

	var optimizeSurrogateMappings = function(surrogateMappings) {
		var result = [];
		var tmpLow = [];
		var addLow = false;
		var mapping;
		var nextMapping;
		var highSurrogates;
		var lowSurrogates;
		var nextHighSurrogates;
		var nextLowSurrogates;
		var index = -1;
		var length = surrogateMappings.length;
		while (++index < length) {
			mapping = surrogateMappings[index];
			nextMapping = surrogateMappings[index + 1];
			if (!nextMapping) {
				result.push(mapping);
				continue;
			}
			highSurrogates = mapping[0];
			lowSurrogates = mapping[1];
			nextHighSurrogates = nextMapping[0];
			nextLowSurrogates = nextMapping[1];

			// Check for identical high surrogate ranges.
			tmpLow = lowSurrogates;
			while (
				nextHighSurrogates &&
				highSurrogates[0] == nextHighSurrogates[0] &&
				highSurrogates[1] == nextHighSurrogates[1]
			) {
				// Merge with the next item.
				if (dataIsSingleton(nextLowSurrogates)) {
					tmpLow = dataAdd(tmpLow, nextLowSurrogates[0]);
				} else {
					tmpLow = dataAddRange(
						tmpLow,
						nextLowSurrogates[0],
						nextLowSurrogates[1] - 1
					);
				}
				++index;
				mapping = surrogateMappings[index];
				highSurrogates = mapping[0];
				lowSurrogates = mapping[1];
				nextMapping = surrogateMappings[index + 1];
				nextHighSurrogates = nextMapping && nextMapping[0];
				nextLowSurrogates = nextMapping && nextMapping[1];
				addLow = true;
			}
			result.push([
				highSurrogates,
				addLow ? tmpLow : lowSurrogates
			]);
			addLow = false;
		}
		return optimizeByLowSurrogates(result);
	};

	var optimizeByLowSurrogates = function(surrogateMappings) {
		if (surrogateMappings.length == 1) {
			return surrogateMappings;
		}
		var index = -1;
		var innerIndex = -1;
		while (++index < surrogateMappings.length) {
			var mapping = surrogateMappings[index];
			var lowSurrogates = mapping[1];
			var lowSurrogateStart = lowSurrogates[0];
			var lowSurrogateEnd = lowSurrogates[1];
			innerIndex = index; // Note: the loop starts at the next index.
			while (++innerIndex < surrogateMappings.length) {
				var otherMapping = surrogateMappings[innerIndex];
				var otherLowSurrogates = otherMapping[1];
				var otherLowSurrogateStart = otherLowSurrogates[0];
				var otherLowSurrogateEnd = otherLowSurrogates[1];
				if (
					lowSurrogateStart == otherLowSurrogateStart &&
					lowSurrogateEnd == otherLowSurrogateEnd &&
					otherLowSurrogates.length === 2
				) {
					// Add the code points in the other item to this one.
					if (dataIsSingleton(otherMapping[0])) {
						mapping[0] = dataAdd(mapping[0], otherMapping[0][0]);
					} else {
						mapping[0] = dataAddRange(
							mapping[0],
							otherMapping[0][0],
							otherMapping[0][1] - 1
						);
					}
					// Remove the other, now redundant, item.
					surrogateMappings.splice(innerIndex, 1);
					--innerIndex;
				}
			}
		}
		return surrogateMappings;
	};

	var surrogateSet = function(data) {
		// Exit early if `data` is an empty set.
		if (!data.length) {
			return [];
		}

		// Iterate over the data per `(start, end)` pair.
		var index = 0;
		var start;
		var end;
		var startHigh;
		var startLow;
		var endHigh;
		var endLow;
		var surrogateMappings = [];
		var length = data.length;
		while (index < length) {
			start = data[index];
			end = data[index + 1] - 1;

			startHigh = highSurrogate(start);
			startLow = lowSurrogate(start);
			endHigh = highSurrogate(end);
			endLow = lowSurrogate(end);

			var startsWithLowestLowSurrogate = startLow == LOW_SURROGATE_MIN;
			var endsWithHighestLowSurrogate = endLow == LOW_SURROGATE_MAX;
			var complete = false;

			// Append the previous high-surrogate-to-low-surrogate mappings.
			// Step 1: `(startHigh, startLow)` to `(startHigh, LOW_SURROGATE_MAX)`.
			if (
				startHigh == endHigh ||
				startsWithLowestLowSurrogate && endsWithHighestLowSurrogate
			) {
				surrogateMappings.push([
					[startHigh, endHigh + 1],
					[startLow, endLow + 1]
				]);
				complete = true;
			} else {
				surrogateMappings.push([
					[startHigh, startHigh + 1],
					[startLow, LOW_SURROGATE_MAX + 1]
				]);
			}

			// Step 2: `(startHigh + 1, LOW_SURROGATE_MIN)` to
			// `(endHigh - 1, LOW_SURROGATE_MAX)`.
			if (!complete && startHigh + 1 < endHigh) {
				if (endsWithHighestLowSurrogate) {
					// Combine step 2 and step 3.
					surrogateMappings.push([
						[startHigh + 1, endHigh + 1],
						[LOW_SURROGATE_MIN, endLow + 1]
					]);
					complete = true;
				} else {
					surrogateMappings.push([
						[startHigh + 1, endHigh],
						[LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1]
					]);
				}
			}

			// Step 3. `(endHigh, LOW_SURROGATE_MIN)` to `(endHigh, endLow)`.
			if (!complete) {
				surrogateMappings.push([
					[endHigh, endHigh + 1],
					[LOW_SURROGATE_MIN, endLow + 1]
				]);
			}

			index += 2;
		}

		// The format of `surrogateMappings` is as follows:
		//
		//     [ surrogateMapping1, surrogateMapping2 ]
		//
		// i.e.:
		//
		//     [
		//       [ highSurrogates1, lowSurrogates1 ],
		//       [ highSurrogates2, lowSurrogates2 ]
		//     ]
		return optimizeSurrogateMappings(surrogateMappings);
	};

	var createSurrogateCharacterClasses = function(surrogateMappings) {
		var result = [];
		forEach(surrogateMappings, function(surrogateMapping) {
			var highSurrogates = surrogateMapping[0];
			var lowSurrogates = surrogateMapping[1];
			result.push(
				createBMPCharacterClasses(highSurrogates) +
				createBMPCharacterClasses(lowSurrogates)
			);
		});
		return result.join('|');
	};

	var createCharacterClassesFromData = function(data, bmpOnly, hasUnicodeFlag) {
		if (hasUnicodeFlag) {
			return createUnicodeCharacterClasses(data);
		}
		var result = [];

		var parts = splitAtBMP(data);
		var loneHighSurrogates = parts.loneHighSurrogates;
		var loneLowSurrogates = parts.loneLowSurrogates;
		var bmp = parts.bmp;
		var astral = parts.astral;
		var hasLoneHighSurrogates = !dataIsEmpty(loneHighSurrogates);
		var hasLoneLowSurrogates = !dataIsEmpty(loneLowSurrogates);

		var surrogateMappings = surrogateSet(astral);

		if (bmpOnly) {
			bmp = dataAddData(bmp, loneHighSurrogates);
			hasLoneHighSurrogates = false;
			bmp = dataAddData(bmp, loneLowSurrogates);
			hasLoneLowSurrogates = false;
		}

		if (!dataIsEmpty(bmp)) {
			// The data set contains BMP code points that are not high surrogates
			// needed for astral code points in the set.
			result.push(createBMPCharacterClasses(bmp));
		}
		if (surrogateMappings.length) {
			// The data set contains astral code points; append character classes
			// based on their surrogate pairs.
			result.push(createSurrogateCharacterClasses(surrogateMappings));
		}
		// https://gist.github.com/mathiasbynens/bbe7f870208abcfec860
		if (hasLoneHighSurrogates) {
			result.push(
				createBMPCharacterClasses(loneHighSurrogates) +
				// Make sure the high surrogates aren’t part of a surrogate pair.
				'(?![\\uDC00-\\uDFFF])'
			);
		}
		if (hasLoneLowSurrogates) {
			result.push(
				// It is not possible to accurately assert the low surrogates aren’t
				// part of a surrogate pair, since JavaScript regular expressions do
				// not support lookbehind.
				'(?:[^\\uD800-\\uDBFF]|^)' +
				createBMPCharacterClasses(loneLowSurrogates)
			);
		}
		return result.join('|');
	};

	/*--------------------------------------------------------------------------*/

	// `regenerate` can be used as a constructor (and new methods can be added to
	// its prototype) but also as a regular function, the latter of which is the
	// documented and most common usage. For that reason, it’s not capitalized.
	var regenerate = function(value) {
		if (arguments.length > 1) {
			value = slice.call(arguments);
		}
		if (this instanceof regenerate) {
			this.data = [];
			return value ? this.add(value) : this;
		}
		return (new regenerate).add(value);
	};

	regenerate.version = '1.4.2';

	var proto = regenerate.prototype;
	extend(proto, {
		'add': function(value) {
			var $this = this;
			if (value == null) {
				return $this;
			}
			if (value instanceof regenerate) {
				// Allow passing other Regenerate instances.
				$this.data = dataAddData($this.data, value.data);
				return $this;
			}
			if (arguments.length > 1) {
				value = slice.call(arguments);
			}
			if (isArray(value)) {
				forEach(value, function(item) {
					$this.add(item);
				});
				return $this;
			}
			$this.data = dataAdd(
				$this.data,
				isNumber(value) ? value : symbolToCodePoint(value)
			);
			return $this;
		},
		'remove': function(value) {
			var $this = this;
			if (value == null) {
				return $this;
			}
			if (value instanceof regenerate) {
				// Allow passing other Regenerate instances.
				$this.data = dataRemoveData($this.data, value.data);
				return $this;
			}
			if (arguments.length > 1) {
				value = slice.call(arguments);
			}
			if (isArray(value)) {
				forEach(value, function(item) {
					$this.remove(item);
				});
				return $this;
			}
			$this.data = dataRemove(
				$this.data,
				isNumber(value) ? value : symbolToCodePoint(value)
			);
			return $this;
		},
		'addRange': function(start, end) {
			var $this = this;
			$this.data = dataAddRange($this.data,
				isNumber(start) ? start : symbolToCodePoint(start),
				isNumber(end) ? end : symbolToCodePoint(end)
			);
			return $this;
		},
		'removeRange': function(start, end) {
			var $this = this;
			var startCodePoint = isNumber(start) ? start : symbolToCodePoint(start);
			var endCodePoint = isNumber(end) ? end : symbolToCodePoint(end);
			$this.data = dataRemoveRange(
				$this.data,
				startCodePoint,
				endCodePoint
			);
			return $this;
		},
		'intersection': function(argument) {
			var $this = this;
			// Allow passing other Regenerate instances.
			// TODO: Optimize this by writing and using `dataIntersectionData()`.
			var array = argument instanceof regenerate ?
				dataToArray(argument.data) :
				argument;
			$this.data = dataIntersection($this.data, array);
			return $this;
		},
		'contains': function(codePoint) {
			return dataContains(
				this.data,
				isNumber(codePoint) ? codePoint : symbolToCodePoint(codePoint)
			);
		},
		'clone': function() {
			var set = new regenerate;
			set.data = this.data.slice(0);
			return set;
		},
		'toString': function(options) {
			var result = createCharacterClassesFromData(
				this.data,
				options ? options.bmpOnly : false,
				options ? options.hasUnicodeFlag : false
			);
			if (!result) {
				// For an empty set, return something that can be inserted `/here/` to
				// form a valid regular expression. Avoid `(?:)` since that matches the
				// empty string.
				return '[]';
			}
			// Use `\0` instead of `\x00` where possible.
			return result.replace(regexNull, '\\0$1');
		},
		'toRegExp': function(flags) {
			var pattern = this.toString(
				flags && flags.indexOf('u') != -1 ?
					{ 'hasUnicodeFlag': true } :
					null
			);
			return RegExp(pattern, flags || '');
		},
		'valueOf': function() { // Note: `valueOf` is aliased as `toArray`.
			return dataToArray(this.data);
		}
	});

	proto.toArray = proto.valueOf;

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return regenerate;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = regenerate;
		} else { // in Narwhal or RingoJS v0.7.0-
			freeExports.regenerate = regenerate;
		}
	} else { // in Rhino or a web browser
		root.regenerate = regenerate;
	}

}(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
// Generated using `npm run build`. Do not edit.
'use strict';

const regenerate = require('regenerate');

exports.REGULAR = new Map([
	['d', regenerate()
		.addRange(0x30, 0x39)],
	['D', regenerate()
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0xFFFF)],
	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
		.addRange(0x9, 0xD)
		.addRange(0x2000, 0x200A)
		.addRange(0x2028, 0x2029)],
	['S', regenerate()
		.addRange(0x0, 0x8)
		.addRange(0xE, 0x1F)
		.addRange(0x21, 0x9F)
		.addRange(0xA1, 0x167F)
		.addRange(0x1681, 0x1FFF)
		.addRange(0x200B, 0x2027)
		.addRange(0x202A, 0x202E)
		.addRange(0x2030, 0x205E)
		.addRange(0x2060, 0x2FFF)
		.addRange(0x3001, 0xFEFE)
		.addRange(0xFF00, 0xFFFF)],
	['w', regenerate(0x5F)
		.addRange(0x30, 0x39)
		.addRange(0x41, 0x5A)
		.addRange(0x61, 0x7A)],
	['W', regenerate(0x60)
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0x40)
		.addRange(0x5B, 0x5E)
		.addRange(0x7B, 0xFFFF)]
]);

exports.UNICODE = new Map([
	['d', regenerate()
		.addRange(0x30, 0x39)],
	['D', regenerate()
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0x10FFFF)],
	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
		.addRange(0x9, 0xD)
		.addRange(0x2000, 0x200A)
		.addRange(0x2028, 0x2029)],
	['S', regenerate()
		.addRange(0x0, 0x8)
		.addRange(0xE, 0x1F)
		.addRange(0x21, 0x9F)
		.addRange(0xA1, 0x167F)
		.addRange(0x1681, 0x1FFF)
		.addRange(0x200B, 0x2027)
		.addRange(0x202A, 0x202E)
		.addRange(0x2030, 0x205E)
		.addRange(0x2060, 0x2FFF)
		.addRange(0x3001, 0xFEFE)
		.addRange(0xFF00, 0x10FFFF)],
	['w', regenerate(0x5F)
		.addRange(0x30, 0x39)
		.addRange(0x41, 0x5A)
		.addRange(0x61, 0x7A)],
	['W', regenerate(0x60)
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0x40)
		.addRange(0x5B, 0x5E)
		.addRange(0x7B, 0x10FFFF)]
]);

exports.UNICODE_IGNORE_CASE = new Map([
	['d', regenerate()
		.addRange(0x30, 0x39)],
	['D', regenerate()
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0x10FFFF)],
	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
		.addRange(0x9, 0xD)
		.addRange(0x2000, 0x200A)
		.addRange(0x2028, 0x2029)],
	['S', regenerate()
		.addRange(0x0, 0x8)
		.addRange(0xE, 0x1F)
		.addRange(0x21, 0x9F)
		.addRange(0xA1, 0x167F)
		.addRange(0x1681, 0x1FFF)
		.addRange(0x200B, 0x2027)
		.addRange(0x202A, 0x202E)
		.addRange(0x2030, 0x205E)
		.addRange(0x2060, 0x2FFF)
		.addRange(0x3001, 0xFEFE)
		.addRange(0xFF00, 0x10FFFF)],
	['w', regenerate(0x5F, 0x17F, 0x212A)
		.addRange(0x30, 0x39)
		.addRange(0x41, 0x5A)
		.addRange(0x61, 0x7A)],
	['W', regenerate(0x60)
		.addRange(0x0, 0x2F)
		.addRange(0x3A, 0x40)
		.addRange(0x5B, 0x5E)
		.addRange(0x7B, 0x17E)
		.addRange(0x180, 0x2129)
		.addRange(0x212B, 0x10FFFF)]
]);

},{"regenerate":1}],3:[function(require,module,exports){
module.exports = new Map([
	[0x4B, 0x212A],
	[0x53, 0x17F],
	[0x6B, 0x212A],
	[0x73, 0x17F],
	[0xB5, 0x39C],
	[0xC5, 0x212B],
	[0xDF, 0x1E9E],
	[0xE5, 0x212B],
	[0x17F, 0x53],
	[0x1C4, 0x1C5],
	[0x1C5, 0x1C4],
	[0x1C7, 0x1C8],
	[0x1C8, 0x1C7],
	[0x1CA, 0x1CB],
	[0x1CB, 0x1CA],
	[0x1F1, 0x1F2],
	[0x1F2, 0x1F1],
	[0x345, 0x1FBE],
	[0x392, 0x3D0],
	[0x395, 0x3F5],
	[0x398, 0x3F4],
	[0x399, 0x1FBE],
	[0x39A, 0x3F0],
	[0x39C, 0xB5],
	[0x3A0, 0x3D6],
	[0x3A1, 0x3F1],
	[0x3A3, 0x3C2],
	[0x3A6, 0x3D5],
	[0x3A9, 0x2126],
	[0x3B8, 0x3F4],
	[0x3C2, 0x3A3],
	[0x3C9, 0x2126],
	[0x3D0, 0x392],
	[0x3D1, 0x3F4],
	[0x3D5, 0x3A6],
	[0x3D6, 0x3A0],
	[0x3F0, 0x39A],
	[0x3F1, 0x3A1],
	[0x3F4, [
		0x398,
		0x3D1,
		0x3B8
	]],
	[0x3F5, 0x395],
	[0x412, 0x1C80],
	[0x414, 0x1C81],
	[0x41E, 0x1C82],
	[0x421, 0x1C83],
	[0x422, 0x1C85],
	[0x42A, 0x1C86],
	[0x462, 0x1C87],
	[0x1C80, 0x412],
	[0x1C81, 0x414],
	[0x1C82, 0x41E],
	[0x1C83, 0x421],
	[0x1C84, 0x1C85],
	[0x1C85, [
		0x422,
		0x1C84
	]],
	[0x1C86, 0x42A],
	[0x1C87, 0x462],
	[0x1C88, 0xA64A],
	[0x1E60, 0x1E9B],
	[0x1E9B, 0x1E60],
	[0x1E9E, 0xDF],
	[0x1F80, 0x1F88],
	[0x1F81, 0x1F89],
	[0x1F82, 0x1F8A],
	[0x1F83, 0x1F8B],
	[0x1F84, 0x1F8C],
	[0x1F85, 0x1F8D],
	[0x1F86, 0x1F8E],
	[0x1F87, 0x1F8F],
	[0x1F88, 0x1F80],
	[0x1F89, 0x1F81],
	[0x1F8A, 0x1F82],
	[0x1F8B, 0x1F83],
	[0x1F8C, 0x1F84],
	[0x1F8D, 0x1F85],
	[0x1F8E, 0x1F86],
	[0x1F8F, 0x1F87],
	[0x1F90, 0x1F98],
	[0x1F91, 0x1F99],
	[0x1F92, 0x1F9A],
	[0x1F93, 0x1F9B],
	[0x1F94, 0x1F9C],
	[0x1F95, 0x1F9D],
	[0x1F96, 0x1F9E],
	[0x1F97, 0x1F9F],
	[0x1F98, 0x1F90],
	[0x1F99, 0x1F91],
	[0x1F9A, 0x1F92],
	[0x1F9B, 0x1F93],
	[0x1F9C, 0x1F94],
	[0x1F9D, 0x1F95],
	[0x1F9E, 0x1F96],
	[0x1F9F, 0x1F97],
	[0x1FA0, 0x1FA8],
	[0x1FA1, 0x1FA9],
	[0x1FA2, 0x1FAA],
	[0x1FA3, 0x1FAB],
	[0x1FA4, 0x1FAC],
	[0x1FA5, 0x1FAD],
	[0x1FA6, 0x1FAE],
	[0x1FA7, 0x1FAF],
	[0x1FA8, 0x1FA0],
	[0x1FA9, 0x1FA1],
	[0x1FAA, 0x1FA2],
	[0x1FAB, 0x1FA3],
	[0x1FAC, 0x1FA4],
	[0x1FAD, 0x1FA5],
	[0x1FAE, 0x1FA6],
	[0x1FAF, 0x1FA7],
	[0x1FB3, 0x1FBC],
	[0x1FBC, 0x1FB3],
	[0x1FBE, [
		0x345,
		0x399
	]],
	[0x1FC3, 0x1FCC],
	[0x1FCC, 0x1FC3],
	[0x1FF3, 0x1FFC],
	[0x1FFC, 0x1FF3],
	[0x2126, [
		0x3A9,
		0x3C9
	]],
	[0x212A, 0x4B],
	[0x212B, [
		0xC5,
		0xE5
	]],
	[0x2C2F, 0x2C5F],
	[0x2C5F, 0x2C2F],
	[0xA64A, 0x1C88],
	[0xA7C0, 0xA7C1],
	[0xA7C1, 0xA7C0],
	[0xA7D0, 0xA7D1],
	[0xA7D1, 0xA7D0],
	[0xA7D6, 0xA7D7],
	[0xA7D7, 0xA7D6],
	[0xA7D8, 0xA7D9],
	[0xA7D9, 0xA7D8],
	[0x10400, 0x10428],
	[0x10401, 0x10429],
	[0x10402, 0x1042A],
	[0x10403, 0x1042B],
	[0x10404, 0x1042C],
	[0x10405, 0x1042D],
	[0x10406, 0x1042E],
	[0x10407, 0x1042F],
	[0x10408, 0x10430],
	[0x10409, 0x10431],
	[0x1040A, 0x10432],
	[0x1040B, 0x10433],
	[0x1040C, 0x10434],
	[0x1040D, 0x10435],
	[0x1040E, 0x10436],
	[0x1040F, 0x10437],
	[0x10410, 0x10438],
	[0x10411, 0x10439],
	[0x10412, 0x1043A],
	[0x10413, 0x1043B],
	[0x10414, 0x1043C],
	[0x10415, 0x1043D],
	[0x10416, 0x1043E],
	[0x10417, 0x1043F],
	[0x10418, 0x10440],
	[0x10419, 0x10441],
	[0x1041A, 0x10442],
	[0x1041B, 0x10443],
	[0x1041C, 0x10444],
	[0x1041D, 0x10445],
	[0x1041E, 0x10446],
	[0x1041F, 0x10447],
	[0x10420, 0x10448],
	[0x10421, 0x10449],
	[0x10422, 0x1044A],
	[0x10423, 0x1044B],
	[0x10424, 0x1044C],
	[0x10425, 0x1044D],
	[0x10426, 0x1044E],
	[0x10427, 0x1044F],
	[0x10428, 0x10400],
	[0x10429, 0x10401],
	[0x1042A, 0x10402],
	[0x1042B, 0x10403],
	[0x1042C, 0x10404],
	[0x1042D, 0x10405],
	[0x1042E, 0x10406],
	[0x1042F, 0x10407],
	[0x10430, 0x10408],
	[0x10431, 0x10409],
	[0x10432, 0x1040A],
	[0x10433, 0x1040B],
	[0x10434, 0x1040C],
	[0x10435, 0x1040D],
	[0x10436, 0x1040E],
	[0x10437, 0x1040F],
	[0x10438, 0x10410],
	[0x10439, 0x10411],
	[0x1043A, 0x10412],
	[0x1043B, 0x10413],
	[0x1043C, 0x10414],
	[0x1043D, 0x10415],
	[0x1043E, 0x10416],
	[0x1043F, 0x10417],
	[0x10440, 0x10418],
	[0x10441, 0x10419],
	[0x10442, 0x1041A],
	[0x10443, 0x1041B],
	[0x10444, 0x1041C],
	[0x10445, 0x1041D],
	[0x10446, 0x1041E],
	[0x10447, 0x1041F],
	[0x10448, 0x10420],
	[0x10449, 0x10421],
	[0x1044A, 0x10422],
	[0x1044B, 0x10423],
	[0x1044C, 0x10424],
	[0x1044D, 0x10425],
	[0x1044E, 0x10426],
	[0x1044F, 0x10427],
	[0x104B0, 0x104D8],
	[0x104B1, 0x104D9],
	[0x104B2, 0x104DA],
	[0x104B3, 0x104DB],
	[0x104B4, 0x104DC],
	[0x104B5, 0x104DD],
	[0x104B6, 0x104DE],
	[0x104B7, 0x104DF],
	[0x104B8, 0x104E0],
	[0x104B9, 0x104E1],
	[0x104BA, 0x104E2],
	[0x104BB, 0x104E3],
	[0x104BC, 0x104E4],
	[0x104BD, 0x104E5],
	[0x104BE, 0x104E6],
	[0x104BF, 0x104E7],
	[0x104C0, 0x104E8],
	[0x104C1, 0x104E9],
	[0x104C2, 0x104EA],
	[0x104C3, 0x104EB],
	[0x104C4, 0x104EC],
	[0x104C5, 0x104ED],
	[0x104C6, 0x104EE],
	[0x104C7, 0x104EF],
	[0x104C8, 0x104F0],
	[0x104C9, 0x104F1],
	[0x104CA, 0x104F2],
	[0x104CB, 0x104F3],
	[0x104CC, 0x104F4],
	[0x104CD, 0x104F5],
	[0x104CE, 0x104F6],
	[0x104CF, 0x104F7],
	[0x104D0, 0x104F8],
	[0x104D1, 0x104F9],
	[0x104D2, 0x104FA],
	[0x104D3, 0x104FB],
	[0x104D8, 0x104B0],
	[0x104D9, 0x104B1],
	[0x104DA, 0x104B2],
	[0x104DB, 0x104B3],
	[0x104DC, 0x104B4],
	[0x104DD, 0x104B5],
	[0x104DE, 0x104B6],
	[0x104DF, 0x104B7],
	[0x104E0, 0x104B8],
	[0x104E1, 0x104B9],
	[0x104E2, 0x104BA],
	[0x104E3, 0x104BB],
	[0x104E4, 0x104BC],
	[0x104E5, 0x104BD],
	[0x104E6, 0x104BE],
	[0x104E7, 0x104BF],
	[0x104E8, 0x104C0],
	[0x104E9, 0x104C1],
	[0x104EA, 0x104C2],
	[0x104EB, 0x104C3],
	[0x104EC, 0x104C4],
	[0x104ED, 0x104C5],
	[0x104EE, 0x104C6],
	[0x104EF, 0x104C7],
	[0x104F0, 0x104C8],
	[0x104F1, 0x104C9],
	[0x104F2, 0x104CA],
	[0x104F3, 0x104CB],
	[0x104F4, 0x104CC],
	[0x104F5, 0x104CD],
	[0x104F6, 0x104CE],
	[0x104F7, 0x104CF],
	[0x104F8, 0x104D0],
	[0x104F9, 0x104D1],
	[0x104FA, 0x104D2],
	[0x104FB, 0x104D3],
	[0x10570, 0x10597],
	[0x10571, 0x10598],
	[0x10572, 0x10599],
	[0x10573, 0x1059A],
	[0x10574, 0x1059B],
	[0x10575, 0x1059C],
	[0x10576, 0x1059D],
	[0x10577, 0x1059E],
	[0x10578, 0x1059F],
	[0x10579, 0x105A0],
	[0x1057A, 0x105A1],
	[0x1057C, 0x105A3],
	[0x1057D, 0x105A4],
	[0x1057E, 0x105A5],
	[0x1057F, 0x105A6],
	[0x10580, 0x105A7],
	[0x10581, 0x105A8],
	[0x10582, 0x105A9],
	[0x10583, 0x105AA],
	[0x10584, 0x105AB],
	[0x10585, 0x105AC],
	[0x10586, 0x105AD],
	[0x10587, 0x105AE],
	[0x10588, 0x105AF],
	[0x10589, 0x105B0],
	[0x1058A, 0x105B1],
	[0x1058C, 0x105B3],
	[0x1058D, 0x105B4],
	[0x1058E, 0x105B5],
	[0x1058F, 0x105B6],
	[0x10590, 0x105B7],
	[0x10591, 0x105B8],
	[0x10592, 0x105B9],
	[0x10594, 0x105BB],
	[0x10595, 0x105BC],
	[0x10597, 0x10570],
	[0x10598, 0x10571],
	[0x10599, 0x10572],
	[0x1059A, 0x10573],
	[0x1059B, 0x10574],
	[0x1059C, 0x10575],
	[0x1059D, 0x10576],
	[0x1059E, 0x10577],
	[0x1059F, 0x10578],
	[0x105A0, 0x10579],
	[0x105A1, 0x1057A],
	[0x105A3, 0x1057C],
	[0x105A4, 0x1057D],
	[0x105A5, 0x1057E],
	[0x105A6, 0x1057F],
	[0x105A7, 0x10580],
	[0x105A8, 0x10581],
	[0x105A9, 0x10582],
	[0x105AA, 0x10583],
	[0x105AB, 0x10584],
	[0x105AC, 0x10585],
	[0x105AD, 0x10586],
	[0x105AE, 0x10587],
	[0x105AF, 0x10588],
	[0x105B0, 0x10589],
	[0x105B1, 0x1058A],
	[0x105B3, 0x1058C],
	[0x105B4, 0x1058D],
	[0x105B5, 0x1058E],
	[0x105B6, 0x1058F],
	[0x105B7, 0x10590],
	[0x105B8, 0x10591],
	[0x105B9, 0x10592],
	[0x105BB, 0x10594],
	[0x105BC, 0x10595],
	[0x10C80, 0x10CC0],
	[0x10C81, 0x10CC1],
	[0x10C82, 0x10CC2],
	[0x10C83, 0x10CC3],
	[0x10C84, 0x10CC4],
	[0x10C85, 0x10CC5],
	[0x10C86, 0x10CC6],
	[0x10C87, 0x10CC7],
	[0x10C88, 0x10CC8],
	[0x10C89, 0x10CC9],
	[0x10C8A, 0x10CCA],
	[0x10C8B, 0x10CCB],
	[0x10C8C, 0x10CCC],
	[0x10C8D, 0x10CCD],
	[0x10C8E, 0x10CCE],
	[0x10C8F, 0x10CCF],
	[0x10C90, 0x10CD0],
	[0x10C91, 0x10CD1],
	[0x10C92, 0x10CD2],
	[0x10C93, 0x10CD3],
	[0x10C94, 0x10CD4],
	[0x10C95, 0x10CD5],
	[0x10C96, 0x10CD6],
	[0x10C97, 0x10CD7],
	[0x10C98, 0x10CD8],
	[0x10C99, 0x10CD9],
	[0x10C9A, 0x10CDA],
	[0x10C9B, 0x10CDB],
	[0x10C9C, 0x10CDC],
	[0x10C9D, 0x10CDD],
	[0x10C9E, 0x10CDE],
	[0x10C9F, 0x10CDF],
	[0x10CA0, 0x10CE0],
	[0x10CA1, 0x10CE1],
	[0x10CA2, 0x10CE2],
	[0x10CA3, 0x10CE3],
	[0x10CA4, 0x10CE4],
	[0x10CA5, 0x10CE5],
	[0x10CA6, 0x10CE6],
	[0x10CA7, 0x10CE7],
	[0x10CA8, 0x10CE8],
	[0x10CA9, 0x10CE9],
	[0x10CAA, 0x10CEA],
	[0x10CAB, 0x10CEB],
	[0x10CAC, 0x10CEC],
	[0x10CAD, 0x10CED],
	[0x10CAE, 0x10CEE],
	[0x10CAF, 0x10CEF],
	[0x10CB0, 0x10CF0],
	[0x10CB1, 0x10CF1],
	[0x10CB2, 0x10CF2],
	[0x10CC0, 0x10C80],
	[0x10CC1, 0x10C81],
	[0x10CC2, 0x10C82],
	[0x10CC3, 0x10C83],
	[0x10CC4, 0x10C84],
	[0x10CC5, 0x10C85],
	[0x10CC6, 0x10C86],
	[0x10CC7, 0x10C87],
	[0x10CC8, 0x10C88],
	[0x10CC9, 0x10C89],
	[0x10CCA, 0x10C8A],
	[0x10CCB, 0x10C8B],
	[0x10CCC, 0x10C8C],
	[0x10CCD, 0x10C8D],
	[0x10CCE, 0x10C8E],
	[0x10CCF, 0x10C8F],
	[0x10CD0, 0x10C90],
	[0x10CD1, 0x10C91],
	[0x10CD2, 0x10C92],
	[0x10CD3, 0x10C93],
	[0x10CD4, 0x10C94],
	[0x10CD5, 0x10C95],
	[0x10CD6, 0x10C96],
	[0x10CD7, 0x10C97],
	[0x10CD8, 0x10C98],
	[0x10CD9, 0x10C99],
	[0x10CDA, 0x10C9A],
	[0x10CDB, 0x10C9B],
	[0x10CDC, 0x10C9C],
	[0x10CDD, 0x10C9D],
	[0x10CDE, 0x10C9E],
	[0x10CDF, 0x10C9F],
	[0x10CE0, 0x10CA0],
	[0x10CE1, 0x10CA1],
	[0x10CE2, 0x10CA2],
	[0x10CE3, 0x10CA3],
	[0x10CE4, 0x10CA4],
	[0x10CE5, 0x10CA5],
	[0x10CE6, 0x10CA6],
	[0x10CE7, 0x10CA7],
	[0x10CE8, 0x10CA8],
	[0x10CE9, 0x10CA9],
	[0x10CEA, 0x10CAA],
	[0x10CEB, 0x10CAB],
	[0x10CEC, 0x10CAC],
	[0x10CED, 0x10CAD],
	[0x10CEE, 0x10CAE],
	[0x10CEF, 0x10CAF],
	[0x10CF0, 0x10CB0],
	[0x10CF1, 0x10CB1],
	[0x10CF2, 0x10CB2],
	[0x118A0, 0x118C0],
	[0x118A1, 0x118C1],
	[0x118A2, 0x118C2],
	[0x118A3, 0x118C3],
	[0x118A4, 0x118C4],
	[0x118A5, 0x118C5],
	[0x118A6, 0x118C6],
	[0x118A7, 0x118C7],
	[0x118A8, 0x118C8],
	[0x118A9, 0x118C9],
	[0x118AA, 0x118CA],
	[0x118AB, 0x118CB],
	[0x118AC, 0x118CC],
	[0x118AD, 0x118CD],
	[0x118AE, 0x118CE],
	[0x118AF, 0x118CF],
	[0x118B0, 0x118D0],
	[0x118B1, 0x118D1],
	[0x118B2, 0x118D2],
	[0x118B3, 0x118D3],
	[0x118B4, 0x118D4],
	[0x118B5, 0x118D5],
	[0x118B6, 0x118D6],
	[0x118B7, 0x118D7],
	[0x118B8, 0x118D8],
	[0x118B9, 0x118D9],
	[0x118BA, 0x118DA],
	[0x118BB, 0x118DB],
	[0x118BC, 0x118DC],
	[0x118BD, 0x118DD],
	[0x118BE, 0x118DE],
	[0x118BF, 0x118DF],
	[0x118C0, 0x118A0],
	[0x118C1, 0x118A1],
	[0x118C2, 0x118A2],
	[0x118C3, 0x118A3],
	[0x118C4, 0x118A4],
	[0x118C5, 0x118A5],
	[0x118C6, 0x118A6],
	[0x118C7, 0x118A7],
	[0x118C8, 0x118A8],
	[0x118C9, 0x118A9],
	[0x118CA, 0x118AA],
	[0x118CB, 0x118AB],
	[0x118CC, 0x118AC],
	[0x118CD, 0x118AD],
	[0x118CE, 0x118AE],
	[0x118CF, 0x118AF],
	[0x118D0, 0x118B0],
	[0x118D1, 0x118B1],
	[0x118D2, 0x118B2],
	[0x118D3, 0x118B3],
	[0x118D4, 0x118B4],
	[0x118D5, 0x118B5],
	[0x118D6, 0x118B6],
	[0x118D7, 0x118B7],
	[0x118D8, 0x118B8],
	[0x118D9, 0x118B9],
	[0x118DA, 0x118BA],
	[0x118DB, 0x118BB],
	[0x118DC, 0x118BC],
	[0x118DD, 0x118BD],
	[0x118DE, 0x118BE],
	[0x118DF, 0x118BF],
	[0x16E40, 0x16E60],
	[0x16E41, 0x16E61],
	[0x16E42, 0x16E62],
	[0x16E43, 0x16E63],
	[0x16E44, 0x16E64],
	[0x16E45, 0x16E65],
	[0x16E46, 0x16E66],
	[0x16E47, 0x16E67],
	[0x16E48, 0x16E68],
	[0x16E49, 0x16E69],
	[0x16E4A, 0x16E6A],
	[0x16E4B, 0x16E6B],
	[0x16E4C, 0x16E6C],
	[0x16E4D, 0x16E6D],
	[0x16E4E, 0x16E6E],
	[0x16E4F, 0x16E6F],
	[0x16E50, 0x16E70],
	[0x16E51, 0x16E71],
	[0x16E52, 0x16E72],
	[0x16E53, 0x16E73],
	[0x16E54, 0x16E74],
	[0x16E55, 0x16E75],
	[0x16E56, 0x16E76],
	[0x16E57, 0x16E77],
	[0x16E58, 0x16E78],
	[0x16E59, 0x16E79],
	[0x16E5A, 0x16E7A],
	[0x16E5B, 0x16E7B],
	[0x16E5C, 0x16E7C],
	[0x16E5D, 0x16E7D],
	[0x16E5E, 0x16E7E],
	[0x16E5F, 0x16E7F],
	[0x16E60, 0x16E40],
	[0x16E61, 0x16E41],
	[0x16E62, 0x16E42],
	[0x16E63, 0x16E43],
	[0x16E64, 0x16E44],
	[0x16E65, 0x16E45],
	[0x16E66, 0x16E46],
	[0x16E67, 0x16E47],
	[0x16E68, 0x16E48],
	[0x16E69, 0x16E49],
	[0x16E6A, 0x16E4A],
	[0x16E6B, 0x16E4B],
	[0x16E6C, 0x16E4C],
	[0x16E6D, 0x16E4D],
	[0x16E6E, 0x16E4E],
	[0x16E6F, 0x16E4F],
	[0x16E70, 0x16E50],
	[0x16E71, 0x16E51],
	[0x16E72, 0x16E52],
	[0x16E73, 0x16E53],
	[0x16E74, 0x16E54],
	[0x16E75, 0x16E55],
	[0x16E76, 0x16E56],
	[0x16E77, 0x16E57],
	[0x16E78, 0x16E58],
	[0x16E79, 0x16E59],
	[0x16E7A, 0x16E5A],
	[0x16E7B, 0x16E5B],
	[0x16E7C, 0x16E5C],
	[0x16E7D, 0x16E5D],
	[0x16E7E, 0x16E5E],
	[0x16E7F, 0x16E5F],
	[0x1E900, 0x1E922],
	[0x1E901, 0x1E923],
	[0x1E902, 0x1E924],
	[0x1E903, 0x1E925],
	[0x1E904, 0x1E926],
	[0x1E905, 0x1E927],
	[0x1E906, 0x1E928],
	[0x1E907, 0x1E929],
	[0x1E908, 0x1E92A],
	[0x1E909, 0x1E92B],
	[0x1E90A, 0x1E92C],
	[0x1E90B, 0x1E92D],
	[0x1E90C, 0x1E92E],
	[0x1E90D, 0x1E92F],
	[0x1E90E, 0x1E930],
	[0x1E90F, 0x1E931],
	[0x1E910, 0x1E932],
	[0x1E911, 0x1E933],
	[0x1E912, 0x1E934],
	[0x1E913, 0x1E935],
	[0x1E914, 0x1E936],
	[0x1E915, 0x1E937],
	[0x1E916, 0x1E938],
	[0x1E917, 0x1E939],
	[0x1E918, 0x1E93A],
	[0x1E919, 0x1E93B],
	[0x1E91A, 0x1E93C],
	[0x1E91B, 0x1E93D],
	[0x1E91C, 0x1E93E],
	[0x1E91D, 0x1E93F],
	[0x1E91E, 0x1E940],
	[0x1E91F, 0x1E941],
	[0x1E920, 0x1E942],
	[0x1E921, 0x1E943],
	[0x1E922, 0x1E900],
	[0x1E923, 0x1E901],
	[0x1E924, 0x1E902],
	[0x1E925, 0x1E903],
	[0x1E926, 0x1E904],
	[0x1E927, 0x1E905],
	[0x1E928, 0x1E906],
	[0x1E929, 0x1E907],
	[0x1E92A, 0x1E908],
	[0x1E92B, 0x1E909],
	[0x1E92C, 0x1E90A],
	[0x1E92D, 0x1E90B],
	[0x1E92E, 0x1E90C],
	[0x1E92F, 0x1E90D],
	[0x1E930, 0x1E90E],
	[0x1E931, 0x1E90F],
	[0x1E932, 0x1E910],
	[0x1E933, 0x1E911],
	[0x1E934, 0x1E912],
	[0x1E935, 0x1E913],
	[0x1E936, 0x1E914],
	[0x1E937, 0x1E915],
	[0x1E938, 0x1E916],
	[0x1E939, 0x1E917],
	[0x1E93A, 0x1E918],
	[0x1E93B, 0x1E919],
	[0x1E93C, 0x1E91A],
	[0x1E93D, 0x1E91B],
	[0x1E93E, 0x1E91C],
	[0x1E93F, 0x1E91D],
	[0x1E940, 0x1E91E],
	[0x1E941, 0x1E91F],
	[0x1E942, 0x1E920],
	[0x1E943, 0x1E921]
]);

},{}],4:[function(require,module,exports){
(function (global){(function (){
/*!
 * regjsgen 0.5.2
 * Copyright 2014-2020 Benjamin Tan <https://ofcr.se/>
 * Available under the MIT license <https://github.com/bnjmnt4n/regjsgen/blob/master/LICENSE-MIT.txt>
 */
;(function() {
  'use strict';

  // Used to determine if values are of the language type `Object`.
  var objectTypes = {
    'function': true,
    'object': true
  };

  // Used as a reference to the global object.
  var root = (objectTypes[typeof window] && window) || this;

  // Detect free variable `exports`.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Detect free variable `module`.
  var hasFreeModule = objectTypes[typeof module] && module && !module.nodeType;

  // Detect free variable `global` from Node.js or Browserified code and use it as `root`.
  var freeGlobal = freeExports && hasFreeModule && typeof global == 'object' && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  // Used to check objects for own properties.
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /*--------------------------------------------------------------------------*/

  // Generates a string based on the given code point.
  // Based on https://mths.be/fromcodepoint by @mathias.
  function fromCodePoint() {
    var codePoint = Number(arguments[0]);

    if (
      !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
      codePoint < 0 || // not a valid Unicode code point
      codePoint > 0x10FFFF || // not a valid Unicode code point
      Math.floor(codePoint) != codePoint // not an integer
    ) {
      throw RangeError('Invalid code point: ' + codePoint);
    }

    if (codePoint <= 0xFFFF) {
      // BMP code point
      return String.fromCharCode(codePoint);
    } else {
      // Astral code point; split in surrogate halves
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      codePoint -= 0x10000;
      var highSurrogate = (codePoint >> 10) + 0xD800;
      var lowSurrogate = (codePoint % 0x400) + 0xDC00;
      return String.fromCharCode(highSurrogate, lowSurrogate);
    }
  }

  /*--------------------------------------------------------------------------*/

  // Ensures that nodes have the correct types.
  var assertTypeRegexMap = {};
  function assertType(type, expected) {
    if (expected.indexOf('|') == -1) {
      if (type == expected) {
        return;
      }

      throw Error('Invalid node type: ' + type + '; expected type: ' + expected);
    }

    expected = hasOwnProperty.call(assertTypeRegexMap, expected)
      ? assertTypeRegexMap[expected]
      : (assertTypeRegexMap[expected] = RegExp('^(?:' + expected + ')$'));

    if (expected.test(type)) {
      return;
    }

    throw Error('Invalid node type: ' + type + '; expected types: ' + expected);
  }

  /*--------------------------------------------------------------------------*/

  // Generates a regular expression string based on an AST.
  function generate(node) {
    var type = node.type;

    if (hasOwnProperty.call(generators, type)) {
      return generators[type](node);
    }

    throw Error('Invalid node type: ' + type);
  }

  // Constructs a string by concatentating the output of each term.
  function generateSequence(generator, terms) {
    var i = -1,
        length = terms.length,
        result = '',
        term;

    while (++i < length) {
      term = terms[i];

      // Ensure that `\0` null escapes followed by number symbols are not
      // treated as backreferences.
      if (
        i + 1 < length &&
        terms[i].type == 'value' &&
        terms[i].kind == 'null' &&
        terms[i + 1].type == 'value' &&
        terms[i + 1].kind == 'symbol' &&
        terms[i + 1].codePoint >= 48 &&
        terms[i + 1].codePoint <= 57
      ) {
        result += '\\000';
        continue;
      }

      result += generator(term);
    }

    return result;
  }

  /*--------------------------------------------------------------------------*/

  function generateAlternative(node) {
    assertType(node.type, 'alternative');

    return generateSequence(generateTerm, node.body);
  }

  function generateAnchor(node) {
    assertType(node.type, 'anchor');

    switch (node.kind) {
      case 'start':
        return '^';
      case 'end':
        return '$';
      case 'boundary':
        return '\\b';
      case 'not-boundary':
        return '\\B';
      default:
        throw Error('Invalid assertion');
    }
  }

  function generateAtom(node) {
    assertType(node.type, 'anchor|characterClass|characterClassEscape|dot|group|reference|value');

    return generate(node);
  }

  function generateCharacterClass(node) {
    assertType(node.type, 'characterClass');

    return '[' +
      (node.negative ? '^' : '') +
      generateSequence(generateClassAtom, node.body) +
    ']';
  }

  function generateCharacterClassEscape(node) {
    assertType(node.type, 'characterClassEscape');

    return '\\' + node.value;
  }

  function generateCharacterClassRange(node) {
    assertType(node.type, 'characterClassRange');

    var min = node.min,
        max = node.max;

    if (min.type == 'characterClassRange' || max.type == 'characterClassRange') {
      throw Error('Invalid character class range');
    }

    return generateClassAtom(min) + '-' + generateClassAtom(max);
  }

  function generateClassAtom(node) {
    assertType(node.type, 'anchor|characterClassEscape|characterClassRange|dot|value');

    return generate(node);
  }

  function generateDisjunction(node) {
    assertType(node.type, 'disjunction');

    var body = node.body,
        i = -1,
        length = body.length,
        result = '';

    while (++i < length) {
      if (i != 0) {
        result += '|';
      }
      result += generate(body[i]);
    }

    return result;
  }

  function generateDot(node) {
    assertType(node.type, 'dot');

    return '.';
  }

  function generateGroup(node) {
    assertType(node.type, 'group');

    var result = '';

    switch (node.behavior) {
      case 'normal':
        if (node.name) {
          result += '?<' + generateIdentifier(node.name) + '>';
        }
        break;
      case 'ignore':
        result += '?:';
        break;
      case 'lookahead':
        result += '?=';
        break;
      case 'negativeLookahead':
        result += '?!';
        break;
      case 'lookbehind':
        result += '?<=';
        break;
      case 'negativeLookbehind':
        result += '?<!';
        break;
      default:
        throw Error('Invalid behaviour: ' + node.behaviour);
    }

    result += generateSequence(generate, node.body);

    return '(' + result + ')';
  }

  function generateIdentifier(node) {
    assertType(node.type, 'identifier');

    return node.value;
  }

  function generateQuantifier(node) {
    assertType(node.type, 'quantifier');

    var quantifier = '',
        min = node.min,
        max = node.max;

    if (max == null) {
      if (min == 0) {
        quantifier = '*';
      } else if (min == 1) {
        quantifier = '+';
      } else {
        quantifier = '{' + min + ',}';
      }
    } else if (min == max) {
      quantifier = '{' + min + '}';
    } else if (min == 0 && max == 1) {
      quantifier = '?';
    } else {
      quantifier = '{' + min + ',' + max + '}';
    }

    if (!node.greedy) {
      quantifier += '?';
    }

    return generateAtom(node.body[0]) + quantifier;
  }

  function generateReference(node) {
    assertType(node.type, 'reference');

    if (node.matchIndex) {
      return '\\' + node.matchIndex;
    }
    if (node.name) {
      return '\\k<' + generateIdentifier(node.name) + '>';
    }

    throw new Error('Unknown reference type');
  }

  function generateTerm(node) {
    assertType(node.type, 'anchor|characterClass|characterClassEscape|empty|group|quantifier|reference|unicodePropertyEscape|value|dot');

    return generate(node);
  }

  function generateUnicodePropertyEscape(node) {
    assertType(node.type, 'unicodePropertyEscape');

    return '\\' + (node.negative ? 'P' : 'p') + '{' + node.value + '}';
  }

  function generateValue(node) {
    assertType(node.type, 'value');

    var kind = node.kind,
        codePoint = node.codePoint;

    if (typeof codePoint != 'number') {
      throw new Error('Invalid code point: ' + codePoint);
    }

    switch (kind) {
      case 'controlLetter':
        return '\\c' + fromCodePoint(codePoint + 64);
      case 'hexadecimalEscape':
        return '\\x' + ('00' + codePoint.toString(16).toUpperCase()).slice(-2);
      case 'identifier':
        return '\\' + fromCodePoint(codePoint);
      case 'null':
        return '\\' + codePoint;
      case 'octal':
        return '\\' + ('000' + codePoint.toString(8)).slice(-3);
      case 'singleEscape':
        switch (codePoint) {
          case 0x0008:
            return '\\b';
          case 0x0009:
            return '\\t';
          case 0x000A:
            return '\\n';
          case 0x000B:
            return '\\v';
          case 0x000C:
            return '\\f';
          case 0x000D:
            return '\\r';
          case 0x002D:
            return '\\-';
          default:
            throw Error('Invalid code point: ' + codePoint);
        }
      case 'symbol':
        return fromCodePoint(codePoint);
      case 'unicodeEscape':
        return '\\u' + ('0000' + codePoint.toString(16).toUpperCase()).slice(-4);
      case 'unicodeCodePointEscape':
        return '\\u{' + codePoint.toString(16).toUpperCase() + '}';
      default:
        throw Error('Unsupported node kind: ' + kind);
    }
  }

  /*--------------------------------------------------------------------------*/

  // Used to generate strings for each node type.
  var generators = {
    'alternative': generateAlternative,
    'anchor': generateAnchor,
    'characterClass': generateCharacterClass,
    'characterClassEscape': generateCharacterClassEscape,
    'characterClassRange': generateCharacterClassRange,
    'disjunction': generateDisjunction,
    'dot': generateDot,
    'group': generateGroup,
    'quantifier': generateQuantifier,
    'reference': generateReference,
    'unicodePropertyEscape': generateUnicodePropertyEscape,
    'value': generateValue
  };

  /*--------------------------------------------------------------------------*/

  // Export regjsgen.
  var regjsgen = {
    'generate': generate
  };

  // Some AMD build optimizers, like r.js, check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Define as an anonymous module so it can be aliased through path mapping.
    define(function() {
      return regjsgen;
    });

    root.regjsgen = regjsgen;
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && hasFreeModule) {
    // Export for CommonJS support.
    freeExports.generate = generate;
  }
  else {
    // Export to the global object.
    root.regjsgen = regjsgen;
  }
}.call(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
// regjsparser
//
// ==================================================================
//
// See ECMA-262 Standard: 15.10.1
//
// NOTE: The ECMA-262 standard uses the term "Assertion" for /^/. Here the
//   term "Anchor" is used.
//
// Pattern ::
//      Disjunction
//
// Disjunction ::
//      Alternative
//      Alternative | Disjunction
//
// Alternative ::
//      [empty]
//      Alternative Term
//
// Term ::
//      Anchor
//      Atom
//      Atom Quantifier
//
// Anchor ::
//      ^
//      $
//      \ b
//      \ B
//      ( ? = Disjunction )
//      ( ? ! Disjunction )
//      ( ? < = Disjunction )
//      ( ? < ! Disjunction )
//
// Quantifier ::
//      QuantifierPrefix
//      QuantifierPrefix ?
//
// QuantifierPrefix ::
//      *
//      +
//      ?
//      { DecimalDigits }
//      { DecimalDigits , }
//      { DecimalDigits , DecimalDigits }
//
// Atom ::
//      PatternCharacter
//      .
//      \ AtomEscape
//      CharacterClass
//      ( GroupSpecifier Disjunction )
//      ( ? : Disjunction )
//
// PatternCharacter ::
//      SourceCharacter but not any of: ^ $ \ . * + ? ( ) [ ] { } |
//
// AtomEscape ::
//      DecimalEscape
//      CharacterClassEscape
//      CharacterEscape
//      k GroupName
//
// CharacterEscape[U] ::
//      ControlEscape
//      c ControlLetter
//      HexEscapeSequence
//      RegExpUnicodeEscapeSequence[?U] (ES6)
//      IdentityEscape[?U]
//
// ControlEscape ::
//      one of f n r t v
// ControlLetter ::
//      one of
//          a b c d e f g h i j k l m n o p q r s t u v w x y z
//          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
//
// IdentityEscape ::
//      SourceCharacter but not c
//
// DecimalEscape ::
//      DecimalIntegerLiteral [lookahead ∉ DecimalDigit]
//
// CharacterClassEscape ::
//      one of d D s S w W
//
// CharacterClass ::
//      [ [lookahead ∉ {^}] ClassRanges ]
//      [ ^ ClassRanges ]
//
// ClassRanges ::
//      [empty]
//      [~V] NonemptyClassRanges
//      [+V] ClassContents
//
// NonemptyClassRanges ::
//      ClassAtom
//      ClassAtom NonemptyClassRangesNoDash
//      ClassAtom - ClassAtom ClassRanges
//
// NonemptyClassRangesNoDash ::
//      ClassAtom
//      ClassAtomNoDash NonemptyClassRangesNoDash
//      ClassAtomNoDash - ClassAtom ClassRanges
//
// ClassAtom ::
//      -
//      ClassAtomNoDash
//
// ClassAtomNoDash ::
//      SourceCharacter but not one of \ or ] or -
//      \ ClassEscape
//
// ClassEscape ::
//      DecimalEscape
//      b
//      CharacterEscape
//      CharacterClassEscape
//
// GroupSpecifier ::
//      [empty]
//      ? GroupName
//
// GroupName ::
//      < RegExpIdentifierName >
//
// RegExpIdentifierName ::
//      RegExpIdentifierStart
//      RegExpIdentifierName RegExpIdentifierContinue
//
// RegExpIdentifierStart ::
//      UnicodeIDStart
//      $
//      _
//      \ RegExpUnicodeEscapeSequence
//
// RegExpIdentifierContinue ::
//      UnicodeIDContinue
//      $
//      _
//      \ RegExpUnicodeEscapeSequence
//      <ZWNJ>
//      <ZWJ>
//
// --------------------------------------------------------------
// NOTE: The following productions refer to the "set notation and
//       properties of strings" proposal.
//       https://github.com/tc39/proposal-regexp-set-notation
// --------------------------------------------------------------
//
// ClassContents ::
//      ClassUnion
//      ClassIntersection
//      ClassSubtraction
//
// ClassUnion ::
//      ClassRange ClassUnion?
//      ClassOperand ClassUnion?
//
// ClassIntersection ::
//      ClassOperand && [lookahead ≠ &] ClassOperand
//      ClassIntersection && [lookahead ≠ &] ClassOperand
//
// ClassSubtraction ::
//      ClassOperand -- ClassOperand
//      ClassSubtraction -- ClassOperand
//
// ClassOperand ::
//      ClassCharacter
//      ClassStrings
//      NestedClass
//
// NestedClass ::
//      [ [lookahead ≠ ^] ClassRanges[+U,+V] ]
//      [ ^ ClassRanges[+U,+V] ]
//      \ CharacterClassEscape[+U, +V]
//
// ClassRange ::
//      ClassCharacter - ClassCharacter
//
// ClassCharacter ::
//      [lookahead ∉ ClassReservedDouble] SourceCharacter but not ClassSyntaxCharacter
//      \ CharacterEscape[+U]
//      \ ClassHalfOfDouble
//      \ b
//
// ClassSyntaxCharacter ::
//      one of ( ) [ ] { } / - \ |
//
// ClassStrings ::
//      ( ClassString MoreClassStrings? )
//
// MoreClassStrings ::
//      | ClassString MoreClassStrings?
//
// ClassString ::
//      [empty]
//      NonEmptyClassString
//
// NonEmptyClassString ::
//      ClassCharacter NonEmptyClassString?
//
// ClassReservedDouble ::
//      one of && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ __ `` ~~
//
// ClassHalfOfDouble ::
//      one of & - ! # % , : ; < = > @ _ ` ~
//

(function() {

  var fromCodePoint = String.fromCodePoint || (function() {
    // Implementation taken from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint

    var stringFromCharCode = String.fromCharCode;
    var floor = Math.floor;

    return function fromCodePoint() {
      var MAX_SIZE = 0x4000;
      var codeUnits = [];
      var highSurrogate;
      var lowSurrogate;
      var index = -1;
      var length = arguments.length;
      if (!length) {
        return '';
      }
      var result = '';
      while (++index < length) {
        var codePoint = Number(arguments[index]);
        if (
          !isFinite(codePoint) ||       // `NaN`, `+Infinity`, or `-Infinity`
          codePoint < 0 ||              // not a valid Unicode code point
          codePoint > 0x10FFFF ||       // not a valid Unicode code point
          floor(codePoint) != codePoint // not an integer
        ) {
          throw RangeError('Invalid code point: ' + codePoint);
        }
        if (codePoint <= 0xFFFF) { // BMP code point
          codeUnits.push(codePoint);
        } else { // Astral code point; split in surrogate halves
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          codePoint -= 0x10000;
          highSurrogate = (codePoint >> 10) + 0xD800;
          lowSurrogate = (codePoint % 0x400) + 0xDC00;
          codeUnits.push(highSurrogate, lowSurrogate);
        }
        if (index + 1 == length || codeUnits.length > MAX_SIZE) {
          result += stringFromCharCode.apply(null, codeUnits);
          codeUnits.length = 0;
        }
      }
      return result;
    };
  }());

  function parse(str, flags, features) {
    if (!features) {
      features = {};
    }
    function addRaw(node) {
      node.raw = str.substring(node.range[0], node.range[1]);
      return node;
    }

    function updateRawStart(node, start) {
      node.range[0] = start;
      return addRaw(node);
    }

    function createAnchor(kind, rawLength) {
      return addRaw({
        type: 'anchor',
        kind: kind,
        range: [
          pos - rawLength,
          pos
        ]
      });
    }

    function createValue(kind, codePoint, from, to) {
      return addRaw({
        type: 'value',
        kind: kind,
        codePoint: codePoint,
        range: [from, to]
      });
    }

    function createEscaped(kind, codePoint, value, fromOffset) {
      fromOffset = fromOffset || 0;
      return createValue(kind, codePoint, pos - (value.length + fromOffset), pos);
    }

    function createCharacter(matches) {
      var _char = matches[0];
      var first = _char.charCodeAt(0);
      if (hasUnicodeFlag) {
        var second;
        if (_char.length === 1 && first >= 0xD800 && first <= 0xDBFF) {
          second = lookahead().charCodeAt(0);
          if (second >= 0xDC00 && second <= 0xDFFF) {
            // Unicode surrogate pair
            pos++;
            return createValue(
                'symbol',
                (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000,
                pos - 2, pos);
          }
        }
      }
      return createValue('symbol', first, pos - 1, pos);
    }

    function createDisjunction(alternatives, from, to) {
      return addRaw({
        type: 'disjunction',
        body: alternatives,
        range: [
          from,
          to
        ]
      });
    }

    function createDot() {
      return addRaw({
        type: 'dot',
        range: [
          pos - 1,
          pos
        ]
      });
    }

    function createCharacterClassEscape(value) {
      return addRaw({
        type: 'characterClassEscape',
        value: value,
        range: [
          pos - 2,
          pos
        ]
      });
    }

    function createReference(matchIndex) {
      return addRaw({
        type: 'reference',
        matchIndex: parseInt(matchIndex, 10),
        range: [
          pos - 1 - matchIndex.length,
          pos
        ]
      });
    }

    function createNamedReference(name) {
      return addRaw({
        type: 'reference',
        name: name,
        range: [
          name.range[0] - 3,
          pos
        ]
      });
    }

    function createGroup(behavior, disjunction, from, to) {
      return addRaw({
        type: 'group',
        behavior: behavior,
        body: disjunction,
        range: [
          from,
          to
        ]
      });
    }

    function createQuantifier(min, max, from, to) {
      if (to == null) {
        from = pos - 1;
        to = pos;
      }

      return addRaw({
        type: 'quantifier',
        min: min,
        max: max,
        greedy: true,
        body: null, // set later on
        range: [
          from,
          to
        ]
      });
    }

    function createAlternative(terms, from, to) {
      return addRaw({
        type: 'alternative',
        body: terms,
        range: [
          from,
          to
        ]
      });
    }

    function createCharacterClass(contents, negative, from, to) {
      return addRaw({
        type: 'characterClass',
        kind: contents.kind,
        body: contents.body,
        negative: negative,
        range: [
          from,
          to
        ]
      });
    }

    function createClassRange(min, max, from, to) {
      // See 15.10.2.15:
      if (min.codePoint > max.codePoint) {
        bail('invalid range in character class', min.raw + '-' + max.raw, from, to);
      }

      return addRaw({
        type: 'characterClassRange',
        min: min,
        max: max,
        range: [
          from,
          to
        ]
      });
    }

    function createClassStrings(strings, from, to) {
      return addRaw({
        type: 'classStrings',
        strings: strings,
        range: [from, to]
      });
    }

    function createClassString(characters, from, to) {
      return addRaw({
        type: 'classString',
        characters: characters,
        range: [from, to]
      });
    }

    function flattenBody(body) {
      if (body.type === 'alternative') {
        return body.body;
      } else {
        return [body];
      }
    }

    function incr(amount) {
      amount = (amount || 1);
      var res = str.substring(pos, pos + amount);
      pos += (amount || 1);
      return res;
    }

    function skip(value) {
      if (!match(value)) {
        bail('character', value);
      }
    }

    function match(value) {
      if (str.indexOf(value, pos) === pos) {
        return incr(value.length);
      }
    }

    function lookahead() {
      return str[pos];
    }

    function current(value) {
      return str.indexOf(value, pos) === pos;
    }

    function next(value) {
      return str[pos + 1] === value;
    }

    function matchReg(regExp) {
      var subStr = str.substring(pos);
      var res = subStr.match(regExp);
      if (res) {
        res.range = [];
        res.range[0] = pos;
        incr(res[0].length);
        res.range[1] = pos;
      }
      return res;
    }

    function parseDisjunction() {
      // Disjunction ::
      //      Alternative
      //      Alternative | Disjunction
      var res = [], from = pos;
      res.push(parseAlternative());

      while (match('|')) {
        res.push(parseAlternative());
      }

      if (res.length === 1) {
        return res[0];
      }

      return createDisjunction(res, from, pos);
    }

    function parseAlternative() {
      var res = [], from = pos;
      var term;

      // Alternative ::
      //      [empty]
      //      Alternative Term
      while (term = parseTerm()) {
        res.push(term);
      }

      if (res.length === 1) {
        return res[0];
      }

      return createAlternative(res, from, pos);
    }

    function parseTerm() {
      // Term ::
      //      Anchor
      //      Atom
      //      Atom Quantifier

      if (pos >= str.length || current('|') || current(')')) {
        return null; /* Means: The term is empty */
      }

      var anchor = parseAnchor();

      if (anchor) {
        return anchor;
      }

      var atom = parseAtomAndExtendedAtom();
      if (!atom) {
        // Check if a quantifier is following. A quantifier without an atom
        // is an error.
        pos_backup = pos
        var quantifier = parseQuantifier() || false;
        if (quantifier) {
          pos = pos_backup
          bail('Expected atom');
        }

        // If no unicode flag, then try to parse ExtendedAtom -> ExtendedPatternCharacter.
        //      ExtendedPatternCharacter
        if (!hasUnicodeFlag && (res = matchReg(/^{/))) {
          atom = createCharacter(res);
        } else {
          bail('Expected atom');
        }
      }
      var quantifier = parseQuantifier() || false;
      if (quantifier) {
        quantifier.body = flattenBody(atom);
        // The quantifier contains the atom. Therefore, the beginning of the
        // quantifier range is given by the beginning of the atom.
        updateRawStart(quantifier, atom.range[0]);
        return quantifier;
      }
      return atom;
    }

    function parseGroup(matchA, typeA, matchB, typeB) {
      var type = null, from = pos;

      if (match(matchA)) {
        type = typeA;
      } else if (match(matchB)) {
        type = typeB;
      } else {
        return false;
      }

      return finishGroup(type, from);
    }

    function finishGroup(type, from) {
      var body = parseDisjunction();
      if (!body) {
        bail('Expected disjunction');
      }
      skip(')');
      var group = createGroup(type, flattenBody(body), from, pos);

      if (type == 'normal') {
        // Keep track of the number of closed groups. This is required for
        // parseDecimalEscape(). In case the string is parsed a second time the
        // value already holds the total count and no incrementation is required.
        if (firstIteration) {
          closedCaptureCounter++;
        }
      }
      return group;
    }

    function parseAnchor() {
      // Anchor ::
      //      ^
      //      $
      //      \ b
      //      \ B
      //      ( ? = Disjunction )
      //      ( ? ! Disjunction )
      var res, from = pos;

      if (match('^')) {
        return createAnchor('start', 1 /* rawLength */);
      } else if (match('$')) {
        return createAnchor('end', 1 /* rawLength */);
      } else if (match('\\b')) {
        return createAnchor('boundary', 2 /* rawLength */);
      } else if (match('\\B')) {
        return createAnchor('not-boundary', 2 /* rawLength */);
      } else {
        return parseGroup('(?=', 'lookahead', '(?!', 'negativeLookahead');
      }
    }

    function parseQuantifier() {
      // Quantifier ::
      //      QuantifierPrefix
      //      QuantifierPrefix ?
      //
      // QuantifierPrefix ::
      //      *
      //      +
      //      ?
      //      { DecimalDigits }
      //      { DecimalDigits , }
      //      { DecimalDigits , DecimalDigits }

      var res, from = pos;
      var quantifier;
      var min, max;

      if (match('*')) {
        quantifier = createQuantifier(0);
      }
      else if (match('+')) {
        quantifier = createQuantifier(1);
      }
      else if (match('?')) {
        quantifier = createQuantifier(0, 1);
      }
      else if (res = matchReg(/^\{([0-9]+)\}/)) {
        min = parseInt(res[1], 10);
        quantifier = createQuantifier(min, min, res.range[0], res.range[1]);
      }
      else if (res = matchReg(/^\{([0-9]+),\}/)) {
        min = parseInt(res[1], 10);
        quantifier = createQuantifier(min, undefined, res.range[0], res.range[1]);
      }
      else if (res = matchReg(/^\{([0-9]+),([0-9]+)\}/)) {
        min = parseInt(res[1], 10);
        max = parseInt(res[2], 10);
        if (min > max) {
          bail('numbers out of order in {} quantifier', '', from, pos);
        }
        quantifier = createQuantifier(min, max, res.range[0], res.range[1]);
      }

      if (quantifier) {
        if (match('?')) {
          quantifier.greedy = false;
          quantifier.range[1] += 1;
        }
      }

      return quantifier;
    }

    function parseAtomAndExtendedAtom() {
      // Parsing Atom and ExtendedAtom together due to redundancy.
      // ExtendedAtom is defined in Apendix B of the ECMA-262 standard.
      //
      // SEE: https://www.ecma-international.org/ecma-262/10.0/index.html#prod-annexB-ExtendedPatternCharacter
      //
      // Atom ::
      //      PatternCharacter
      //      .
      //      \ AtomEscape
      //      CharacterClass
      //      ( GroupSpecifier Disjunction )
      //      ( ? : Disjunction )
      // ExtendedAtom ::
      //      ExtendedPatternCharacter
      // ExtendedPatternCharacter ::
      //      SourceCharacter but not one of ^$\.*+?()[|

      var res;

      // jviereck: allow ']', '}' here as well to be compatible with browser's
      //   implementations: ']'.match(/]/);
      if (res = matchReg(/^[^^$\\.*+?()[\]{}|]/)) {
        //      PatternCharacter
        return createCharacter(res);
      }
      else if (!hasUnicodeFlag && (res = matchReg(/^(?:]|})/))) {
        //      ExtendedPatternCharacter, first part. See parseTerm.
        return createCharacter(res);
      }
      else if (match('.')) {
        //      .
        return createDot();
      }
      else if (match('\\')) {
        //      \ AtomEscape
        res = parseAtomEscape();
        if (!res) {
          if (!hasUnicodeFlag && lookahead() == 'c') {
            // B.1.4 ExtendedAtom
            // \[lookahead = c]
            return createValue('symbol', 92, pos - 1, pos);
          }
          bail('atomEscape');
        }
        return res;
      }
      else if (res = parseCharacterClass()) {
        return res;
      }
      else if (features.lookbehind && (res = parseGroup('(?<=', 'lookbehind', '(?<!', 'negativeLookbehind'))) {
        return res;
      }
      else if (features.namedGroups && match("(?<")) {
        var name = parseIdentifier();
        skip(">");
        var group = finishGroup("normal", name.range[0] - 3);
        group.name = name;
        return group;
      }
      else {
        //      ( Disjunction )
        //      ( ? : Disjunction )
        return parseGroup('(?:', 'ignore', '(', 'normal');
      }
    }

    function parseUnicodeSurrogatePairEscape(firstEscape) {
      if (hasUnicodeFlag) {
        var first, second;
        if (firstEscape.kind == 'unicodeEscape' &&
          (first = firstEscape.codePoint) >= 0xD800 && first <= 0xDBFF &&
          current('\\') && next('u') ) {
          var prevPos = pos;
          pos++;
          var secondEscape = parseClassEscape();
          if (secondEscape.kind == 'unicodeEscape' &&
            (second = secondEscape.codePoint) >= 0xDC00 && second <= 0xDFFF) {
            // Unicode surrogate pair
            firstEscape.range[1] = secondEscape.range[1];
            firstEscape.codePoint = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            firstEscape.type = 'value';
            firstEscape.kind = 'unicodeCodePointEscape';
            addRaw(firstEscape);
          }
          else {
            pos = prevPos;
          }
        }
      }
      return firstEscape;
    }

    function parseClassEscape() {
      return parseAtomEscape(true);
    }

    function parseAtomEscape(insideCharacterClass) {
      // AtomEscape ::
      //      DecimalEscape
      //      CharacterEscape
      //      CharacterClassEscape
      //      k GroupName

      var res, from = pos;

      res = parseDecimalEscape() || parseNamedReference();
      if (res) {
        return res;
      }

      // For ClassEscape
      if (insideCharacterClass) {
        //     b
        if (match('b')) {
          // 15.10.2.19
          // The production ClassEscape :: b evaluates by returning the
          // CharSet containing the one character <BS> (Unicode value 0008).
          return createEscaped('singleEscape', 0x0008, '\\b');
        } else if (match('B')) {
          bail('\\B not possible inside of CharacterClass', '', from);
        } else if (!hasUnicodeFlag && (res = matchReg(/^c([0-9])/))) {
          // B.1.4
          // c ClassControlLetter, ClassControlLetter = DecimalDigit
          return createEscaped('controlLetter', res[1] + 16, res[1], 2);
        } else if (!hasUnicodeFlag && (res = matchReg(/^c_/))) {
          // B.1.4
          // c ClassControlLetter, ClassControlLetter = _
          return createEscaped('controlLetter', 31, '_', 2);
        }
        //     [+U] -
        if (hasUnicodeFlag && match('-')) {
          return createEscaped('singleEscape', 0x002d, '\\-');
        }
      }

      res = parseCharacterClassEscape() || parseCharacterEscape();

      return res;
    }


    function parseDecimalEscape() {
      // DecimalEscape ::
      //      DecimalIntegerLiteral [lookahead ∉ DecimalDigit]

      var res, match;

      if (res = matchReg(/^(?!0)\d+/)) {
        match = res[0];
        var refIdx = parseInt(res[0], 10);
        if (refIdx <= closedCaptureCounter) {
          // If the number is smaller than the normal-groups found so
          // far, then it is a reference...
          return createReference(res[0]);
        } else {
          // ... otherwise it needs to be interpreted as a octal (if the
          // number is in an octal format). If it is NOT octal format,
          // then the slash is ignored and the number is matched later
          // as normal characters.

          // Recall the negative decision to decide if the input must be parsed
          // a second time with the total normal-groups.
          backrefDenied.push(refIdx);

          // Reset the position again, as maybe only parts of the previous
          // matched numbers are actual octal numbers. E.g. in '019' only
          // the '01' should be matched.
          incr(-res[0].length);
          if (res = matchReg(/^[0-7]{1,3}/)) {
            return createEscaped('octal', parseInt(res[0], 8), res[0], 1);
          } else {
            // If we end up here, we have a case like /\91/. Then the
            // first slash is to be ignored and the 9 & 1 to be treated
            // like ordinary characters. Create a character for the
            // first number only here - other number-characters
            // (if available) will be matched later.
            res = createCharacter(matchReg(/^[89]/));
            return updateRawStart(res, res.range[0] - 1);
          }
        }
      }
      // Only allow octal numbers in the following. All matched numbers start
      // with a zero (if the do not, the previous if-branch is executed).
      // If the number is not octal format and starts with zero (e.g. `091`)
      // then only the zeros `0` is treated here and the `91` are ordinary
      // characters.
      // Example:
      //   /\091/.exec('\091')[0].length === 3
      else if (res = matchReg(/^[0-7]{1,3}/)) {
        match = res[0];
        if (/^0{1,3}$/.test(match)) {
          // If they are all zeros, then only take the first one.
          return createEscaped('null', 0x0000, '0', match.length);
        } else {
          return createEscaped('octal', parseInt(match, 8), match, 1);
        }
      }
      return false;
    }

    function parseCharacterClassEscape() {
      // CharacterClassEscape :: one of d D s S w W
      var res;
      if (res = matchReg(/^[dDsSwW]/)) {
        return createCharacterClassEscape(res[0]);
      } else if (features.unicodePropertyEscape && (hasUnicodeFlag || hasUnicodeSetFlag) && (res = matchReg(/^([pP])\{([^\}]+)\}/))) {
        // https://github.com/jviereck/regjsparser/issues/77
        return addRaw({
          type: 'unicodePropertyEscape',
          negative: res[1] === 'P',
          value: res[2],
          range: [res.range[0] - 1, res.range[1]],
          raw: res[0]
        });
      }
      return false;
    }

    function parseNamedReference() {
      if (features.namedGroups && matchReg(/^k<(?=.*?>)/)) {
        var name = parseIdentifier();
        skip('>');
        return createNamedReference(name);
      }
    }

    function parseRegExpUnicodeEscapeSequence() {
      var res;
      if (res = matchReg(/^u([0-9a-fA-F]{4})/)) {
        // UnicodeEscapeSequence
        return parseUnicodeSurrogatePairEscape(
          createEscaped('unicodeEscape', parseInt(res[1], 16), res[1], 2)
        );
      } else if (hasUnicodeFlag && (res = matchReg(/^u\{([0-9a-fA-F]+)\}/))) {
        // RegExpUnicodeEscapeSequence (ES6 Unicode code point escape)
        return createEscaped('unicodeCodePointEscape', parseInt(res[1], 16), res[1], 4);
      }
    }

    function parseCharacterEscape() {
      // CharacterEscape ::
      //      ControlEscape
      //      c ControlLetter
      //      HexEscapeSequence
      //      UnicodeEscapeSequence
      //      IdentityEscape

      var res;
      var from = pos;
      if (res = matchReg(/^[fnrtv]/)) {
        // ControlEscape
        var codePoint = 0;
        switch (res[0]) {
          case 't': codePoint = 0x009; break;
          case 'n': codePoint = 0x00A; break;
          case 'v': codePoint = 0x00B; break;
          case 'f': codePoint = 0x00C; break;
          case 'r': codePoint = 0x00D; break;
        }
        return createEscaped('singleEscape', codePoint, '\\' + res[0]);
      } else if (res = matchReg(/^c([a-zA-Z])/)) {
        // c ControlLetter
        return createEscaped('controlLetter', res[1].charCodeAt(0) % 32, res[1], 2);
      } else if (res = matchReg(/^x([0-9a-fA-F]{2})/)) {
        // HexEscapeSequence
        return createEscaped('hexadecimalEscape', parseInt(res[1], 16), res[1], 2);
      } else if (res = parseRegExpUnicodeEscapeSequence()) {
        if (!res || res.codePoint > 0x10FFFF) {
          bail('Invalid escape sequence', null, from, pos);
        }
        return res;
      } else {
        // IdentityEscape
        return parseIdentityEscape();
      }
    }

    function parseIdentifierAtom(check) {
      var ch = lookahead();
      var from = pos;
      if (ch === '\\') {
        incr();
        var esc = parseRegExpUnicodeEscapeSequence();
        if (!esc || !check(esc.codePoint)) {
          bail('Invalid escape sequence', null, from, pos);
        }
        return fromCodePoint(esc.codePoint);
      }
      var code = ch.charCodeAt(0);
      if (code >= 0xD800 && code <= 0xDBFF) {
        ch += str[pos + 1];
        var second = ch.charCodeAt(1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          // Unicode surrogate pair
          code = (code - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
      }
      if (!check(code)) return;
      incr();
      if (code > 0xFFFF) incr();
      return ch;
    }

    function parseIdentifier() {
      // RegExpIdentifierName ::
      //      RegExpIdentifierStart
      //      RegExpIdentifierName RegExpIdentifierContinue
      //
      // RegExpIdentifierStart ::
      //      UnicodeIDStart
      //      $
      //      _
      //      \ RegExpUnicodeEscapeSequence
      //
      // RegExpIdentifierContinue ::
      //      UnicodeIDContinue
      //      $
      //      _
      //      \ RegExpUnicodeEscapeSequence
      //      <ZWNJ>
      //      <ZWJ>

      var start = pos;
      var res = parseIdentifierAtom(isIdentifierStart);
      if (!res) {
        bail('Invalid identifier');
      }

      var ch;
      while (ch = parseIdentifierAtom(isIdentifierPart)) {
        res += ch;
      }

      return addRaw({
        type: 'identifier',
        value: res,
        range: [start, pos]
      });
    }

    function isIdentifierStart(ch) {
      // Generated by `tools/generate-identifier-regex.js`.
      var NonAsciiIdentifierStart = /[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;

      return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
        (ch >= 65 && ch <= 90) ||         // A..Z
        (ch >= 97 && ch <= 122) ||        // a..z
        ((ch >= 0x80) && NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    // Taken from the Esprima parser.
    function isIdentifierPart(ch) {
      // Generated by `tools/generate-identifier-regex.js`.
      var NonAsciiIdentifierPartOnly = /[0-9_\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDD30-\uDD39\uDF46-\uDF50]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC66-\uDC6F\uDC7F-\uDC82\uDCB0-\uDCBA\uDCF0-\uDCF9\uDD00-\uDD02\uDD27-\uDD34\uDD36-\uDD3F\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDDD0-\uDDD9\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDC50-\uDC59\uDC5E\uDCB0-\uDCC3\uDCD0-\uDCD9\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDE50-\uDE59\uDEAB-\uDEB7\uDEC0-\uDEC9\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDC2C-\uDC3A\uDCE0-\uDCE9\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC50-\uDC59\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD50-\uDD59\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDDA0-\uDDA9\uDEF3-\uDEF6]|\uD81A[\uDE60-\uDE69\uDEF0-\uDEF4\uDF30-\uDF36\uDF50-\uDF59]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A\uDD50-\uDD59]|\uDB40[\uDD00-\uDDEF]/;

      return isIdentifierStart(ch) ||
        (ch >= 48 && ch <= 57) ||         // 0..9
        ((ch >= 0x80) && NonAsciiIdentifierPartOnly.test(fromCodePoint(ch)));
    }

    function parseIdentityEscape() {
      // IdentityEscape ::
      //      [+U] SyntaxCharacter
      //      [+U] /
      //      [~U] SourceCharacterIdentityEscape[?N]
      // SourceCharacterIdentityEscape[?N] ::
      //      [~N] SourceCharacter but not c
      //      [+N] SourceCharacter but not one of c or k


      var tmp;
      var l = lookahead();
      if (
        (hasUnicodeFlag && /[\^\$\.\*\+\?\(\)\\\[\]\{\}\|\/]/.test(l)) ||
        (!hasUnicodeFlag && l !== "c")
      ) {
        if (l === "k" && features.lookbehind) {
          return null;
        }
        tmp = incr();
        return createEscaped('identifier', tmp.charCodeAt(0), tmp, 1);
      }

      return null;
    }

    function parseCharacterClass() {
      // CharacterClass ::
      //      [ [lookahead ∉ {^}] ClassRanges ]
      //      [ ^ ClassRanges ]

      var res, from = pos;
      if (res = matchReg(/^\[\^/)) {
        res = parseClassRanges();
        skip(']');
        return createCharacterClass(res, true, from, pos);
      } else if (match('[')) {
        res = parseClassRanges();
        skip(']');
        return createCharacterClass(res, false, from, pos);
      }

      return null;
    }

    function parseClassRanges() {
      // ClassRanges ::
      //      [empty]
      //      [~V] NonemptyClassRanges
      //      [+V] ClassContents

      var res;
      if (current(']')) {
        // Empty array means nothing inside of the ClassRange.
        return { kind: 'union', body: [] };
      } else if (hasUnicodeSetFlag) {
        return parseClassContents();
      } else {
        res = parseNonemptyClassRanges();
        if (!res) {
          bail('nonEmptyClassRanges');
        }
        return { kind: 'union', body: res };
      }
    }

    function parseHelperClassRanges(atom) {
      var from, to, res, atomTo, dash;
      if (current('-') && !next(']')) {
        // ClassAtom - ClassAtom ClassRanges
        from = atom.range[0];
        dash = createCharacter(match('-'));

        atomTo = parseClassAtom();
        if (!atomTo) {
          bail('classAtom');
        }
        to = pos;

        // Parse the next class range if exists.
        var classRanges = parseClassRanges();
        if (!classRanges) {
          bail('classRanges');
        }

        // Check if both the from and atomTo have codePoints.
        if (!('codePoint' in atom) || !('codePoint' in atomTo)) {
            if (!hasUnicodeFlag) {
                // If not, don't create a range but treat them as
                // `atom` `-` `atom` instead.
                //
                // SEE: https://tc39.es/ecma262/#sec-regular-expression-patterns-semantics
                //   NonemptyClassRanges::ClassAtom-ClassAtomClassRanges
                //   CharacterRangeOrUnion
                res = [atom, dash, atomTo];
            } else {
                // With unicode flag, both sides must have codePoints if
                // one side has a codePoint.
                //
                // SEE: https://tc39.es/ecma262/#sec-patterns-static-semantics-early-errors
                //   NonemptyClassRanges :: ClassAtom - ClassAtom ClassRanges
                bail('invalid character class');
            }
        } else {
            res = [createClassRange(atom, atomTo, from, to)];
        }

        if (classRanges.type === 'empty') {
          return res;
        }
        return res.concat(classRanges.body);
      }

      res = parseNonemptyClassRangesNoDash();
      if (!res) {
        bail('nonEmptyClassRangesNoDash');
      }

      return [atom].concat(res);
    }

    function parseNonemptyClassRanges() {
      // NonemptyClassRanges ::
      //      ClassAtom
      //      ClassAtom NonemptyClassRangesNoDash
      //      ClassAtom - ClassAtom ClassRanges

      var atom = parseClassAtom();
      if (!atom) {
        bail('classAtom');
      }

      if (current(']')) {
        // ClassAtom
        return [atom];
      }

      // ClassAtom NonemptyClassRangesNoDash
      // ClassAtom - ClassAtom ClassRanges
      return parseHelperClassRanges(atom);
    }

    function parseNonemptyClassRangesNoDash() {
      // NonemptyClassRangesNoDash ::
      //      ClassAtom
      //      ClassAtomNoDash NonemptyClassRangesNoDash
      //      ClassAtomNoDash - ClassAtom ClassRanges

      var res = parseClassAtom();
      if (!res) {
        bail('classAtom');
      }
      if (current(']')) {
        //      ClassAtom
        return res;
      }

      // ClassAtomNoDash NonemptyClassRangesNoDash
      // ClassAtomNoDash - ClassAtom ClassRanges
      return parseHelperClassRanges(res);
    }

    function parseClassAtom() {
      // ClassAtom ::
      //      -
      //      ClassAtomNoDash
      if (match('-')) {
        return createCharacter('-');
      } else {
        return parseClassAtomNoDash();
      }
    }

    function parseClassAtomNoDash() {
      // ClassAtomNoDash ::
      //      SourceCharacter but not one of \ or ] or -
      //      \ ClassEscape

      var res;
      if (res = matchReg(/^[^\\\]-]/)) {
        return createCharacter(res[0]);
      } else if (match('\\')) {
        res = parseClassEscape();
        if (!res) {
          bail('classEscape');
        }

        return parseUnicodeSurrogatePairEscape(res);
      }
    }

    function parseClassContents() {
      // ClassContents ::
      //      ClassUnion
      //      ClassIntersection
      //      ClassSubtraction
      //
      // ClassUnion ::
      //      ClassRange ClassUnion?
      //      ClassOperand ClassUnion?
      //
      // ClassIntersection ::
      //      ClassOperand && [lookahead ≠ &] ClassOperand
      //      ClassIntersection && [lookahead ≠ &] ClassOperand
      //
      // ClassSubtraction ::
      //      ClassOperand -- ClassOperand
      //      ClassSubtraction -- ClassOperand

      var body = [];
      var kind;
      var from = pos;

      var operand = parseClassOperand(/* allowRanges*/ true);
      body.push(operand);

      if (operand.type === 'classRange') {
        kind = 'union';
      } else if (current('&')) {
        kind = 'intersection';
      } else if (current('-')) {
        kind = 'subtraction';
      } else {
        kind = 'union';
      }

      while (!current(']')) {
        if (kind === 'intersection') {
          skip('&');
          skip('&');
          if (current('&')) {
            bail('&& cannot be followed by &. Wrap it in parentheses: &&(&).');
          }
        } else if (kind === 'subtraction') {
          skip('-');
          skip('-');
        }

        operand = parseClassOperand(/* allowRanges*/ kind === 'union');
        body.push(operand);
      }

      return { kind: kind, body: body };
    }

    function parseClassOperand(allowRanges) {
      // ClassOperand ::
      //      ClassCharacter
      //      ClassStrings
      //      NestedClass
      //
      // NestedClass ::
      //      [ [lookahead ≠ ^] ClassRanges[+U,+V] ]
      //      [ ^ ClassRanges[+U,+V] ]
      //      \ CharacterClassEscape[+U, +V]
      //
      // ClassRange ::
      //      ClassCharacter - ClassCharacter
      //
      // ClassCharacter ::
      //      [lookahead ∉ ClassReservedDouble] SourceCharacter but not ClassSyntaxCharacter
      //      \ CharacterEscape[+U]
      //      \ ClassHalfOfDouble
      //      \ b
      //
      // ClassSyntaxCharacter ::
      //      one of ( ) [ ] { } / - \ |

      var from = pos;
      var start, res;

      if (match('\\')) {
        if (res = parseCharacterClassEscape()) {
          start = res;
        } else if (res = parseClassCharacterEscapedHelper()) {
          // ClassOperand ::
          //      ...
          //      NestedClass
          //
          // NestedClass ::
          //      ...
          //      \ CharacterClassEscape[+U, +V]
          return res;
        } else {
          bail('Invalid escape', '\\' + lookahead(), from);
        }
      } else if (res = parseClassCharacterUnescapedHelper()) {
        start = res;
      } else if (res = parseClassStrings() || parseCharacterClass()) {
        // ClassOperand ::
        //      ...
        //      ClassStrings
        //      NestedClass
        //
        // NestedClass ::
        //      [ [lookahead ≠ ^] ClassRanges[+U,+V] ]
        //      [ ^ ClassRanges[+U,+V] ]
        //      ...
        return res;
      } else {
        bail('Invalid character', lookahead());
      }

      if (allowRanges && current('-') && !next('-')) {
        skip('-');

        if (res = parseClassCharacter()) {
          // ClassRange ::
          //      ClassCharacter - ClassCharacter
          return createClassRange(start, res, from, pos);
        }

        bail('Invalid range end', lookahead());
      }

      // ClassOperand ::
      //      ClassCharacter
      //      ...
      return start;
    }

    function parseClassCharacter() {
      // ClassCharacter ::
      //      [lookahead ∉ ClassReservedDouble] SourceCharacter but not ClassSyntaxCharacter
      //      \ CharacterEscape[+U]
      //      \ ClassHalfOfDouble
      //      \ b

      if (match('\\')) {
        if (res = parseClassCharacterEscapedHelper()) {
          return res;
        } else {
          bail('Invalid escape', '\\' + lookahead(), from);
        }
      }

      return parseClassCharacterUnescapedHelper();
    }

    function parseClassCharacterUnescapedHelper() {
      // ClassCharacter ::
      //      [lookahead ∉ ClassReservedDouble] SourceCharacter but not ClassSyntaxCharacter
      //      ...

      var res;
      if (res = matchReg(/^[^()[\]{}/\-\\|]/)) {
        return createCharacter(res);
      };
    }

    function parseClassCharacterEscapedHelper() {
      // ClassCharacter ::
      //      ...
      //      \ CharacterEscape[+U]
      //      \ ClassHalfOfDouble
      //      \ b

      if (match('b')) {
        return createEscaped('singleEscape', 0x0008, '\\b');
      } else if (match('B')) {
        bail('\\B not possible inside of ClassContents', '', pos - 2);
      } else if (res = matchReg(/^[&\-!#%,:;<=>@_`~]/)) {
        return createEscaped('identifier', res[0].codePointAt(0), res[0]);
      } else if (res = parseCharacterEscape()) {
        return res;
      } else {
        return null;
      }
    }

    function parseClassStrings() {
      // ClassStrings ::
      //      ( ClassString MoreClassStrings? )

      var res = [];
      var from = pos;

      if (!match('(')) {
        return null;
      }

      do {
        res.push(parseClassString());
      } while (match('|'));

      skip(')');

      return createClassStrings(res, from, pos);
    }

    function parseClassString() {
      // ClassString ::
      //      [empty]
      //      NonEmptyClassString
      //
      // NonEmptyClassString ::
      //      ClassCharacter NonEmptyClassString?

      var res = [], from = pos;
      var char;

      while (char = parseClassCharacter()) {
        res.push(char);
      }

      return createClassString(res, from, pos);
    }

    function bail(message, details, from, to) {
      from = from == null ? pos : from;
      to = to == null ? from : to;

      var contextStart = Math.max(0, from - 10);
      var contextEnd = Math.min(to + 10, str.length);

      // Output a bit of context and a line pointing to where our error is.
      //
      // We are assuming that there are no actual newlines in the content as this is a regular expression.
      var context = '    ' + str.substring(contextStart, contextEnd);
      var pointer = '    ' + new Array(from - contextStart + 1).join(' ') + '^';

      throw SyntaxError(message + ' at position ' + from + (details ? ': ' + details : '') + '\n' + context + '\n' + pointer);
    }

    var backrefDenied = [];
    var closedCaptureCounter = 0;
    var firstIteration = true;
    var hasUnicodeFlag = (flags || "").indexOf("u") !== -1;
    var hasUnicodeSetFlag = (flags || "").indexOf("v") !== -1;
    var pos = 0;

    if (hasUnicodeSetFlag && !features.unicodeSet) {
      throw new Error('The "v" flag is only supported when the .unicodeSet option is enabled.');
    }

    if (hasUnicodeFlag && hasUnicodeSetFlag) {
      throw new Error('The "u" and "v" flags are mutually exclusive.');
    }

    // Convert the input to a string and treat the empty string special.
    str = String(str);
    if (str === '') {
      str = '(?:)';
    }

    var result = parseDisjunction();

    if (result.range[1] !== str.length) {
      bail('Could not parse entire input - got stuck', '', result.range[1]);
    }

    // The spec requires to interpret the `\2` in `/\2()()/` as backreference.
    // As the parser collects the number of capture groups as the string is
    // parsed it is impossible to make these decisions at the point when the
    // `\2` is handled. In case the local decision turns out to be wrong after
    // the parsing has finished, the input string is parsed a second time with
    // the total number of capture groups set.
    //
    // SEE: https://github.com/jviereck/regjsparser/issues/70
    for (var i = 0; i < backrefDenied.length; i++) {
      if (backrefDenied[i] <= closedCaptureCounter) {
        // Parse the input a second time.
        pos = 0;
        firstIteration = false;
        return parseDisjunction();
      }
    }

    return result;
  }

  var regjsparser = {
    parse: parse
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = regjsparser;
  } else {
    window.regjsparser = regjsparser;
  }

}());

},{}],6:[function(require,module,exports){
module.exports = new Set([
	// Non-binary properties:
	'General_Category',
	'Script',
	'Script_Extensions',
	// Binary properties:
	'Alphabetic',
	'Any',
	'ASCII',
	'ASCII_Hex_Digit',
	'Assigned',
	'Bidi_Control',
	'Bidi_Mirrored',
	'Case_Ignorable',
	'Cased',
	'Changes_When_Casefolded',
	'Changes_When_Casemapped',
	'Changes_When_Lowercased',
	'Changes_When_NFKC_Casefolded',
	'Changes_When_Titlecased',
	'Changes_When_Uppercased',
	'Dash',
	'Default_Ignorable_Code_Point',
	'Deprecated',
	'Diacritic',
	'Emoji',
	'Emoji_Component',
	'Emoji_Modifier',
	'Emoji_Modifier_Base',
	'Emoji_Presentation',
	'Extended_Pictographic',
	'Extender',
	'Grapheme_Base',
	'Grapheme_Extend',
	'Hex_Digit',
	'ID_Continue',
	'ID_Start',
	'Ideographic',
	'IDS_Binary_Operator',
	'IDS_Trinary_Operator',
	'Join_Control',
	'Logical_Order_Exception',
	'Lowercase',
	'Math',
	'Noncharacter_Code_Point',
	'Pattern_Syntax',
	'Pattern_White_Space',
	'Quotation_Mark',
	'Radical',
	'Regional_Indicator',
	'Sentence_Terminal',
	'Soft_Dotted',
	'Terminal_Punctuation',
	'Unified_Ideograph',
	'Uppercase',
	'Variation_Selector',
	'White_Space',
	'XID_Continue',
	'XID_Start'
]);

},{}],7:[function(require,module,exports){
'use strict';

const canonicalProperties = require('unicode-canonical-property-names-ecmascript');
const propertyAliases = require('unicode-property-aliases-ecmascript');

const matchProperty = function(property) {
	if (canonicalProperties.has(property)) {
		return property;
	}
	if (propertyAliases.has(property)) {
		return propertyAliases.get(property);
	}
	throw new Error(`Unknown property: ${ property }`);
};

module.exports = matchProperty;

},{"unicode-canonical-property-names-ecmascript":6,"unicode-property-aliases-ecmascript":10}],8:[function(require,module,exports){
module.exports = new Map([
	['General_Category', new Map([
		['C', 'Other'],
		['Cc', 'Control'],
		['cntrl', 'Control'],
		['Cf', 'Format'],
		['Cn', 'Unassigned'],
		['Co', 'Private_Use'],
		['Cs', 'Surrogate'],
		['L', 'Letter'],
		['LC', 'Cased_Letter'],
		['Ll', 'Lowercase_Letter'],
		['Lm', 'Modifier_Letter'],
		['Lo', 'Other_Letter'],
		['Lt', 'Titlecase_Letter'],
		['Lu', 'Uppercase_Letter'],
		['M', 'Mark'],
		['Combining_Mark', 'Mark'],
		['Mc', 'Spacing_Mark'],
		['Me', 'Enclosing_Mark'],
		['Mn', 'Nonspacing_Mark'],
		['N', 'Number'],
		['Nd', 'Decimal_Number'],
		['digit', 'Decimal_Number'],
		['Nl', 'Letter_Number'],
		['No', 'Other_Number'],
		['P', 'Punctuation'],
		['punct', 'Punctuation'],
		['Pc', 'Connector_Punctuation'],
		['Pd', 'Dash_Punctuation'],
		['Pe', 'Close_Punctuation'],
		['Pf', 'Final_Punctuation'],
		['Pi', 'Initial_Punctuation'],
		['Po', 'Other_Punctuation'],
		['Ps', 'Open_Punctuation'],
		['S', 'Symbol'],
		['Sc', 'Currency_Symbol'],
		['Sk', 'Modifier_Symbol'],
		['Sm', 'Math_Symbol'],
		['So', 'Other_Symbol'],
		['Z', 'Separator'],
		['Zl', 'Line_Separator'],
		['Zp', 'Paragraph_Separator'],
		['Zs', 'Space_Separator'],
		['Other', 'Other'],
		['Control', 'Control'],
		['Format', 'Format'],
		['Unassigned', 'Unassigned'],
		['Private_Use', 'Private_Use'],
		['Surrogate', 'Surrogate'],
		['Letter', 'Letter'],
		['Cased_Letter', 'Cased_Letter'],
		['Lowercase_Letter', 'Lowercase_Letter'],
		['Modifier_Letter', 'Modifier_Letter'],
		['Other_Letter', 'Other_Letter'],
		['Titlecase_Letter', 'Titlecase_Letter'],
		['Uppercase_Letter', 'Uppercase_Letter'],
		['Mark', 'Mark'],
		['Spacing_Mark', 'Spacing_Mark'],
		['Enclosing_Mark', 'Enclosing_Mark'],
		['Nonspacing_Mark', 'Nonspacing_Mark'],
		['Number', 'Number'],
		['Decimal_Number', 'Decimal_Number'],
		['Letter_Number', 'Letter_Number'],
		['Other_Number', 'Other_Number'],
		['Punctuation', 'Punctuation'],
		['Connector_Punctuation', 'Connector_Punctuation'],
		['Dash_Punctuation', 'Dash_Punctuation'],
		['Close_Punctuation', 'Close_Punctuation'],
		['Final_Punctuation', 'Final_Punctuation'],
		['Initial_Punctuation', 'Initial_Punctuation'],
		['Other_Punctuation', 'Other_Punctuation'],
		['Open_Punctuation', 'Open_Punctuation'],
		['Symbol', 'Symbol'],
		['Currency_Symbol', 'Currency_Symbol'],
		['Modifier_Symbol', 'Modifier_Symbol'],
		['Math_Symbol', 'Math_Symbol'],
		['Other_Symbol', 'Other_Symbol'],
		['Separator', 'Separator'],
		['Line_Separator', 'Line_Separator'],
		['Paragraph_Separator', 'Paragraph_Separator'],
		['Space_Separator', 'Space_Separator']
	])],
	['Script', new Map([
		['Adlm', 'Adlam'],
		['Aghb', 'Caucasian_Albanian'],
		['Ahom', 'Ahom'],
		['Arab', 'Arabic'],
		['Armi', 'Imperial_Aramaic'],
		['Armn', 'Armenian'],
		['Avst', 'Avestan'],
		['Bali', 'Balinese'],
		['Bamu', 'Bamum'],
		['Bass', 'Bassa_Vah'],
		['Batk', 'Batak'],
		['Beng', 'Bengali'],
		['Bhks', 'Bhaiksuki'],
		['Bopo', 'Bopomofo'],
		['Brah', 'Brahmi'],
		['Brai', 'Braille'],
		['Bugi', 'Buginese'],
		['Buhd', 'Buhid'],
		['Cakm', 'Chakma'],
		['Cans', 'Canadian_Aboriginal'],
		['Cari', 'Carian'],
		['Cham', 'Cham'],
		['Cher', 'Cherokee'],
		['Chrs', 'Chorasmian'],
		['Copt', 'Coptic'],
		['Qaac', 'Coptic'],
		['Cpmn', 'Cypro_Minoan'],
		['Cprt', 'Cypriot'],
		['Cyrl', 'Cyrillic'],
		['Deva', 'Devanagari'],
		['Diak', 'Dives_Akuru'],
		['Dogr', 'Dogra'],
		['Dsrt', 'Deseret'],
		['Dupl', 'Duployan'],
		['Egyp', 'Egyptian_Hieroglyphs'],
		['Elba', 'Elbasan'],
		['Elym', 'Elymaic'],
		['Ethi', 'Ethiopic'],
		['Geor', 'Georgian'],
		['Glag', 'Glagolitic'],
		['Gong', 'Gunjala_Gondi'],
		['Gonm', 'Masaram_Gondi'],
		['Goth', 'Gothic'],
		['Gran', 'Grantha'],
		['Grek', 'Greek'],
		['Gujr', 'Gujarati'],
		['Guru', 'Gurmukhi'],
		['Hang', 'Hangul'],
		['Hani', 'Han'],
		['Hano', 'Hanunoo'],
		['Hatr', 'Hatran'],
		['Hebr', 'Hebrew'],
		['Hira', 'Hiragana'],
		['Hluw', 'Anatolian_Hieroglyphs'],
		['Hmng', 'Pahawh_Hmong'],
		['Hmnp', 'Nyiakeng_Puachue_Hmong'],
		['Hrkt', 'Katakana_Or_Hiragana'],
		['Hung', 'Old_Hungarian'],
		['Ital', 'Old_Italic'],
		['Java', 'Javanese'],
		['Kali', 'Kayah_Li'],
		['Kana', 'Katakana'],
		['Khar', 'Kharoshthi'],
		['Khmr', 'Khmer'],
		['Khoj', 'Khojki'],
		['Kits', 'Khitan_Small_Script'],
		['Knda', 'Kannada'],
		['Kthi', 'Kaithi'],
		['Lana', 'Tai_Tham'],
		['Laoo', 'Lao'],
		['Latn', 'Latin'],
		['Lepc', 'Lepcha'],
		['Limb', 'Limbu'],
		['Lina', 'Linear_A'],
		['Linb', 'Linear_B'],
		['Lisu', 'Lisu'],
		['Lyci', 'Lycian'],
		['Lydi', 'Lydian'],
		['Mahj', 'Mahajani'],
		['Maka', 'Makasar'],
		['Mand', 'Mandaic'],
		['Mani', 'Manichaean'],
		['Marc', 'Marchen'],
		['Medf', 'Medefaidrin'],
		['Mend', 'Mende_Kikakui'],
		['Merc', 'Meroitic_Cursive'],
		['Mero', 'Meroitic_Hieroglyphs'],
		['Mlym', 'Malayalam'],
		['Modi', 'Modi'],
		['Mong', 'Mongolian'],
		['Mroo', 'Mro'],
		['Mtei', 'Meetei_Mayek'],
		['Mult', 'Multani'],
		['Mymr', 'Myanmar'],
		['Nand', 'Nandinagari'],
		['Narb', 'Old_North_Arabian'],
		['Nbat', 'Nabataean'],
		['Newa', 'Newa'],
		['Nkoo', 'Nko'],
		['Nshu', 'Nushu'],
		['Ogam', 'Ogham'],
		['Olck', 'Ol_Chiki'],
		['Orkh', 'Old_Turkic'],
		['Orya', 'Oriya'],
		['Osge', 'Osage'],
		['Osma', 'Osmanya'],
		['Ougr', 'Old_Uyghur'],
		['Palm', 'Palmyrene'],
		['Pauc', 'Pau_Cin_Hau'],
		['Perm', 'Old_Permic'],
		['Phag', 'Phags_Pa'],
		['Phli', 'Inscriptional_Pahlavi'],
		['Phlp', 'Psalter_Pahlavi'],
		['Phnx', 'Phoenician'],
		['Plrd', 'Miao'],
		['Prti', 'Inscriptional_Parthian'],
		['Rjng', 'Rejang'],
		['Rohg', 'Hanifi_Rohingya'],
		['Runr', 'Runic'],
		['Samr', 'Samaritan'],
		['Sarb', 'Old_South_Arabian'],
		['Saur', 'Saurashtra'],
		['Sgnw', 'SignWriting'],
		['Shaw', 'Shavian'],
		['Shrd', 'Sharada'],
		['Sidd', 'Siddham'],
		['Sind', 'Khudawadi'],
		['Sinh', 'Sinhala'],
		['Sogd', 'Sogdian'],
		['Sogo', 'Old_Sogdian'],
		['Sora', 'Sora_Sompeng'],
		['Soyo', 'Soyombo'],
		['Sund', 'Sundanese'],
		['Sylo', 'Syloti_Nagri'],
		['Syrc', 'Syriac'],
		['Tagb', 'Tagbanwa'],
		['Takr', 'Takri'],
		['Tale', 'Tai_Le'],
		['Talu', 'New_Tai_Lue'],
		['Taml', 'Tamil'],
		['Tang', 'Tangut'],
		['Tavt', 'Tai_Viet'],
		['Telu', 'Telugu'],
		['Tfng', 'Tifinagh'],
		['Tglg', 'Tagalog'],
		['Thaa', 'Thaana'],
		['Thai', 'Thai'],
		['Tibt', 'Tibetan'],
		['Tirh', 'Tirhuta'],
		['Tnsa', 'Tangsa'],
		['Toto', 'Toto'],
		['Ugar', 'Ugaritic'],
		['Vaii', 'Vai'],
		['Vith', 'Vithkuqi'],
		['Wara', 'Warang_Citi'],
		['Wcho', 'Wancho'],
		['Xpeo', 'Old_Persian'],
		['Xsux', 'Cuneiform'],
		['Yezi', 'Yezidi'],
		['Yiii', 'Yi'],
		['Zanb', 'Zanabazar_Square'],
		['Zinh', 'Inherited'],
		['Qaai', 'Inherited'],
		['Zyyy', 'Common'],
		['Zzzz', 'Unknown'],
		['Adlam', 'Adlam'],
		['Caucasian_Albanian', 'Caucasian_Albanian'],
		['Arabic', 'Arabic'],
		['Imperial_Aramaic', 'Imperial_Aramaic'],
		['Armenian', 'Armenian'],
		['Avestan', 'Avestan'],
		['Balinese', 'Balinese'],
		['Bamum', 'Bamum'],
		['Bassa_Vah', 'Bassa_Vah'],
		['Batak', 'Batak'],
		['Bengali', 'Bengali'],
		['Bhaiksuki', 'Bhaiksuki'],
		['Bopomofo', 'Bopomofo'],
		['Brahmi', 'Brahmi'],
		['Braille', 'Braille'],
		['Buginese', 'Buginese'],
		['Buhid', 'Buhid'],
		['Chakma', 'Chakma'],
		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
		['Carian', 'Carian'],
		['Cherokee', 'Cherokee'],
		['Chorasmian', 'Chorasmian'],
		['Coptic', 'Coptic'],
		['Cypro_Minoan', 'Cypro_Minoan'],
		['Cypriot', 'Cypriot'],
		['Cyrillic', 'Cyrillic'],
		['Devanagari', 'Devanagari'],
		['Dives_Akuru', 'Dives_Akuru'],
		['Dogra', 'Dogra'],
		['Deseret', 'Deseret'],
		['Duployan', 'Duployan'],
		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
		['Elbasan', 'Elbasan'],
		['Elymaic', 'Elymaic'],
		['Ethiopic', 'Ethiopic'],
		['Georgian', 'Georgian'],
		['Glagolitic', 'Glagolitic'],
		['Gunjala_Gondi', 'Gunjala_Gondi'],
		['Masaram_Gondi', 'Masaram_Gondi'],
		['Gothic', 'Gothic'],
		['Grantha', 'Grantha'],
		['Greek', 'Greek'],
		['Gujarati', 'Gujarati'],
		['Gurmukhi', 'Gurmukhi'],
		['Hangul', 'Hangul'],
		['Han', 'Han'],
		['Hanunoo', 'Hanunoo'],
		['Hatran', 'Hatran'],
		['Hebrew', 'Hebrew'],
		['Hiragana', 'Hiragana'],
		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
		['Pahawh_Hmong', 'Pahawh_Hmong'],
		['Nyiakeng_Puachue_Hmong', 'Nyiakeng_Puachue_Hmong'],
		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
		['Old_Hungarian', 'Old_Hungarian'],
		['Old_Italic', 'Old_Italic'],
		['Javanese', 'Javanese'],
		['Kayah_Li', 'Kayah_Li'],
		['Katakana', 'Katakana'],
		['Kharoshthi', 'Kharoshthi'],
		['Khmer', 'Khmer'],
		['Khojki', 'Khojki'],
		['Khitan_Small_Script', 'Khitan_Small_Script'],
		['Kannada', 'Kannada'],
		['Kaithi', 'Kaithi'],
		['Tai_Tham', 'Tai_Tham'],
		['Lao', 'Lao'],
		['Latin', 'Latin'],
		['Lepcha', 'Lepcha'],
		['Limbu', 'Limbu'],
		['Linear_A', 'Linear_A'],
		['Linear_B', 'Linear_B'],
		['Lycian', 'Lycian'],
		['Lydian', 'Lydian'],
		['Mahajani', 'Mahajani'],
		['Makasar', 'Makasar'],
		['Mandaic', 'Mandaic'],
		['Manichaean', 'Manichaean'],
		['Marchen', 'Marchen'],
		['Medefaidrin', 'Medefaidrin'],
		['Mende_Kikakui', 'Mende_Kikakui'],
		['Meroitic_Cursive', 'Meroitic_Cursive'],
		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
		['Malayalam', 'Malayalam'],
		['Mongolian', 'Mongolian'],
		['Mro', 'Mro'],
		['Meetei_Mayek', 'Meetei_Mayek'],
		['Multani', 'Multani'],
		['Myanmar', 'Myanmar'],
		['Nandinagari', 'Nandinagari'],
		['Old_North_Arabian', 'Old_North_Arabian'],
		['Nabataean', 'Nabataean'],
		['Nko', 'Nko'],
		['Nushu', 'Nushu'],
		['Ogham', 'Ogham'],
		['Ol_Chiki', 'Ol_Chiki'],
		['Old_Turkic', 'Old_Turkic'],
		['Oriya', 'Oriya'],
		['Osage', 'Osage'],
		['Osmanya', 'Osmanya'],
		['Old_Uyghur', 'Old_Uyghur'],
		['Palmyrene', 'Palmyrene'],
		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
		['Old_Permic', 'Old_Permic'],
		['Phags_Pa', 'Phags_Pa'],
		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
		['Phoenician', 'Phoenician'],
		['Miao', 'Miao'],
		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
		['Rejang', 'Rejang'],
		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
		['Runic', 'Runic'],
		['Samaritan', 'Samaritan'],
		['Old_South_Arabian', 'Old_South_Arabian'],
		['Saurashtra', 'Saurashtra'],
		['SignWriting', 'SignWriting'],
		['Shavian', 'Shavian'],
		['Sharada', 'Sharada'],
		['Siddham', 'Siddham'],
		['Khudawadi', 'Khudawadi'],
		['Sinhala', 'Sinhala'],
		['Sogdian', 'Sogdian'],
		['Old_Sogdian', 'Old_Sogdian'],
		['Sora_Sompeng', 'Sora_Sompeng'],
		['Soyombo', 'Soyombo'],
		['Sundanese', 'Sundanese'],
		['Syloti_Nagri', 'Syloti_Nagri'],
		['Syriac', 'Syriac'],
		['Tagbanwa', 'Tagbanwa'],
		['Takri', 'Takri'],
		['Tai_Le', 'Tai_Le'],
		['New_Tai_Lue', 'New_Tai_Lue'],
		['Tamil', 'Tamil'],
		['Tangut', 'Tangut'],
		['Tai_Viet', 'Tai_Viet'],
		['Telugu', 'Telugu'],
		['Tifinagh', 'Tifinagh'],
		['Tagalog', 'Tagalog'],
		['Thaana', 'Thaana'],
		['Tibetan', 'Tibetan'],
		['Tirhuta', 'Tirhuta'],
		['Tangsa', 'Tangsa'],
		['Ugaritic', 'Ugaritic'],
		['Vai', 'Vai'],
		['Vithkuqi', 'Vithkuqi'],
		['Warang_Citi', 'Warang_Citi'],
		['Wancho', 'Wancho'],
		['Old_Persian', 'Old_Persian'],
		['Cuneiform', 'Cuneiform'],
		['Yezidi', 'Yezidi'],
		['Yi', 'Yi'],
		['Zanabazar_Square', 'Zanabazar_Square'],
		['Inherited', 'Inherited'],
		['Common', 'Common'],
		['Unknown', 'Unknown']
	])],
	['Script_Extensions', new Map([
		['Adlm', 'Adlam'],
		['Aghb', 'Caucasian_Albanian'],
		['Ahom', 'Ahom'],
		['Arab', 'Arabic'],
		['Armi', 'Imperial_Aramaic'],
		['Armn', 'Armenian'],
		['Avst', 'Avestan'],
		['Bali', 'Balinese'],
		['Bamu', 'Bamum'],
		['Bass', 'Bassa_Vah'],
		['Batk', 'Batak'],
		['Beng', 'Bengali'],
		['Bhks', 'Bhaiksuki'],
		['Bopo', 'Bopomofo'],
		['Brah', 'Brahmi'],
		['Brai', 'Braille'],
		['Bugi', 'Buginese'],
		['Buhd', 'Buhid'],
		['Cakm', 'Chakma'],
		['Cans', 'Canadian_Aboriginal'],
		['Cari', 'Carian'],
		['Cham', 'Cham'],
		['Cher', 'Cherokee'],
		['Chrs', 'Chorasmian'],
		['Copt', 'Coptic'],
		['Qaac', 'Coptic'],
		['Cpmn', 'Cypro_Minoan'],
		['Cprt', 'Cypriot'],
		['Cyrl', 'Cyrillic'],
		['Deva', 'Devanagari'],
		['Diak', 'Dives_Akuru'],
		['Dogr', 'Dogra'],
		['Dsrt', 'Deseret'],
		['Dupl', 'Duployan'],
		['Egyp', 'Egyptian_Hieroglyphs'],
		['Elba', 'Elbasan'],
		['Elym', 'Elymaic'],
		['Ethi', 'Ethiopic'],
		['Geor', 'Georgian'],
		['Glag', 'Glagolitic'],
		['Gong', 'Gunjala_Gondi'],
		['Gonm', 'Masaram_Gondi'],
		['Goth', 'Gothic'],
		['Gran', 'Grantha'],
		['Grek', 'Greek'],
		['Gujr', 'Gujarati'],
		['Guru', 'Gurmukhi'],
		['Hang', 'Hangul'],
		['Hani', 'Han'],
		['Hano', 'Hanunoo'],
		['Hatr', 'Hatran'],
		['Hebr', 'Hebrew'],
		['Hira', 'Hiragana'],
		['Hluw', 'Anatolian_Hieroglyphs'],
		['Hmng', 'Pahawh_Hmong'],
		['Hmnp', 'Nyiakeng_Puachue_Hmong'],
		['Hrkt', 'Katakana_Or_Hiragana'],
		['Hung', 'Old_Hungarian'],
		['Ital', 'Old_Italic'],
		['Java', 'Javanese'],
		['Kali', 'Kayah_Li'],
		['Kana', 'Katakana'],
		['Khar', 'Kharoshthi'],
		['Khmr', 'Khmer'],
		['Khoj', 'Khojki'],
		['Kits', 'Khitan_Small_Script'],
		['Knda', 'Kannada'],
		['Kthi', 'Kaithi'],
		['Lana', 'Tai_Tham'],
		['Laoo', 'Lao'],
		['Latn', 'Latin'],
		['Lepc', 'Lepcha'],
		['Limb', 'Limbu'],
		['Lina', 'Linear_A'],
		['Linb', 'Linear_B'],
		['Lisu', 'Lisu'],
		['Lyci', 'Lycian'],
		['Lydi', 'Lydian'],
		['Mahj', 'Mahajani'],
		['Maka', 'Makasar'],
		['Mand', 'Mandaic'],
		['Mani', 'Manichaean'],
		['Marc', 'Marchen'],
		['Medf', 'Medefaidrin'],
		['Mend', 'Mende_Kikakui'],
		['Merc', 'Meroitic_Cursive'],
		['Mero', 'Meroitic_Hieroglyphs'],
		['Mlym', 'Malayalam'],
		['Modi', 'Modi'],
		['Mong', 'Mongolian'],
		['Mroo', 'Mro'],
		['Mtei', 'Meetei_Mayek'],
		['Mult', 'Multani'],
		['Mymr', 'Myanmar'],
		['Nand', 'Nandinagari'],
		['Narb', 'Old_North_Arabian'],
		['Nbat', 'Nabataean'],
		['Newa', 'Newa'],
		['Nkoo', 'Nko'],
		['Nshu', 'Nushu'],
		['Ogam', 'Ogham'],
		['Olck', 'Ol_Chiki'],
		['Orkh', 'Old_Turkic'],
		['Orya', 'Oriya'],
		['Osge', 'Osage'],
		['Osma', 'Osmanya'],
		['Ougr', 'Old_Uyghur'],
		['Palm', 'Palmyrene'],
		['Pauc', 'Pau_Cin_Hau'],
		['Perm', 'Old_Permic'],
		['Phag', 'Phags_Pa'],
		['Phli', 'Inscriptional_Pahlavi'],
		['Phlp', 'Psalter_Pahlavi'],
		['Phnx', 'Phoenician'],
		['Plrd', 'Miao'],
		['Prti', 'Inscriptional_Parthian'],
		['Rjng', 'Rejang'],
		['Rohg', 'Hanifi_Rohingya'],
		['Runr', 'Runic'],
		['Samr', 'Samaritan'],
		['Sarb', 'Old_South_Arabian'],
		['Saur', 'Saurashtra'],
		['Sgnw', 'SignWriting'],
		['Shaw', 'Shavian'],
		['Shrd', 'Sharada'],
		['Sidd', 'Siddham'],
		['Sind', 'Khudawadi'],
		['Sinh', 'Sinhala'],
		['Sogd', 'Sogdian'],
		['Sogo', 'Old_Sogdian'],
		['Sora', 'Sora_Sompeng'],
		['Soyo', 'Soyombo'],
		['Sund', 'Sundanese'],
		['Sylo', 'Syloti_Nagri'],
		['Syrc', 'Syriac'],
		['Tagb', 'Tagbanwa'],
		['Takr', 'Takri'],
		['Tale', 'Tai_Le'],
		['Talu', 'New_Tai_Lue'],
		['Taml', 'Tamil'],
		['Tang', 'Tangut'],
		['Tavt', 'Tai_Viet'],
		['Telu', 'Telugu'],
		['Tfng', 'Tifinagh'],
		['Tglg', 'Tagalog'],
		['Thaa', 'Thaana'],
		['Thai', 'Thai'],
		['Tibt', 'Tibetan'],
		['Tirh', 'Tirhuta'],
		['Tnsa', 'Tangsa'],
		['Toto', 'Toto'],
		['Ugar', 'Ugaritic'],
		['Vaii', 'Vai'],
		['Vith', 'Vithkuqi'],
		['Wara', 'Warang_Citi'],
		['Wcho', 'Wancho'],
		['Xpeo', 'Old_Persian'],
		['Xsux', 'Cuneiform'],
		['Yezi', 'Yezidi'],
		['Yiii', 'Yi'],
		['Zanb', 'Zanabazar_Square'],
		['Zinh', 'Inherited'],
		['Qaai', 'Inherited'],
		['Zyyy', 'Common'],
		['Zzzz', 'Unknown'],
		['Adlam', 'Adlam'],
		['Caucasian_Albanian', 'Caucasian_Albanian'],
		['Arabic', 'Arabic'],
		['Imperial_Aramaic', 'Imperial_Aramaic'],
		['Armenian', 'Armenian'],
		['Avestan', 'Avestan'],
		['Balinese', 'Balinese'],
		['Bamum', 'Bamum'],
		['Bassa_Vah', 'Bassa_Vah'],
		['Batak', 'Batak'],
		['Bengali', 'Bengali'],
		['Bhaiksuki', 'Bhaiksuki'],
		['Bopomofo', 'Bopomofo'],
		['Brahmi', 'Brahmi'],
		['Braille', 'Braille'],
		['Buginese', 'Buginese'],
		['Buhid', 'Buhid'],
		['Chakma', 'Chakma'],
		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
		['Carian', 'Carian'],
		['Cherokee', 'Cherokee'],
		['Chorasmian', 'Chorasmian'],
		['Coptic', 'Coptic'],
		['Cypro_Minoan', 'Cypro_Minoan'],
		['Cypriot', 'Cypriot'],
		['Cyrillic', 'Cyrillic'],
		['Devanagari', 'Devanagari'],
		['Dives_Akuru', 'Dives_Akuru'],
		['Dogra', 'Dogra'],
		['Deseret', 'Deseret'],
		['Duployan', 'Duployan'],
		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
		['Elbasan', 'Elbasan'],
		['Elymaic', 'Elymaic'],
		['Ethiopic', 'Ethiopic'],
		['Georgian', 'Georgian'],
		['Glagolitic', 'Glagolitic'],
		['Gunjala_Gondi', 'Gunjala_Gondi'],
		['Masaram_Gondi', 'Masaram_Gondi'],
		['Gothic', 'Gothic'],
		['Grantha', 'Grantha'],
		['Greek', 'Greek'],
		['Gujarati', 'Gujarati'],
		['Gurmukhi', 'Gurmukhi'],
		['Hangul', 'Hangul'],
		['Han', 'Han'],
		['Hanunoo', 'Hanunoo'],
		['Hatran', 'Hatran'],
		['Hebrew', 'Hebrew'],
		['Hiragana', 'Hiragana'],
		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
		['Pahawh_Hmong', 'Pahawh_Hmong'],
		['Nyiakeng_Puachue_Hmong', 'Nyiakeng_Puachue_Hmong'],
		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
		['Old_Hungarian', 'Old_Hungarian'],
		['Old_Italic', 'Old_Italic'],
		['Javanese', 'Javanese'],
		['Kayah_Li', 'Kayah_Li'],
		['Katakana', 'Katakana'],
		['Kharoshthi', 'Kharoshthi'],
		['Khmer', 'Khmer'],
		['Khojki', 'Khojki'],
		['Khitan_Small_Script', 'Khitan_Small_Script'],
		['Kannada', 'Kannada'],
		['Kaithi', 'Kaithi'],
		['Tai_Tham', 'Tai_Tham'],
		['Lao', 'Lao'],
		['Latin', 'Latin'],
		['Lepcha', 'Lepcha'],
		['Limbu', 'Limbu'],
		['Linear_A', 'Linear_A'],
		['Linear_B', 'Linear_B'],
		['Lycian', 'Lycian'],
		['Lydian', 'Lydian'],
		['Mahajani', 'Mahajani'],
		['Makasar', 'Makasar'],
		['Mandaic', 'Mandaic'],
		['Manichaean', 'Manichaean'],
		['Marchen', 'Marchen'],
		['Medefaidrin', 'Medefaidrin'],
		['Mende_Kikakui', 'Mende_Kikakui'],
		['Meroitic_Cursive', 'Meroitic_Cursive'],
		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
		['Malayalam', 'Malayalam'],
		['Mongolian', 'Mongolian'],
		['Mro', 'Mro'],
		['Meetei_Mayek', 'Meetei_Mayek'],
		['Multani', 'Multani'],
		['Myanmar', 'Myanmar'],
		['Nandinagari', 'Nandinagari'],
		['Old_North_Arabian', 'Old_North_Arabian'],
		['Nabataean', 'Nabataean'],
		['Nko', 'Nko'],
		['Nushu', 'Nushu'],
		['Ogham', 'Ogham'],
		['Ol_Chiki', 'Ol_Chiki'],
		['Old_Turkic', 'Old_Turkic'],
		['Oriya', 'Oriya'],
		['Osage', 'Osage'],
		['Osmanya', 'Osmanya'],
		['Old_Uyghur', 'Old_Uyghur'],
		['Palmyrene', 'Palmyrene'],
		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
		['Old_Permic', 'Old_Permic'],
		['Phags_Pa', 'Phags_Pa'],
		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
		['Phoenician', 'Phoenician'],
		['Miao', 'Miao'],
		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
		['Rejang', 'Rejang'],
		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
		['Runic', 'Runic'],
		['Samaritan', 'Samaritan'],
		['Old_South_Arabian', 'Old_South_Arabian'],
		['Saurashtra', 'Saurashtra'],
		['SignWriting', 'SignWriting'],
		['Shavian', 'Shavian'],
		['Sharada', 'Sharada'],
		['Siddham', 'Siddham'],
		['Khudawadi', 'Khudawadi'],
		['Sinhala', 'Sinhala'],
		['Sogdian', 'Sogdian'],
		['Old_Sogdian', 'Old_Sogdian'],
		['Sora_Sompeng', 'Sora_Sompeng'],
		['Soyombo', 'Soyombo'],
		['Sundanese', 'Sundanese'],
		['Syloti_Nagri', 'Syloti_Nagri'],
		['Syriac', 'Syriac'],
		['Tagbanwa', 'Tagbanwa'],
		['Takri', 'Takri'],
		['Tai_Le', 'Tai_Le'],
		['New_Tai_Lue', 'New_Tai_Lue'],
		['Tamil', 'Tamil'],
		['Tangut', 'Tangut'],
		['Tai_Viet', 'Tai_Viet'],
		['Telugu', 'Telugu'],
		['Tifinagh', 'Tifinagh'],
		['Tagalog', 'Tagalog'],
		['Thaana', 'Thaana'],
		['Tibetan', 'Tibetan'],
		['Tirhuta', 'Tirhuta'],
		['Tangsa', 'Tangsa'],
		['Ugaritic', 'Ugaritic'],
		['Vai', 'Vai'],
		['Vithkuqi', 'Vithkuqi'],
		['Warang_Citi', 'Warang_Citi'],
		['Wancho', 'Wancho'],
		['Old_Persian', 'Old_Persian'],
		['Cuneiform', 'Cuneiform'],
		['Yezidi', 'Yezidi'],
		['Yi', 'Yi'],
		['Zanabazar_Square', 'Zanabazar_Square'],
		['Inherited', 'Inherited'],
		['Common', 'Common'],
		['Unknown', 'Unknown']
	])]
]);

},{}],9:[function(require,module,exports){
'use strict';

const propertyToValueAliases = require('./data/mappings.js');

const matchPropertyValue = function(property, value) {
	const aliasToValue = propertyToValueAliases.get(property);
	if (!aliasToValue) {
		throw new Error(`Unknown property \`${ property }\`.`);
	}
	const canonicalValue = aliasToValue.get(value);
	if (canonicalValue) {
		return canonicalValue;
	}
	throw new Error(
		`Unknown value \`${ value }\` for property \`${ property }\`.`
	);
};

module.exports = matchPropertyValue;

},{"./data/mappings.js":8}],10:[function(require,module,exports){
// Generated using `npm run build`. Do not edit!
module.exports = new Map([
	['scx', 'Script_Extensions'],
	['sc', 'Script'],
	['gc', 'General_Category'],
	['AHex', 'ASCII_Hex_Digit'],
	['Alpha', 'Alphabetic'],
	['Bidi_C', 'Bidi_Control'],
	['Bidi_M', 'Bidi_Mirrored'],
	['Cased', 'Cased'],
	['CI', 'Case_Ignorable'],
	['CWCF', 'Changes_When_Casefolded'],
	['CWCM', 'Changes_When_Casemapped'],
	['CWKCF', 'Changes_When_NFKC_Casefolded'],
	['CWL', 'Changes_When_Lowercased'],
	['CWT', 'Changes_When_Titlecased'],
	['CWU', 'Changes_When_Uppercased'],
	['Dash', 'Dash'],
	['Dep', 'Deprecated'],
	['DI', 'Default_Ignorable_Code_Point'],
	['Dia', 'Diacritic'],
	['EBase', 'Emoji_Modifier_Base'],
	['EComp', 'Emoji_Component'],
	['EMod', 'Emoji_Modifier'],
	['Emoji', 'Emoji'],
	['EPres', 'Emoji_Presentation'],
	['Ext', 'Extender'],
	['ExtPict', 'Extended_Pictographic'],
	['Gr_Base', 'Grapheme_Base'],
	['Gr_Ext', 'Grapheme_Extend'],
	['Hex', 'Hex_Digit'],
	['IDC', 'ID_Continue'],
	['Ideo', 'Ideographic'],
	['IDS', 'ID_Start'],
	['IDSB', 'IDS_Binary_Operator'],
	['IDST', 'IDS_Trinary_Operator'],
	['Join_C', 'Join_Control'],
	['LOE', 'Logical_Order_Exception'],
	['Lower', 'Lowercase'],
	['Math', 'Math'],
	['NChar', 'Noncharacter_Code_Point'],
	['Pat_Syn', 'Pattern_Syntax'],
	['Pat_WS', 'Pattern_White_Space'],
	['QMark', 'Quotation_Mark'],
	['Radical', 'Radical'],
	['RI', 'Regional_Indicator'],
	['SD', 'Soft_Dotted'],
	['STerm', 'Sentence_Terminal'],
	['Term', 'Terminal_Punctuation'],
	['UIdeo', 'Unified_Ideograph'],
	['Upper', 'Uppercase'],
	['VS', 'Variation_Selector'],
	['WSpace', 'White_Space'],
	['space', 'White_Space'],
	['XIDC', 'XID_Continue'],
	['XIDS', 'XID_Start']
]);

},{}],"regexpu-core":[function(require,module,exports){
'use strict';

const generate = require('regjsgen').generate;
const parse = require('regjsparser').parse;
const regenerate = require('regenerate');
const unicodeMatchProperty = require('unicode-match-property-ecmascript');
const unicodeMatchPropertyValue = require('unicode-match-property-value-ecmascript');
const iuMappings = require('./data/iu-mappings.js');
const ESCAPE_SETS = require('./data/character-class-escape-sets.js');

// Prepare a Regenerate set containing all code points, used for negative
// character classes (if any).
const UNICODE_SET = regenerate().addRange(0x0, 0x10FFFF);
// Without the `u` flag, the range stops at 0xFFFF.
// https://mths.be/es6#sec-pattern-semantics
const BMP_SET = regenerate().addRange(0x0, 0xFFFF);

// Prepare a Regenerate set containing all code points that are supposed to be
// matched by `/./u`. https://mths.be/es6#sec-atom
const DOT_SET_UNICODE = UNICODE_SET.clone() // all Unicode code points
	.remove(
		// minus `LineTerminator`s (https://mths.be/es6#sec-line-terminators):
		0x000A, // Line Feed <LF>
		0x000D, // Carriage Return <CR>
		0x2028, // Line Separator <LS>
		0x2029  // Paragraph Separator <PS>
	);

const getCharacterClassEscapeSet = (character, unicode, ignoreCase) => {
	if (unicode) {
		if (ignoreCase) {
			return ESCAPE_SETS.UNICODE_IGNORE_CASE.get(character);
		}
		return ESCAPE_SETS.UNICODE.get(character);
	}
	return ESCAPE_SETS.REGULAR.get(character);
};

const getUnicodeDotSet = (dotAll) => {
	return dotAll ? UNICODE_SET : DOT_SET_UNICODE;
};

const getUnicodePropertyValueSet = (property, value) => {
	const path = value ?
		`${ property }/${ value }` :
		`Binary_Property/${ property }`;
	try {
		return require(`regenerate-unicode-properties/${ path }.js`);
	} catch (exception) {
		throw new Error(
			`Failed to recognize value \`${ value }\` for property ` +
			`\`${ property }\`.`
		);
	}
};

const handleLoneUnicodePropertyNameOrValue = (value) => {
	// It could be a `General_Category` value or a binary property.
	// Note: `unicodeMatchPropertyValue` throws on invalid values.
	try {
		const property = 'General_Category';
		const category = unicodeMatchPropertyValue(property, value);
		return getUnicodePropertyValueSet(property, category);
	} catch (exception) {}
	// It’s not a `General_Category` value, so check if it’s a binary
	// property. Note: `unicodeMatchProperty` throws on invalid properties.
	const property = unicodeMatchProperty(value);
	return getUnicodePropertyValueSet(property);
};

const getUnicodePropertyEscapeSet = (value, isNegative) => {
	const parts = value.split('=');
	const firstPart = parts[0];
	let set;
	if (parts.length == 1) {
		set = handleLoneUnicodePropertyNameOrValue(firstPart);
	} else {
		// The pattern consists of two parts, i.e. `Property=Value`.
		const property = unicodeMatchProperty(firstPart);
		const value = unicodeMatchPropertyValue(property, parts[1]);
		set = getUnicodePropertyValueSet(property, value);
	}
	if (isNegative) {
		return UNICODE_SET.clone().remove(set);
	}
	return set.clone();
};

// Given a range of code points, add any case-folded code points in that range
// to a set.
regenerate.prototype.iuAddRange = function(min, max) {
	const $this = this;
	do {
		const folded = caseFold(min);
		if (folded) {
			$this.add(folded);
		}
	} while (++min <= max);
	return $this;
};

const update = (item, pattern) => {
	let tree = parse(pattern, config.useUnicodeFlag ? 'u' : '');
	switch (tree.type) {
		case 'characterClass':
		case 'group':
		case 'value':
			// No wrapping needed.
			break;
		default:
			// Wrap the pattern in a non-capturing group.
			tree = wrap(tree, pattern);
	}
	Object.assign(item, tree);
};

const wrap = (tree, pattern) => {
	// Wrap the pattern in a non-capturing group.
	return {
		'type': 'group',
		'behavior': 'ignore',
		'body': [tree],
		'raw': `(?:${ pattern })`
	};
};

const caseFold = (codePoint) => {
	return iuMappings.get(codePoint) || false;
};

const processCharacterClass = (characterClassItem, regenerateOptions) => {
	const set = regenerate();
	for (const item of characterClassItem.body) {
		switch (item.type) {
			case 'value':
				set.add(item.codePoint);
				if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
					const folded = caseFold(item.codePoint);
					if (folded) {
						set.add(folded);
					}
				}
				break;
			case 'characterClassRange':
				const min = item.min.codePoint;
				const max = item.max.codePoint;
				set.addRange(min, max);
				if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
					set.iuAddRange(min, max);
				}
				break;
			case 'characterClassEscape':
				set.add(getCharacterClassEscapeSet(
					item.value,
					config.unicode,
					config.ignoreCase
				));
				break;
			case 'unicodePropertyEscape':
				set.add(getUnicodePropertyEscapeSet(item.value, item.negative));
				break;
			// The `default` clause is only here as a safeguard; it should never be
			// reached. Code coverage tools should ignore it.
			/* istanbul ignore next */
			default:
				throw new Error(`Unknown term type: ${ item.type }`);
		}
	}
	if (characterClassItem.negative) {
		update(characterClassItem, `(?!${set.toString(regenerateOptions)})[\\s\\S]`)
	} else {
		update(characterClassItem, set.toString(regenerateOptions));
	}
	return characterClassItem;
};

const updateNamedReference = (item, index) => {
	delete item.name;
	item.matchIndex = index;
};

const assertNoUnmatchedReferences = (groups) => {
	const unmatchedReferencesNames = Object.keys(groups.unmatchedReferences);
	if (unmatchedReferencesNames.length > 0) {
		throw new Error(`Unknown group names: ${unmatchedReferencesNames}`);
	}
};

const processTerm = (item, regenerateOptions, groups) => {
	switch (item.type) {
		case 'dot':
			if (config.useDotAllFlag) {
				break;
			} else if (config.unicode) {
				update(
					item,
					getUnicodeDotSet(config.dotAll).toString(regenerateOptions)
				);
			} else if (config.dotAll) {
				// TODO: consider changing this at the regenerate level.
				update(item, '[\\s\\S]');
			}
			break;
		case 'characterClass':
			item = processCharacterClass(item, regenerateOptions);
			break;
		case 'unicodePropertyEscape':
			if (config.unicodePropertyEscape) {
				update(
					item,
					getUnicodePropertyEscapeSet(item.value, item.negative)
						.toString(regenerateOptions)
				);
			}
			break;
		case 'characterClassEscape':
			update(
				item,
				getCharacterClassEscapeSet(
					item.value,
					config.unicode,
					config.ignoreCase
				).toString(regenerateOptions)
			);
			break;
		case 'group':
			if (item.behavior == 'normal') {
				groups.lastIndex++;
			}
			if (item.name && config.namedGroup) {
				const name = item.name.value;

				if (groups.names[name]) {
					throw new Error(
						`Multiple groups with the same name (${ name }) are not allowed.`
					);
				}

				const index = groups.lastIndex;
				delete item.name;

				groups.names[name] = index;
				if (groups.onNamedGroup) {
					groups.onNamedGroup.call(null, name, index);
				}

				if (groups.unmatchedReferences[name]) {
					groups.unmatchedReferences[name].forEach(reference => {
						updateNamedReference(reference, index);
					});
					delete groups.unmatchedReferences[name];
				}
			}
			/* falls through */
		case 'alternative':
		case 'disjunction':
		case 'quantifier':
			item.body = item.body.map(term => {
				return processTerm(term, regenerateOptions, groups);
			});
			break;
		case 'value':
			const codePoint = item.codePoint;
			const set = regenerate(codePoint);
			if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
				const folded = caseFold(codePoint);
				if (folded) {
					set.add(folded);
				}
			}
			update(item, set.toString(regenerateOptions));
			break;
		case 'reference':
			if (item.name) {
				const name = item.name.value;
				const index = groups.names[name];
				if (index) {
					updateNamedReference(item, index);
					break;
				}

				if (!groups.unmatchedReferences[name]) {
					groups.unmatchedReferences[name] = [];
				}
				// Keep track of references used before the corresponding group.
				groups.unmatchedReferences[name].push(item);
			}
			break;
		case 'anchor':
		case 'empty':
		case 'group':
			// Nothing to do here.
			break;
		// The `default` clause is only here as a safeguard; it should never be
		// reached. Code coverage tools should ignore it.
		/* istanbul ignore next */
		default:
			throw new Error(`Unknown term type: ${ item.type }`);
	}
	return item;
};

const config = {
	'ignoreCase': false,
	'unicode': false,
	'dotAll': false,
	'useDotAllFlag': false,
	'useUnicodeFlag': false,
	'unicodePropertyEscape': false,
	'namedGroup': false
};
const rewritePattern = (pattern, flags, options) => {
	config.unicode = flags && flags.includes('u');
	const regjsparserFeatures = {
		'unicodePropertyEscape': config.unicode,
		'namedGroups': true,
		'lookbehind': options && options.lookbehind
	};
	config.ignoreCase = flags && flags.includes('i');
	const supportDotAllFlag = options && options.dotAllFlag;
	config.dotAll = supportDotAllFlag && flags && flags.includes('s');
	config.namedGroup = options && options.namedGroup;
	config.useDotAllFlag = options && options.useDotAllFlag;
	config.useUnicodeFlag = options && options.useUnicodeFlag;
	config.unicodePropertyEscape = options && options.unicodePropertyEscape;
	if (supportDotAllFlag && config.useDotAllFlag) {
		throw new Error('`useDotAllFlag` and `dotAllFlag` cannot both be true!');
	}
	const regenerateOptions = {
		'hasUnicodeFlag': config.useUnicodeFlag,
		'bmpOnly': !config.unicode
	};
	const groups = {
		'onNamedGroup': options && options.onNamedGroup,
		'lastIndex': 0,
		'names': Object.create(null), // { [name]: index }
		'unmatchedReferences': Object.create(null) // { [name]: Array<reference> }
	};
	const tree = parse(pattern, flags, regjsparserFeatures);
	// Note: `processTerm` mutates `tree` and `groups`.
	processTerm(tree, regenerateOptions, groups);
	assertNoUnmatchedReferences(groups);
	return generate(tree);
};

module.exports = rewritePattern;

},{"./data/character-class-escape-sets.js":2,"./data/iu-mappings.js":3,"regenerate":1,"regjsgen":4,"regjsparser":5,"unicode-match-property-ecmascript":7,"unicode-match-property-value-ecmascript":9}]},{},[]);
