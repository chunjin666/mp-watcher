(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./utils/path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("./utils/path");
    /** 被使用到的组件，key: 组件html路径 */
    const UsingComponentsRecord = new Map();
    function recordUsingComponentsOf(pageOrComponent) {
        if (pageOrComponent.component) {
            UsingComponentsRecord.set(pageOrComponent.path, true);
        }
        pageOrComponent.usingComponents.forEach((item) => {
            const relativeCompHtmlPath = (0, path_1.formatPath)((0, path_1.toHtmlPath)(item.path));
            const comp = PageOrComponentMap.get(relativeCompHtmlPath);
            if (comp) {
                // 组件引用自己
                if (comp.path === pageOrComponent.path) {
                    return;
                }
                else {
                    recordUsingComponentsOf(comp);
                }
            }
            else {
                if (fs.existsSync(relativeCompHtmlPath)) {
                    UsingComponentsRecord.set(relativeCompHtmlPath, true);
                }
            }
        });
    }
});
