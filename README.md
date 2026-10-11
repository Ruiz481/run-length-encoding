# Run Length Encoding

A tiny, dependency-free TypeScript-free pure-ESM library that compresses text by replacing each maximal run of an identical character with that character followed by its decimal count, and decompresses it back.

```js
import { encode, decode } from './src/index.js';

const compressed = encode('aaaaabbc');     // 'a5b2c1'
const original = decode('a5b2c1');        // 'aaaaabbc'
```

## Why this exists

The library exists to provide a dead-simple, no-install RLE codec for short strings where a full compression dependency would be overkill — think of deduplicating repetitive log lines or generating compact fixtures. The trade-off: for inputs with little repetition, the encoded form is larger than the original (each run costs a count), so this is only worth using when you know the data is run-heavy.

## Encoding scheme

The encoder writes each run as `<character><count>` and concatenates the runs. The decoder reads digits greedily as the count, then consumes exactly one Unicode code point as the character, then repeats. Because a count is always ASCII digits and a character is always the single code point that follows, the two never blur into each other.

## Awkward edge

Digit characters in the input are treated as ordinary data: `encode('111')` produces `'13'` (the character `'1'` with count `3`). The decoder still reads it correctly because it always reads a count then a single character. Astral code points (emoji and the like) are kept intact because iteration uses `Array.from`, which does not split surrogate pairs. Do not hand-write compressed strings with a leading digit run — the decoder expects the encoder's `<char><count>` shape and will reject malformed input rather than guess.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

