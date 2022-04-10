(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatPath = exports.pathJoin = exports.toRelativeHtmlPath = exports.toJsPath = exports.toHtmlPath = exports.toCSSPath = exports.toJSONPath = exports.removePathExtension = exports.getComponentNameFromPath = void 0;
    const utils_1 = require("./utils");
    function getComponentNameFromPath($path) {
        var _a, _b;
        if (!$path)
            throw new Error("invalid, path can not be empty");
        const componentName = /index(\.\w+)?$/.test($path)
            ? ((_a = $path.match(/([\w-]+)\/index(\.\w+)?$/)) === null || _a === void 0 ? void 0 : _a[1])
            : (_b = $path.match(/([\w-]+)(\.\w+)?$/)) === null || _b === void 0 ? void 0 : _b[1];
        return (0, utils_1.kebabCase)(componentName);
    }
    exports.getComponentNameFromPath = getComponentNameFromPath;
    function removePathExtension($path) {
        return $path.replace(/\.\w+$/, '');
    }
    exports.removePathExtension = removePathExtension;
    function toJSONPath($path) {
        return $path.replace(/\.\w*$/, '') + '.json';
    }
    exports.toJSONPath = toJSONPath;
    function toCSSPath($path) {
        return $path.replace(/\.\w*$/, '') + '.wxss';
    }
    exports.toCSSPath = toCSSPath;
    function toHtmlPath($path) {
        return $path.replace(/\.\w*$/, '') + '.wxml';
    }
    exports.toHtmlPath = toHtmlPath;
    function toJsPath($path) {
        return $path.replace(/\.\w*$/, '') + '.js';
    }
    exports.toJsPath = toJsPath;
    function toRelativeHtmlPath($path) {
        return toHtmlPath($path).replace(/^\//, '');
    }
    exports.toRelativeHtmlPath = toRelativeHtmlPath;
    function pathJoin(...$paths) {
        $paths = $paths.filter(p => p);
        if (!$paths.length)
            return '';
        if ($paths[0].match(/^\/|\\/)) {
            return '/' + $paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '');
        }
        else {
            return $paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '');
        }
    }
    exports.pathJoin = pathJoin;
    /**
     * 把 windows 格式路径改为 unix 格式
     * @param $path
     */
    function formatPath($path) {
        return $path.replace(/\\/g, '/');
    }
    exports.formatPath = formatPath;
});
