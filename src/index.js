/**
 * Public entry point for the Run Length Encoding library.
 *
 * Re-exports the encode/decode pair from core so consumers can import a
 * single module path. Keeping core separate from the barrel lets tests target
 * the implementation directly while the published package has a clean surface.
 */
export { encode, decode } from './core.js';
