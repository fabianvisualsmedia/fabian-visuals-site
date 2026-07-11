const assert = require('assert');
global.window = {
  matchMedia: (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' })
};
const { prefersReducedMotion } = require('../main.js');

assert.strictEqual(prefersReducedMotion(), true, 'should return true when matchMedia reports reduced motion');

global.window.matchMedia = () => ({ matches: false });
delete require.cache[require.resolve('../main.js')];
const { prefersReducedMotion: fn2 } = require('../main.js');
assert.strictEqual(fn2(), false, 'should return false when matchMedia reports no preference');

console.log('prefersReducedMotion tests passed');
