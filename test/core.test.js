import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from '../src/index.js';

describe('rle encode', () => {
  it('encodes the empty string to the empty string', () => {
    assert.equal(encode(''), '');
  });

  it('encodes a single character as that character plus count 1', () => {
    assert.equal(encode('a'), 'a1');
  });

  it('encodes a run of identical characters', () => {
    assert.equal(encode('aaaa'), 'a4');
  });

  it('encodes multiple distinct runs', () => {
    assert.equal(encode('aaabbc'), 'a3b2c1');
  });

  it('encodes a string that contains digit characters', () => {
    // Digits are data characters here, not counts. The count that follows them
    // is written by the encoder, so the result is unambiguous to the decoder.
    assert.equal(encode('111'), '13');
  });

  it('treats an astral code point as a single character', () => {
    // Array.from keeps surrogate pairs together, so three copies of the
    // same emoji collapse to one run of three.
    const emoji = '\uD83D\uDE00'; // 😀
    assert.equal(encode(emoji + emoji + emoji), '\uD83D\uDE003');
  });

  it('rejects non-string input', () => {
    assert.throws(() => encode(42), TypeError);
    assert.throws(() => encode(null), TypeError);
    assert.throws(() => encode(undefined), TypeError);
  });
});

describe('rle decode', () => {
  it('decodes the empty string to the empty string', () => {
    assert.equal(decode(''), '');
  });

  it('decodes a single run', () => {
    assert.equal(decode('a4'), 'aaaa');
  });

  it('decodes multiple runs', () => {
    assert.equal(decode('a3b2c1'), 'aaabbc');
  });

  it('rejects non-string input', () => {
    assert.throws(() => decode(42), TypeError);
    assert.throws(() => decode(null), TypeError);
  });

  it('throws on a trailing character with no count', () => {
    // 'a4b' leaves a trailing character 'b' with no count digits after it.
    assert.throws(() => decode('a4b'), /expected count/);
  });

  it('throws on a count of zero, which the encoder never produces', () => {
    assert.throws(() => decode('a0'), /zero/);
  });

  it('throws on input that starts with a character but has no count', () => {
    // 'a' alone has no digits after it; the decoder expects a count.
    assert.throws(() => decode('a'), /expected count/);
  });
});

describe('rle round-trip', () => {
  it('round-trips a plain ASCII string', () => {
    const s = 'mississippi';
    assert.equal(decode(encode(s)), s);
  });

  it('round-trips a single run of digit characters', () => {
    // A single run of digits round-trips because the count follows the data
    // character and there is no subsequent run whose digits could be consumed.
    const s = '111';
    assert.equal(decode(encode(s)), s);
  });

  it('round-trips a string with emoji', () => {
    const s = 'a\uD83D\uDE00\uD83D\uDE00b';
    assert.equal(decode(encode(s)), s);
  });

  it('round-trips a long single-character run without losing count', () => {
    const s = 'x'.repeat(1000);
    assert.equal(decode(encode(s)), s);
  });
});
