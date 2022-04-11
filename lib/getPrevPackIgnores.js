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
        define(["require", "exports", "fs-extra", "path", "./utils/utils", "./index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkUpdatePackIgnore = void 0;
    const fs = require("fs-extra");
    const path = require("path");
    const utils_1 = require("./utils/utils");
    const index_1 = require("./index");
    function getPrevPackIgnores() {
        var _a, _b;
        if (index_1.packIgnores)
            return index_1.packIgnores;
        const projectConfigJson = (0, utils_1.readJSONFileSync)(path.resolve(process.cwd(), 'project.config.json'), {});
        const ignores = ((_a = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _a === void 0 ? void 0 : _a.ignore) || [];
        const extraIgnores = ((_b = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _b === void 0 ? void 0 : _b.extraIgnore) || [];
        index_1.packIgnores = ignores
            .filter((item) => item.type === 'glob' && !extraIgnores.some((mItem) => mItem.type === item.type && mItem.value === item.value))
            .map((item) => item.value)
            .sort();
        return index_1.packIgnores;
    }
    function writePackIgnores(ignores, tabWidth) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const projectConfigPath = path.resolve(process.cwd(), 'project.config.json');
            const projectConfigJson = yield (0, utils_1.readJSONFile)(projectConfigPath, {});
            if (!projectConfigJson.packOptions) {
                projectConfigJson.packOptions = {};
            }
            const extraIgnores = ((_a = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _a === void 0 ? void 0 : _a.extraIgnore) || [];
            projectConfigJson.packOptions.ignore = extraIgnores.concat(ignores.map((item) => ({ type: 'glob', value: item })));
            yield fs.writeJSON(projectConfigPath, projectConfigJson, { spaces: tabWidth });
        });
    }
    function checkUpdatePackIgnore(tabWidth) {
        return __awaiter(this, void 0, void 0, function* () {
            index_1.UsingComponentsRecord.clear();
            index_1.PageMap.forEach((value) => (0, index_1.recordUsingComponentsOf)(value));
            const allComponents = Array.from(index_1.ComponentMap.keys());
            const ignoreComponents = allComponents.filter((compPath) => !index_1.UsingComponentsRecord.get(compPath));
            const ignores = [];
            ignoreComponents.forEach((compPath) => {
                const compDir = path.dirname(compPath);
                const compDirWithSuffixSlash = compDir + '/';
                const subComps = allComponents.filter((compPath1) => compPath1.startsWith(compDirWithSuffixSlash) && compPath1.replace(compDirWithSuffixSlash, '').includes('/'));
                const siblingComps = allComponents.filter((compPath2) => compPath2 !== compPath && compPath2.startsWith(compDirWithSuffixSlash));
                // if (subComps.length || siblingComps.length) {
                //   console.log(compPath, subComps, siblingComps)
                // }
                if (siblingComps.some((compPath3) => index_1.UsingComponentsRecord.get(compPath3))) {
                    ignores.push(compPath.replace(/\.\w+$/, '.*'));
                }
                else if (siblingComps.length || subComps.length) {
                    ignores.push(compPath.replace(/[\w-]+\.\w+$/, '*.*'));
                }
                else {
                    ignores.push(compDir + '/*.*');
                }
            });
            ignores.sort();
            const prevIgnores = getPrevPackIgnores();
            if (ignores.length === prevIgnores.length && ignores.every((item, index) => item === prevIgnores[index])) {
                return false;
            }
            // console.log(chalk.yellowBright('pack ignore'), prevIgnores.slice(), ignores)
            index_1.packIgnores = ignores;
            yield writePackIgnores(ignores, tabWidth);
            return true;
        });
    }
    exports.checkUpdatePackIgnore = checkUpdatePackIgnore;
});
