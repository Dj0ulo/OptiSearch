
const assert = require('assert');
const markdown = require('../src/libs/drawdown.js');

describe('drawdown.js', function () {
    it('should correctly handle an image inside a link', function () {
        const input = '[![alt text](image.png)](https://example.com)';
        const expectedOutput = '<a href="https://example.com"><img src="image.png" alt="alt text"/></a>';
        assert.strictEqual(markdown(input).trim(), expectedOutput);
    });
});
