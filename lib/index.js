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
        define(["require", "exports", "fs-extra", "path", "chokidar", "chalk", "globby", "./utils/utils", "./utils/html", "./defaultComponentPrefixConfig", "./platformConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateCollectionPage = exports.updateIgnore = exports.updateJson = exports.watch = void 0;
    const fs = require("fs-extra");
    const path = require("path");
    const chokidar = require("chokidar");
    const chalk = require("chalk");
    const globby = require("globby");
    const utils_1 = require("./utils/utils");
    const html_1 = require("./utils/html");
    const defaultComponentPrefixConfig_1 = require("./defaultComponentPrefixConfig");
    const platformConfig_1 = require("./platformConfig");
    function getPrefixedComponentName(path, prefixConfig) {
        let componentName = (0, utils_1.getComponentNameFromPath)(path);
        for (const libName in prefixConfig) {
            if (path.startsWith('miniprogram_npm/' + libName)) {
                return prefixConfig[libName] + componentName;
            }
        }
        return componentName;
    }
    function findSubPackageFromPath(subPackages, path) {
        return subPackages.find((item) => path.startsWith(item.root));
    }
    function addPageOrComponent(htmlPath, json) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!json) {
                json = yield fs.readJSON((0, utils_1.toJSONPath)(htmlPath), 'utf-8');
            }
            resolveUsingComponents(htmlPath, json);
            if (json === null || json === void 0 ? void 0 : json.component) {
                let componentName = getPrefixedComponentName(htmlPath, componentPrefixConfig);
                const ownerSubPackage = findSubPackageFromPath(subPackages, htmlPath);
                const packageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root) : MainPackageComponentMap;
                packageComponentMap.set(componentName, { name: componentName, path: (0, utils_1.removePathExtension)(htmlPath) });
            }
        });
    }
    function removePageOrComponent(htmlPath) {
        return __awaiter(this, void 0, void 0, function* () {
            PageOrComponentMap.delete(htmlPath);
            PageMap.delete(htmlPath);
            ComponentMap.delete(htmlPath);
            const json = yield fs.readJSON((0, utils_1.toJSONPath)(htmlPath), 'utf-8');
            if (json.component) {
                let componentName = getPrefixedComponentName(htmlPath, componentPrefixConfig);
                const ownerSubPackage = findSubPackageFromPath(subPackages, htmlPath);
                const packageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root) : MainPackageComponentMap;
                packageComponentMap.delete(componentName);
            }
        });
    }
    /**
     * 获取组件信息，包括组件名和以/开头的绝对路径名，不带文件扩展名
     * @param compPath 组件路径，以项目根目录为根，不以/开头，不带文件扩展名
     * @returns
     */
    function getUsingComponentInfo(compPath) {
        if (fs.existsSync((0, utils_1.toHtmlPath)(compPath))) {
            return {
                name: (0, utils_1.getComponentNameFromPath)(compPath),
                path: '/' + compPath,
            };
        }
        else if (!compPath.endsWith('/index')) {
            compPath += '/index';
            if (fs.existsSync((0, utils_1.toHtmlPath)(compPath))) {
                return {
                    name: (0, utils_1.getComponentNameFromPath)(compPath),
                    path: '/' + compPath,
                };
            }
        }
        return undefined;
    }
    function resolveUsingComponents(htmlPath, json) {
        let pageOrComponent = PageOrComponentMap.get(htmlPath);
        if (!pageOrComponent) {
            pageOrComponent = { path: htmlPath, component: !!json.component, usingComponents: [] };
            PageOrComponentMap.set(htmlPath, pageOrComponent);
            pageOrComponent.component ? ComponentMap.set(htmlPath, pageOrComponent) : PageMap.set(htmlPath, pageOrComponent);
        }
        const usingComponents = json.usingComponents || {};
        const dependencies = Object.keys(projectPackageConfig.dependencies);
        const ownerSubPkg = subPackages.find((item) => htmlPath.startsWith(item.root));
        Object.entries(usingComponents).forEach(([name, compPath]) => __awaiter(this, void 0, void 0, function* () {
            if (compPath.startsWith('weui-miniprogram/')) {
                pageOrComponent === null || pageOrComponent === void 0 ? void 0 : pageOrComponent.usingComponents.push({ name, path: compPath });
                return;
            }
            if (!path.isAbsolute(compPath)) {
                // 组件路径为相对于所属页面或者组件的相对路径
                let relativeCompPath = path.resolve(path.dirname(htmlPath), compPath);
                relativeCompPath = path.relative(process.cwd(), relativeCompPath).replace(/\\/g, '/');
                const usingComponentInfo = getUsingComponentInfo(relativeCompPath);
                if (usingComponentInfo) {
                    pageOrComponent.usingComponents.push(usingComponentInfo);
                    return;
                }
                // 组件可能为npm包中的组件
                if (/^[^./]/.test(compPath)) {
                    // 先从子包的npm包中查找
                    if (ownerSubPkg) {
                        const compPathOfSubPkgNpm = path.join(ownerSubPkg.root, 'miniprogram_npm/' + compPath).replace(/\\/g, '/');
                        const usingComponentInfo = getUsingComponentInfo(compPathOfSubPkgNpm);
                        if (usingComponentInfo) {
                            pageOrComponent.usingComponents.push(usingComponentInfo);
                            return;
                        }
                    }
                    // 再从主包的npm包中查找
                    const dep = dependencies.find((depName) => compPath.startsWith(depName + '/'));
                    if (dep) {
                        const compPathAddNpmPrefix = 'miniprogram_npm/' + compPath;
                        const usingComponentInfo = getUsingComponentInfo(compPathAddNpmPrefix);
                        if (usingComponentInfo) {
                            pageOrComponent.usingComponents.push(usingComponentInfo);
                            return;
                        }
                    }
                }
            }
            else {
                // 组件路径为绝对路径
                // 先从子包的npm依赖中查找
                if (ownerSubPkg) {
                    const usingComponentInfo = getUsingComponentInfo(path.join(ownerSubPkg.root, compPath).replace(/\\/g, '/'));
                    if (usingComponentInfo) {
                        pageOrComponent.usingComponents.push(usingComponentInfo);
                        return;
                    }
                }
                // 再从主包的npm依赖中查找
                const usingComponentInfo = getUsingComponentInfo(compPath.replace(/^\//, ''));
                if (usingComponentInfo) {
                    pageOrComponent.usingComponents.push(usingComponentInfo);
                    return;
                }
            }
            console.log(chalk.red(`Can't find component of :`), compPath, chalk.blue((0, utils_1.toJSONPath)(htmlPath)));
        }));
    }
    function traverseAllHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const paths = yield globby(['./**/*.wxml', '!node_modules', '!./**/node_modules']);
            return Promise.all(paths.map((htmlPath) => __awaiter(this, void 0, void 0, function* () {
                // console.log(chalk.yellow(htmlPath))
                const jsonPath = (0, utils_1.toJSONPath)(htmlPath);
                if (!fs.existsSync(jsonPath))
                    return;
                const json = yield fs.readJSON(jsonPath, 'utf-8');
                if (!json)
                    return;
                yield addPageOrComponent(htmlPath, json);
            })));
        });
    }
    function resolvePrefixConfig(cfg) {
        const config = Object.assign({}, defaultComponentPrefixConfig_1.default, cfg);
        Object.entries(config).forEach(([key, value]) => {
            if (value && !value.endsWith('-')) {
                value += '-';
                config[key] = value;
            }
        });
        return config;
    }
    function getSubPackages() {
        return __awaiter(this, void 0, void 0, function* () {
            const appJson = yield fs.readJSON(path.join(process.cwd(), 'app.json'), 'utf-8');
            const subPackages = (appJson === null || appJson === void 0 ? void 0 : appJson.subpackages) || (appJson === null || appJson === void 0 ? void 0 : appJson.subPackages) || [];
            return subPackages.map((item) => ({ root: item.root, independent: item.independent, components: undefined }));
        });
    }
    function readProjectPackageJson() {
        return __awaiter(this, void 0, void 0, function* () {
            let json = yield (0, utils_1.readJSONFile)(path.join(process.cwd(), 'package.json'), {});
            json.mpComponentPrefixes = resolvePrefixConfig(json.mpComponentPrefixes);
            return json;
        });
    }
    function updateUsingComponentsInJson(path, tabWidth = 2) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonPath = (0, utils_1.toJSONPath)(path);
            if (!fs.existsSync(jsonPath))
                return;
            const htmlContent = yield fs.readFile(path, 'utf-8');
            const tags = (0, html_1.getNonPrimitiveTagsFromHtml)(htmlContent);
            // console.log('tags', tags)
            const ownerSubPackage = findSubPackageFromPath(subPackages, path);
            const ownerSubPackageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root) : undefined;
            const usingComponents = tags.reduce((acc, tag) => {
                let component;
                if (ownerSubPackageComponentMap) {
                    component = ownerSubPackageComponentMap.get(tag);
                    // 非独立子包才能使用主包中的组件
                    if (!component && !(ownerSubPackage === null || ownerSubPackage === void 0 ? void 0 : ownerSubPackage.independent)) {
                        component = MainPackageComponentMap.get(tag);
                    }
                }
                else {
                    component = MainPackageComponentMap.get(tag);
                }
                if (component) {
                    acc[tag] = '/' + component.path;
                }
                else {
                    let buildInComp = BuildInComponentMap.get(tag);
                    if (buildInComp) {
                        acc[tag] = buildInComp.path;
                    }
                }
                return acc;
            }, {});
            const json = (yield fs.readJSON(jsonPath, 'utf-8')) || {};
            if (!json.usingComponents)
                json.usingComponents = {};
            json.usingComponents = usingComponents;
            // Object.assign(json.usingComponents, usingComponents)
            console.log(chalk.blue('update usingComponents'), json.usingComponents);
            fs.writeJSON(jsonPath, json, { spaces: 2 });
        });
    }
    function recordUsingComponentsOf(pageOrComponent) {
        // console.log('record', pageOrComponent.path)
        if (pageOrComponent.component) {
            UsingComponentsRecord.set(pageOrComponent.path, true);
        }
        pageOrComponent.usingComponents.forEach((item) => {
            const relativeCompHtmlPath = (0, utils_1.toHtmlPath)(item.path).replace(/^\//, '');
            const comp = PageOrComponentMap.get(relativeCompHtmlPath);
            if (comp) {
                recordUsingComponentsOf(comp);
            }
            else {
                if (fs.existsSync(relativeCompHtmlPath)) {
                    UsingComponentsRecord.set(relativeCompHtmlPath, true);
                }
            }
        });
    }
    function getPrevPackIgnores() {
        var _a, _b;
        if (packIgnores)
            return packIgnores;
        const projectConfigJson = (0, utils_1.readJSONFileSync)(path.resolve(process.cwd(), 'project.config.json'), {});
        const ignores = ((_a = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _a === void 0 ? void 0 : _a.ignore) || [];
        const manualIgnores = ((_b = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _b === void 0 ? void 0 : _b.manualIgnore) || [];
        packIgnores = ignores
            .filter((item) => item.type === 'glob' && !manualIgnores.some((mItem) => mItem.type === item.type && mItem.value === item.value))
            .map((item) => item.value)
            .sort();
        return packIgnores;
    }
    function writePackIgnores(ignores, tabWidth = 2) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const projectConfigPath = path.resolve(process.cwd(), 'project.config.json');
            const projectConfigJson = yield (0, utils_1.readJSONFile)(projectConfigPath, {});
            if (!projectConfigJson.packOptions) {
                projectConfigJson.packOptions = {};
            }
            const manualIgnores = ((_a = projectConfigJson === null || projectConfigJson === void 0 ? void 0 : projectConfigJson.packOptions) === null || _a === void 0 ? void 0 : _a.manualIgnore) || [];
            projectConfigJson.packOptions.ignore = manualIgnores.concat(ignores.map((item) => ({ type: 'glob', value: item })));
            yield fs.writeJSON(projectConfigPath, projectConfigJson, { spaces: tabWidth });
        });
    }
    function checkUpdatePackIgnore(tabWidth) {
        PageMap.forEach((value) => recordUsingComponentsOf(value));
        const allComponents = Array.from(ComponentMap.keys()); //.filter((compPath) => compPath.startsWith('miniprogram_npm/'))
        const ignoreComponents = allComponents.filter((compPath) => !UsingComponentsRecord.get(compPath));
        // console.log('ignoreComponentsInNpm', ignoreComponentsInNpm)
        const ignores = [];
        ignoreComponents.forEach((compPath) => {
            const compDir = path.dirname(compPath);
            const compDirWithSuffixSlash = compDir + '/';
            const subComps = allComponents.filter((compPath1) => compPath1.startsWith(compDirWithSuffixSlash) && compPath1.replace(compDirWithSuffixSlash, '').includes('/'));
            const siblingComps = allComponents.filter((compPath2) => compPath2 !== compPath && compPath2.startsWith(compDirWithSuffixSlash));
            // if (subComps.length || siblingComps.length) {
            //   console.log(compPath, subComps, siblingComps)
            // }
            if (siblingComps.some((compPath3) => UsingComponentsRecord.get(compPath3))) {
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
            return;
        }
        console.log(chalk.yellowBright('pack ignore'), prevIgnores.slice(), ignores);
        packIgnores = ignores;
        writePackIgnores(ignores, tabWidth);
    }
    function watchHtml(options) {
        console.log(chalk.green('start watching html ...'));
        chokidar
            .watch(['./**/*.wxml', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
            .on('change', (path, stats) => {
            console.log('wxml change:', path);
            updateUsingComponentsInJson((0, utils_1.formatPath)(path), options === null || options === void 0 ? void 0 : options.tabWidth);
        });
    }
    function watchJson(options) {
        console.log(chalk.green('start watching json ...'));
        const timeBeforeWatch = Date.now();
        chokidar
            .watch(['./**/*.json', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
            .on('change', (jsonPath, stats) => __awaiter(this, void 0, void 0, function* () {
            console.log('change', jsonPath);
            // if (!stats || stats.birthtime.getTime() < timeBeforeWatch) return
            const htmlPath = (0, utils_1.toHtmlPath)((0, utils_1.formatPath)(jsonPath));
            if (fs.existsSync(htmlPath)) {
                addPageOrComponent(htmlPath);
                (options === null || options === void 0 ? void 0 : options.updateIgnore) && checkUpdatePackIgnore(options === null || options === void 0 ? void 0 : options.tabWidth);
            }
        }))
            .on('add', (jsonPath, stats) => {
            if (!stats || stats.mtime.getTime() < timeBeforeWatch)
                return;
            console.log('add', jsonPath);
            const htmlPath = (0, utils_1.toHtmlPath)((0, utils_1.formatPath)(jsonPath));
            if (fs.existsSync(htmlPath)) {
                addPageOrComponent(htmlPath);
                (options === null || options === void 0 ? void 0 : options.updateIgnore) && checkUpdatePackIgnore(options === null || options === void 0 ? void 0 : options.tabWidth);
            }
        })
            .on('unlink', (jsonPath) => {
            console.log('remove', jsonPath);
            const htmlPath = (0, utils_1.toHtmlPath)((0, utils_1.formatPath)(jsonPath));
            removePageOrComponent(htmlPath);
            (options === null || options === void 0 ? void 0 : options.updateIgnore) && checkUpdatePackIgnore(options === null || options === void 0 ? void 0 : options.tabWidth);
        });
    }
    // ---------- 扁平存放页面或者组件及他所使用的组件情况 ----------
    /**
     * key: html文件path，以项目根目录为基础路径
     */
    const PageOrComponentMap = new Map();
    /**
     * key: html文件path，以项目根目录为基础路径
     */
    const PageMap = new Map();
    /**
     * key: html文件path，以项目根目录为基础路径
     */
    const ComponentMap = new Map();
    // ---------- 分包存放对应包拥有的组件 ----------
    /** key: component tag */
    const MainPackageComponentMap = new Map();
    /** outerKey: sub package root, innerKey: component tag */
    const SubPackagesComponentMap = new Map();
    /** key: component tag */
    const BuildInComponentMap = new Map();
    /** 被使用到的组件，key: 组件html路径 */
    const UsingComponentsRecord = new Map();
    let packIgnores;
    let projectPackageConfig = {
        dependencies: {},
    };
    let subPackages;
    let componentPrefixConfig;
    function initBuildInComponents(prefixConfig) {
        platformConfig_1.WxConfig.buildInUILibs.forEach((uiLib) => {
            const prefix = prefixConfig === null || prefixConfig === void 0 ? void 0 : prefixConfig[uiLib.name];
            uiLib.components.forEach((compPath) => {
                const compName = prefix + (0, utils_1.getComponentNameFromPath)(compPath);
                BuildInComponentMap.set(compName, {
                    name: compName,
                    path: (0, utils_1.removePathExtension)(compPath),
                });
            });
        });
    }
    function init(platform, componentPrefixes) {
        return __awaiter(this, void 0, void 0, function* () {
            const [$projectPackageConfig, $subPackages] = yield Promise.all([readProjectPackageJson(), getSubPackages()]);
            projectPackageConfig = Object.assign(projectPackageConfig, $projectPackageConfig);
            subPackages = $subPackages;
            const buildInPrefixes = platformConfig_1.WxConfig.buildInUILibs.reduce((acc, uiLib) => (acc[uiLib.name] = uiLib.prefix, acc), {});
            componentPrefixConfig = Object.assign({}, buildInPrefixes, componentPrefixes, projectPackageConfig.mpComponentPrefixes);
            subPackages.forEach((item) => SubPackagesComponentMap.set(item.root, new Map()));
            initBuildInComponents(componentPrefixConfig);
            console.time('traverse');
            yield traverseAllHtml();
            console.timeEnd('traverse');
            // console.log(chalk.blue('main package:'), MainPackageComponentMap)
            // for (let [sub, compMap] of SubPackagesComponentMap.entries()) {
            //   console.log(chalk.blue(`sub package components:`), sub, compMap)
            // }
            // console.log('PageOrComponents', Array.from(PageOrComponentMap.values()).map(item => [item.path, item.usingComponents.map(comp => comp.path)]))
        });
    }
    const DefaultOptions = {
        platform: 'wx',
        tabWidth: 2,
    };
    const DefaultWatchOptions = Object.assign({
        updateIgnore: false,
    }, DefaultOptions);
    function watch(options) {
        options = Object.assign({}, DefaultWatchOptions, options);
        init(options === null || options === void 0 ? void 0 : options.platform, options === null || options === void 0 ? void 0 : options.componentPrefixes).then(() => {
            (options === null || options === void 0 ? void 0 : options.updateIgnore) && checkUpdatePackIgnore(options === null || options === void 0 ? void 0 : options.tabWidth);
            watchHtml(options);
            watchJson(options);
        });
    }
    exports.watch = watch;
    function updateJson(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, DefaultOptions, options);
            yield init(options === null || options === void 0 ? void 0 : options.platform, options === null || options === void 0 ? void 0 : options.componentPrefixes);
            yield Promise.all(Array.from(PageOrComponentMap.entries()).map(([key, value]) => {
                if (!key.includes('miniprogram_npm')) {
                    updateUsingComponentsInJson(value.path);
                }
            }));
            console.log(chalk.green('更新成功'));
        });
    }
    exports.updateJson = updateJson;
    function updateIgnore(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, DefaultOptions, options);
            yield init(options.platform, options.componentPrefixes);
            checkUpdatePackIgnore(options.tabWidth);
            console.log(chalk.green('更新成功'));
        });
    }
    exports.updateIgnore = updateIgnore;
    function generateCollectionPage(options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({}, DefaultOptions, options);
            yield init(options === null || options === void 0 ? void 0 : options.platform, options === null || options === void 0 ? void 0 : options.componentPrefixes);
            // @ts-ignore
            const allPages = Array.from(PageMap.values()).sort((a, b) => a.path - b.path);
            let html = '';
            allPages.forEach((page) => {
                const pagePath = (0, utils_1.removePathExtension)(page.path);
                html += `<navigator class="link-page" url="/${pagePath}">${pagePath}</navigator>
    `;
            });
            const pagePath = (0, utils_1.pathJoin)(options.path, options.name, options.name).replace(/^\//, '');
            const pageDir = path.dirname(pagePath);
            console.log('pageDir', pageDir);
            if (!fs.existsSync(pageDir)) {
                fs.mkdir(pageDir);
            }
            const promises = [
                fs.writeFile((0, utils_1.toHtmlPath)(pagePath), html, 'utf-8'),
            ];
            const extensions = ['.js', '.json', '.wxss'];
            extensions.forEach(ext => {
                const srcPath = path.join(__dirname, '../template/collection-page/collection-page' + ext);
                if (!fs.existsSync(srcPath)) {
                    promises.push(fs.copyFile(srcPath, pagePath + ext));
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
