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
        define(["require", "exports", "fs-extra", "chokidar", "path", "chalk", "./utils/utils", "./utils/path", "./handler"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateCollectionPage = exports.updateIgnore = exports.updateJson = exports.watch = exports.DefaultOptions = void 0;
    const fs = require("fs-extra");
    const chokidar = require("chokidar");
    const path = require("path");
    const chalk = require("chalk");
    const utils_1 = require("./utils/utils");
    const path_1 = require("./utils/path");
    const handler_1 = require("./handler");
    exports.DefaultOptions = {
        platform: 'wx',
        tabWidth: 2,
    };
    const DefaultWatchOptions = Object.assign({
        updateIgnore: false,
    }, exports.DefaultOptions);
    function onJsonFileChange(jsonPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const htmlPath = (0, path_1.toHtmlPath)((0, path_1.formatPath)(jsonPath));
            if (fs.existsSync(htmlPath)) {
                const jsonPath = (0, path_1.toJSONPath)(htmlPath);
                const json = yield (0, utils_1.readJSONFile)(jsonPath, {});
                yield (0, handler_1.addPageOrComponent)(htmlPath, json);
                if (options.updateIgnore) {
                    const ignoreUpdated = yield (0, handler_1.checkUpdatePackIgnore)(options.tabWidth);
                    ignoreUpdated && console.log(chalk.green('ignore配置已更新'));
                }
            }
        });
    }
    function watchHtml(options) {
        console.log(chalk.green('start watching html ...'));
        chokidar
            .watch(['./**/*.wxml', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
            .on('change', (path, stats) => __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.blue('wxml changed:'), path);
            yield (0, handler_1.updateUsingComponentsInJson)((0, path_1.formatPath)(path), options === null || options === void 0 ? void 0 : options.tabWidth);
        }));
    }
    function watchJson($options) {
        console.log(chalk.green('start watching json ...'));
        const options = Object.assign({}, exports.DefaultOptions, $options);
        const timeBeforeWatch = Date.now();
        chokidar
            .watch(['./**/*.json', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
            .on('change', (jsonPath, stats) => __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.blue('json changed:'), jsonPath);
            yield onJsonFileChange(jsonPath, options);
        }))
            .on('add', (jsonPath, stats) => __awaiter(this, void 0, void 0, function* () {
            if (!stats || stats.mtime.getTime() < timeBeforeWatch)
                return;
            console.log(chalk.blue('json added:'), jsonPath);
            yield onJsonFileChange(jsonPath, options);
        }))
            .on('unlink', (jsonPath) => __awaiter(this, void 0, void 0, function* () {
            console.log(chalk.blue('json removed:'), jsonPath);
            const htmlPath = (0, path_1.toHtmlPath)((0, path_1.formatPath)(jsonPath));
            yield (0, handler_1.removePageOrComponent)(htmlPath);
            if (options.updateIgnore) {
                const ignoreUpdated = yield (0, handler_1.checkUpdatePackIgnore)(options.tabWidth);
                ignoreUpdated && console.log(chalk.green('ignore配置已更新'));
            }
        }));
    }
    function watch(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, DefaultWatchOptions, options);
            yield (0, handler_1.init)(options.platform, options.componentPrefixes);
            options.updateIgnore && (0, handler_1.checkUpdatePackIgnore)(options.tabWidth);
            watchHtml(options);
            watchJson(options);
        });
    }
    exports.watch = watch;
    function updateJson(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, exports.DefaultOptions, options);
            yield (0, handler_1.init)(options === null || options === void 0 ? void 0 : options.platform, options === null || options === void 0 ? void 0 : options.componentPrefixes);
            yield Promise.all(Array.from(handler_1.PageOrComponentMap.entries())
                .filter(([key, value]) => !key.includes('miniprogram_npm'))
                .map(([key, value]) => (0, handler_1.updateUsingComponentsInJson)(value.path, options.tabWidth)));
            console.log(chalk.green('更新成功'));
        });
    }
    exports.updateJson = updateJson;
    function updateIgnore(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, exports.DefaultOptions, options);
            yield (0, handler_1.init)(options.platform, options.componentPrefixes);
            (0, handler_1.checkUpdatePackIgnore)(options.tabWidth);
            console.log(chalk.green('更新成功'));
        });
    }
    exports.updateIgnore = updateIgnore;
    function generateCollectionPage(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, exports.DefaultOptions, options);
            yield (0, handler_1.init)(options === null || options === void 0 ? void 0 : options.platform, options === null || options === void 0 ? void 0 : options.componentPrefixes);
            const allPages = Array.from(handler_1.PageMap.values()).sort((a, b) => a.path.localeCompare(b.path));
            let html = '';
            allPages.forEach((page) => {
                const pagePath = (0, path_1.removePathExtension)(page.path);
                html += `<navigator class="link-page" url="/${pagePath}">📄${pagePath}</navigator>
    `;
            });
            const pagePath = (0, path_1.pathJoin)(options.path, options.name, options.name).replace(/^\//, '');
            const pageDir = path.dirname(pagePath);
            if (!fs.existsSync(pageDir)) {
                fs.mkdir(pageDir);
            }
            const promises = [fs.writeFile((0, path_1.toHtmlPath)(pagePath), html, 'utf-8')];
            const extensions = ['.js', '.json', '.wxss'];
            extensions.forEach((ext) => {
                const srcPath = path.join(__dirname, '../template/collection-page/collection-page' + ext);
                const distPath = pagePath + ext;
                if (!fs.existsSync(distPath)) {
                    promises.push(fs.copyFile(srcPath, distPath));
                }
            });
            yield Promise.all(promises);
            const appJson = (yield fs.readJSON('./app.json', 'utf-8')) || {};
            if (!appJson.pages.includes(pagePath)) {
                appJson.pages.push(pagePath);
                yield fs.writeJSON('./app.json', appJson, { encoding: 'utf-8', spaces: options.tabWidth });
            }
            console.log(chalk.green('生成成功'));
        });
    }
    exports.generateCollectionPage = generateCollectionPage;
});
