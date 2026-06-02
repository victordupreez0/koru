// Polyfills + env wiring loaded before each test file.
// Vite's import.meta.env is replaced by babel-plugin-transform-import-meta;
// we expose an env object on globalThis so service modules find their config.
process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5299/api';

// jsdom in Node 18+ doesn't expose TextEncoder/Decoder by default; react-router v7 needs them.
const util = require('util');
if (typeof globalThis.TextEncoder === 'undefined') globalThis.TextEncoder = util.TextEncoder;
if (typeof globalThis.TextDecoder === 'undefined') globalThis.TextDecoder = util.TextDecoder;

if (!globalThis.import) {
  Object.defineProperty(globalThis, 'importMeta', {
    value: { env: { VITE_API_BASE_URL: process.env.VITE_API_BASE_URL } },
    configurable: true,
  });
}
