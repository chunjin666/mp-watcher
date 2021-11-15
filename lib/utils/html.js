(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNonPrimitiveTagsFromHtml = exports.filterNonPrimitiveTags = exports.getAllTagsFromHtml = void 0;
    function getAllTagsFromHtml(html) {
        var _a;
        if (!html)
            return [];
        html = html.replace(/<!--\.*-->/g, '');
        return (_a = html.match(/<[\w-]+(>|\/|\s)/g)) === null || _a === void 0 ? void 0 : _a.map((value) => value.trim().replace(/<|>|\//g, ''));
    }
    exports.getAllTagsFromHtml = getAllTagsFromHtml;
    const WxPrimitiveTags = ['cover-image', 'cover-view', 'match-media', 'movable-area', 'page-container', 'scroll-view', 'share-element', 'swiper', 'swiper-item', 'view', 'icon', 'progress', 'rich-text', 'text', 'button', 'checkbox', 'checkbox-group', 'editor', 'form', 'input', 'keyboard-accessory', 'label', 'picker', 'picker-view', 'picker-view-column', 'radio', 'radio-group', 'slider', 'switch', 'textarea', 'functional-page-navigator', 'navigator', 'audio', 'camera', 'image', 'live-player', 'live-pusher', 'video', 'video-room', 'voip-room', 'map', 'canvas', 'ad', 'ad-custom', 'official-account', 'open-data', 'web-view', 'navigation-bar'];
    function filterNonPrimitiveTags(tags) {
        return tags.filter((tag) => !WxPrimitiveTags.includes(tag));
    }
    exports.filterNonPrimitiveTags = filterNonPrimitiveTags;
    function getNonPrimitiveTagsFromHtml(html) {
        return filterNonPrimitiveTags(getAllTagsFromHtml(html));
    }
    exports.getNonPrimitiveTagsFromHtml = getNonPrimitiveTagsFromHtml;
});
