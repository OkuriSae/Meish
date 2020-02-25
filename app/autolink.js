/*global exports:false */
// http://tokuhirom.mit-license.org/
(function () {
    "use strict";

    var global = this,
        Y,
        REG_LINK = /(https?:\/\/[^:\/<>&\s]+(?::\d+)?(?:\/[^#\s<>&()"']*(?:#(?:[^\s<>&"'()]+))?)?)|(.)/gi,
        REG_LINK_TWITTER = /(https?:\/\/[^:\/<>&\s]+(?::\d+)?(?:\/[^#\s<>&()"']*(?:#(?:[^<>&"'()]+))?)?)|(?:@([a-zA-Z0-9_-]+)(?=[^\.a-zA-Z0-9_-]|$))|(#[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcfA-Za-z0-9_-]+)|(.)/gi;

    if (typeof exports !== 'undefined') {
        Y = exports;
    } else {
        Y = window;
    }

    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, '&#39;');
    }

    function anchor(url, label, target) {
        // append 'rel="noopener"' if the target is '_blank'
        // SEE: https://developers.google.com/web/tools/lighthouse/audits/noopener
        const noopener = (target && target === '_blank') ? ' rel="noopener"' : '';
        label = label || url;
        target = target ? ' target="' + target + '"' : "";
        return '<a href="' + url + '"' + target + noopener + '>' + label + '</a>';
    }

    Y.autolink = function (src, target) {
        return src.replace(
            REG_LINK,
            function (all, url, normal) {
                if (url) {
                    return anchor(escapeHTML(url), null, target);
                } else {
                    return escapeHTML(normal);
                }
            }
        );
    };
    Y.autolinkTwitter = function (src, target) {
        return src.replace(
            REG_LINK_TWITTER,
            function (all, url, name, hashtag, normal) {
                if (url) {
                    return anchor(escapeHTML(url), null, target);
                } else if (name) {
                    return anchor("http://twitter.com/" + escapeHTML(name), "@" + name, target);
                } else if (hashtag) {
                    return anchor("https://twitter.com/hashtag/" + encodeURIComponent(hashtag.replace('#','')), escapeHTML(hashtag), target);
                } else {
                    return escapeHTML(normal);
                }
            }
        );
    };
})();

