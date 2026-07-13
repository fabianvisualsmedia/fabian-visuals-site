const assert = require('assert');
const { nextHeroMode } = require('../main.js');

assert.strictEqual(nextHeroMode('commercial'), 'wedding', 'commercial should flip to wedding');
assert.strictEqual(nextHeroMode('wedding'), 'commercial', 'wedding should flip to commercial');

console.log('nextHeroMode tests passed');
