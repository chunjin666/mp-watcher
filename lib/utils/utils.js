var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs-extra"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readJSONFileSync = exports.readJSONFile = exports.formatPath = exports.pathJoin = exports.toRelativeHtmlPath = exports.toJsPath = exports.toHtmlPath = exports.toCSSPath = exports.toJSONPath = exports.removePathExtension = exports.getComponentNameFromPath = exports.kebabCase = void 0;
    const fs = require("fs-extra");
    function kebabCase(str) {
        if (!str)
            return str;
        return str.replace(/[A-Z]/g, function (substring, index, ...args) {
            if (index === 0)
                return substring.toLowerCase();
            return '-' + substring.toLowerCase();
        });
    }
    exports.kebabCase = kebabCase;
    function getComponentNameFromPath(path) {
        var _a, _b;
        if (!path)
            throw new Error("invalid, path can not be empty");
        const componentName = /index(\.\w+)?$/.test(path)
            ? ((_a = path.match(/([\w-]+)\/index(\.\w+)?$/)) === null || _a === void 0 ? void 0 : _a[1])
            : (_b = path.match(/([\w-]+)(\.\w+)?$/)) === null || _b === void 0 ? void 0 : _b[1];
        return kebabCase(componentName);
    }
    exports.getComponentNameFromPath = getComponentNameFromPath;
    function removePathExtension(path) {
        return path.replace(/\.\w+$/, '');
    }
    exports.removePathExtension = removePathExtension;
    function toJSONPath(path) {
        if (!path.includes('.'))
            return path + '.json';
        return path.replace(/\.\w+$/, '.json');
    }
    exports.toJSONPath = toJSONPath;
    function toCSSPath(path) {
        if (!path.includes('.'))
            return path + '.wxss';
        return path.replace(/\.\w+$/, '.wxss');
    }
    exports.toCSSPath = toCSSPath;
    function toHtmlPath(path) {
        if (!path.includes('.'))
            return path + '.wxml';
        return path.replace(/\.\w+$/, '.wxml');
    }
    exports.toHtmlPath = toHtmlPath;
    function toJsPath(path) {
        if (!path.includes('.'))
            return path + '.js';
        return path.replace(/\.\w+$/, '.js');
    }
    exports.toJsPath = toJsPath;
    function toRelativeHtmlPath(path) {
        return toHtmlPath(path).replace(/^\//, '');
    }
    exports.toRelativeHtmlPath = toRelativeHtmlPath;
    function pathJoin(...paths) {
        paths = paths.filter(p => p);
        if (!paths.length)
            return '';
        if (paths[0].match(/^\/|\\/)) {
            return '/' + paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '');
        }
        else {
            return paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '');
        }
    }
    exports.pathJoin = pathJoin;
    /**
     * 把 windows 格式路径改为 unix 格式
     * @param path
     */
    function formatPath(path) {
        return path.replace(/\\/g, '/');
    }
    exports.formatPath = formatPath;
    function readJSONFile(path, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let json;
            try {
                json = (yield fs.readJSON(path, 'utf-8')) || defaultValue;
            }
            catch (error) {
                console.error(error);
                json = defaultValue;
            }
            return json;
        });
    }
    exports.readJSONFile = readJSONFile;
    function readJSONFileSync(path, defaultValue) {
        let json;
        try {
            json = fs.readJSONSync(path, 'utf-8') || defaultValue;
        }
        catch (error) {
            console.error(error);
            json = defaultValue;
        }
        return json;
    }
    exports.readJSONFileSync = readJSONFileSync;
});
