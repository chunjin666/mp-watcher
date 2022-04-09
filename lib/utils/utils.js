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
    exports.readJSONFileSync = exports.readJSONFile = exports.kebabCase = void 0;
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
