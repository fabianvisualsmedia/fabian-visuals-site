const assert = require('assert');
global.window = { matchMedia: (query) => ({ matches: query === '(pointer: coarse)' }) };
const { isTouchDevice } = require('../main.js');
assert.strictEqual(isTouchDevice(), true, 'coarse pointer should be detected as touch device');

global.window.matchMedia = () => ({ matches: false });
delete require.cache[require.resolve('../main.js')];
const { isTouchDevice: fn2 } = require('../main.js');
assert.strictEqual(fn2(), false, 'fine pointer should not be detected as touch device');

console.log('isTouchDevice tests passed');
