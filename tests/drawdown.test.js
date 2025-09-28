
const assert = require('assert');
const markdown = require('../src/libs/drawdown.js');

describe('drawdown.js', function () {
    it('should correctly handle an image inside a link', function () {
        const input = '[![alt text](image.png)](https://example.com)';
        const expectedOutput = '<a href="https://example.com"><img src="image.png" alt="alt text"/></a>';
        assert.strictEqual(markdown(input).trim(), expectedOutput);
    });
    it('should correctly handle a bold texts', function () {
        assert.strictEqual(
          markdown(
            "The current President of the United States is **Donald J. Trump** (since January 20, 2025). [USAGov](https://www.usa.gov/presidents?utm_source=chatgpt.com)"
          ).trim(),
          '<p>The current President of the United States is <strong>Donald J. Trump</strong> (since January 20, 2025). <a href="https://www.usa.gov/presidents?utm_source=chatgpt.com">USAGov</a></p>'
        );

        assert.strictEqual(
          markdown(
            "The current President of the United States is **Donald J. Trump** (since January 20, 2025)."
          ).trim(),
          "<p>The current President of the United States is <strong>Donald J. Trump</strong> (since January 20, 2025).</p>"
        );

        assert.strictEqual(
          markdown(
            "`**abcd**`"
          ).trim(),
          "<p><code>**abcd**</code></p>"
        );

        assert.strictEqual(
          markdown(
            "**`abcd`**"
          ).trim(),
          "<p><strong><code>abcd</code></strong></p>"
        );
    });
});
