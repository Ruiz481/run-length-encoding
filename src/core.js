/**
 * Run Length Encoding core: encode and decode functions.
 *
 * Design decision: use a separator-based scheme where each "run" is encoded as
 * <char><count> and runs are concatenated. We deliberately avoid numeric
 * delimiters and instead parse counts greedily until a non-digit is seen.
 * This makes the encoding unambiguous for any single Unicode code point as the
 * repeated character, because the count is always ASCII digits and the next
 * code point is the start of the next run (or end of string).
 *
 * We do NOT try to escape characters that happen to be digits. The input is
 * treated as a sequence of code points; if the input contains ASCII digit
 * characters, they are encoded like any other character (e.g. "111" becomes
 * "13"). Decoding reads one code point as the character and then digits as
 * the count, so a count is never confused with a data digit.
 */

const ZERO = '0'.codePointAt(0);
const NINE = '9'.codePointAt(0);

/**
 * Encode a string into RLE form.
 *
 * Each maximal run of an identical code point is written as the code point
 * followed by its decimal count. The empty string encodes to the empty string.
 *
 * We iterate by Array.from so that surrogate pairs are treated as one code
 * point; using index-based iteration on the raw string would split astral
 * characters (emoji, etc.) into two halves and produce wrong run boundaries.
 *
 * @param {string} input - Text to compress.
 * @returns {string} RLE-compressed text.
 * @throws {TypeError} if input is not a string.
 */
export function encode(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`encode() expected a string, got ${typeof input}`);
  }
  if (input.length === 0) {
    return '';
  }

  const chars = Array.from(input);
  let out = '';
  let prev = chars[0];
  let count = 1;

  for (let i = 1; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === prev) {
      count += 1;
    } else {
      out += prev + count;
      prev = ch;
      count = 1;
    }
  }
  out += prev + count;
  return out;
}

/**
 * Decode an RLE string back into the original text.
 *
 * Reads exactly one code point as the character, then reads decimal digits
 * greedily as the count. Because encode() always writes <char><count> and a
 * char is never a digit-position role (digits only ever appear after a char),
 * the parser state machine is: read one char, then read count digits, repeat.
 *
 * @param {string} input - RLE-compressed text.
 * @returns {string} Original text.
 * @throws {TypeError} if input is not a string.
 * @throws {Error} if the input is malformed (trailing char with no count, or
 *   a count of zero which encode() never produces).
 */
export function decode(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`decode() expected a string, got ${typeof input}`);
  }
  if (input.length === 0) {
    return '';
  }

  const chars = Array.from(input);
  let out = '';
  let i = 0;

  while (i < chars.length) {
    // Read exactly one code point as the character.
    const ch = chars[i];
    i += 1;

    // Read a run of digits as the count.
    let countStr = '';
    while (i < chars.length) {
      const code = chars[i].codePointAt(0);
      if (code >= ZERO && code <= NINE) {
        countStr += chars[i];
        i += 1;
      } else {
        break;
      }
    }

    if (countStr.length === 0) {
      throw new Error(`Malformed RLE input: expected count at position ${i}`);
    }

    const count = Number.parseInt(countStr, 10);
    if (count === 0) {
      throw new Error(`Malformed RLE input: count of zero is not valid`);
    }

    out += ch.repeat(count);
  }

  return out;
}
