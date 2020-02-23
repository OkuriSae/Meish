const assert = require('assert');
const autolink = require('autolink');

describe('autolink', () => {
    describe('#autolinkTwitter', () => {
        it('should replace @xxx with a twitter link to xxx', () => {
            assert.equal(
                autolink.autolinkTwitter('@OkuriSae', '_blank'),
                '<a href="http://twitter.com/OkuriSae" target="_blank" rel="noopener">@OkuriSae</a>');
            assert.equal(
                autolink.autolinkTwitter('@OkuriSaeちゃん', '_blank'),
                '<a href="http://twitter.com/OkuriSae" target="_blank" rel="noopener">@OkuriSae</a>ちゃん');
        });

        it('should not replace mail addresses', () => {
            assert.equal(
                autolink.autolinkTwitter('OkuriSae@example.com', '_blank'),
                'OkuriSae@example.com');
        });
    });
});
