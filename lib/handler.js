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
        define(["require", "exports", "fs-extra", "path", "chalk", "globby", "./utils/utils", "./utils/path", "./utils/html", "./prefixesConfig", "./platformConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = exports.PageMap = exports.PageOrComponentMap = exports.checkUpdatePackIgnore = exports.updateUsingComponentsInJson = exports.removePageOrComponent = exports.addPageOrComponent = void 0;
    const fs = require("fs-extra");
    const path = require("path");
    const chalk = require("chalk");
    const globby = require("globby");
    const utils_1 = require("./utils/utils");
    const path_1 = require("./utils/path");
    const html_1 = require("./utils/html");
    const prefixesConfig_1 = require("./prefixesConfig");
    const platformConfig_1 = require("./platformConfig");
    function getPrefixedComponentName(path) {
        let componentName = (0, path_1.getComponentNameFromPath)(path);
        for (const libName in componentPrefixConfig) {
            if (path.startsWith('miniprogram_npm/' + libName)) {
                return componentPrefixConfig[libName] + componentName;
            }
        }
        return componentName;
    }
    function findSubPackageFromPath(subPackages, path) {
        return subPackages.find((item) => path.startsWith(item.root));
    }
    const ComponentJSRegExp = /\sComponent\s*\(\s*{[\s\S]*?}\s*\)/;
    function resolvePageOrComponentInfo(htmlPath, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const componentName = (0, path_1.getComponentNameFromPath)(htmlPath);
            let pageOrComponent;
            if (json.component) {
                pageOrComponent = { isComponent: true, componentName, path: htmlPath, json, usingComponents: [] };
            }
            else {
                const jsStr = yield fs.readFile((0, path_1.toJsPath)(htmlPath), 'utf-8');
                if (ComponentJSRegExp.test(jsStr)) {
                    pageOrComponent = { isComponent: true, componentName, path: htmlPath, json, usingComponents: [] };
                }
                else {
                    pageOrComponent = { isComponent: false, path: htmlPath, json, usingComponents: [] };
                }
            }
            storePageOrComponent(pageOrComponent, htmlPath);
            return pageOrComponent;
        });
    }
    function storePageOrComponent(pageOrComponent, htmlPath) {
        if (pageOrComponent.isComponent) {
            ComponentMap.set(htmlPath, pageOrComponent);
        }
        else {
            exports.PageMap.set(htmlPath, pageOrComponent);
        }
        exports.PageOrComponentMap.set(htmlPath, pageOrComponent);
        if (pageOrComponent.isComponent) {
            let componentName = getPrefixedComponentName(pageOrComponent.path);
            const subPackage = findSubPackageFromPath(subPackages, pageOrComponent.path);
            const packageComponentMap = subPackage ? SubPackagesComponentMap.get(subPackage.root) : MainPackageComponentMap;
            packageComponentMap.set(componentName, pageOrComponent);
        }
    }
    /**
     * 从 json 文件的 usingComponents 中解析用到的组件，找到其位置，并记录到 pageOrComponent 对象
     * @param pageOrComponent 页面或组件对象
     */
    function resolveUsingComponentsFromJson(pageOrComponent) {
        return __awaiter(this, void 0, void 0, function* () {
            const { path: htmlPath, json } = pageOrComponent;
            const usingComponentsFromJson = json.usingComponents || {};
            const pageOrComponentSubPkg = subPackages.find((item) => htmlPath.startsWith(item.root));
            yield Promise.all(Object.entries(usingComponentsFromJson).map(([name, compPath]) => __awaiter(this, void 0, void 0, function* () {
                // 兼容官方内置组件 weui
                if (compPath.startsWith('weui-miniprogram/')) {
                    pageOrComponent.usingComponents.push({ isBuiltIn: true, name, path: compPath });
                    return;
                }
                const targetCompPaths = [];
                if (path.isAbsolute(compPath)) {
                    // 从主包根目录查找
                    targetCompPaths.push(compPath.replace(/^\/|^\\/, ''));
                }
                else {
                    if (/^\./.test(compPath)) {
                        // 组件路径为相对于所属页面或者组件的相对路径
                        targetCompPaths.push((0, path_1.formatPath)(path.normalize(path.join(path.dirname(htmlPath), compPath))));
                    }
                    else {
                        // 所属页面或者组件的根目录开始的路径
                        targetCompPaths.push((0, path_1.formatPath)(path.normalize(path.join(path.dirname(htmlPath), compPath))));
                        // 可能为npm包中的组件
                        // 先从子包的npm包中查找
                        pageOrComponentSubPkg && targetCompPaths.push((0, path_1.formatPath)(path.join(pageOrComponentSubPkg.root, 'miniprogram_npm/', compPath)));
                        // 再从主包的npm包中查找
                        targetCompPaths.push((0, path_1.formatPath)(path.join('miniprogram_npm/', compPath)));
                    }
                }
                for (const compPath of targetCompPaths) {
                    const usingComponentInfo = getUsingComponentInfo(compPath);
                    if (usingComponentInfo) {
                        pageOrComponent.usingComponents.push(usingComponentInfo);
                        return;
                    }
                }
                console.log(chalk.red(`Can't find component of :`), compPath, chalk.red('in'), chalk.blue((0, path_1.toJSONPath)(htmlPath)));
            })));
        });
    }
    function addPageOrComponent(htmlPath, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const pageOrComponent = yield resolvePageOrComponentInfo(htmlPath, json);
            yield resolveUsingComponentsFromJson(pageOrComponent);
        });
    }
    exports.addPageOrComponent = addPageOrComponent;
    function removePageOrComponent(htmlPath) {
        return __awaiter(this, void 0, void 0, function* () {
            exports.PageOrComponentMap.delete(htmlPath);
            exports.PageMap.delete(htmlPath);
            ComponentMap.delete(htmlPath);
            const json = yield (0, utils_1.readJSONFileSync)((0, path_1.toJSONPath)(htmlPath), {});
            if (json.component) {
                let componentName = getPrefixedComponentName(htmlPath);
                const ownerSubPackage = findSubPackageFromPath(subPackages, htmlPath);
                const packageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root) : MainPackageComponentMap;
                packageComponentMap.delete(componentName);
            }
        });
    }
    exports.removePageOrComponent = removePageOrComponent;
    /**
     * 获取组件信息，包括组件名和以/开头的绝对路径名，不带文件扩展名
     * @param compPath 组件路径，以项目根目录为根，不以/开头，不带文件扩展名
     * @returns
     */
    function getUsingComponentInfo(compPath) {
        const compInfo = ComponentMap.get((0, path_1.toHtmlPath)(compPath)) || ComponentMap.get((0, path_1.toHtmlPath)(path.join(compPath, 'index')));
        if (compInfo) {
            return {
                isBuiltIn: false,
                name: getPrefixedComponentName(compInfo.path),
                path: '/' + (0, path_1.removePathExtension)(compInfo.path),
                component: compInfo,
            };
        }
        return undefined;
    }
    function traverseAllHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const htmlPaths = yield globby(['./**/*.wxml', '!node_modules', '!./**/node_modules']);
            const htmlPathAndJsonList = yield Promise.all(htmlPaths
                .filter((path) => fs.existsSync((0, path_1.toJSONPath)(path)))
                .map((path) => __awaiter(this, void 0, void 0, function* () {
                const json = yield (0, utils_1.readJSONFile)((0, path_1.toJSONPath)(path), {});
                return [path, json];
            })));
            // 先处理所有页面和组件
            const pageOrComps = yield Promise.all(htmlPathAndJsonList.map(([htmlPath, json]) => resolvePageOrComponentInfo(htmlPath, json)));
            // 再更新页面和组件的 usingComponents
            yield Promise.all(pageOrComps.map(resolveUsingComponentsFromJson));
        });
    }
    function resolvePrefixConfig(cfg) {
        const config = Object.assign({}, prefixesConfig_1.default, cfg);
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
    function updateUsingComponentsInJson(path, tabWidth) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonPath = (0, path_1.toJSONPath)(path);
            if (!fs.existsSync(jsonPath))
                return;
            const htmlContent = yield fs.readFile(path, 'utf-8');
            const tags = (0, html_1.getNonPrimitiveTagsFromHtml)(htmlContent);
            console.log('tags', tags);
            const subPackage = findSubPackageFromPath(subPackages, path);
            const subPackageComponentMap = subPackage ? SubPackagesComponentMap.get(subPackage.root) : undefined;
            const usingComponents = tags.reduce((acc, tag) => {
                let component;
                if (subPackageComponentMap) {
                    component = subPackageComponentMap.get(tag);
                    // 非独立子包才能使用主包中的组件
                    if (!component && !(subPackage === null || subPackage === void 0 ? void 0 : subPackage.independent)) {
                        component = MainPackageComponentMap.get(tag);
                    }
                }
                else {
                    component = MainPackageComponentMap.get(tag);
                }
                if (component) {
                    acc[tag] = '/' + (0, path_1.removePathExtension)(component.path);
                }
                else {
                    let buildInComp = BuiltInComponentMap.get(tag);
                    if (buildInComp) {
                        acc[tag] = buildInComp.path;
                    }
                }
                return acc;
            }, {});
            const json = yield (0, utils_1.readJSONFile)(jsonPath, {});
            json.usingComponents = usingComponents;
            fs.writeJSON(jsonPath, json, { spaces: tabWidth });
        });
    }
    exports.updateUsingComponentsInJson = updateUsingComponentsInJson;
    function recordUsingComponentsOf(pageOrComponent) {
        if (pageOrComponent.isComponent) {
            UsingComponentsRecord.set(pageOrComponent.path, true);
        }
        pageOrComponent.usingComponents.forEach((item) => {
            if (item.isBuiltIn)
                return;
            // 组件引用自己
            if (item.component.path === pageOrComponent.path)
                return;
            UsingComponentsRecord.set(item.component.path, true);
        });
    }
    function getPrevPackIgnores() {
        var _a;
        if (packIgnores)
            return packIgnores;
        const projectConfigJson = (0, utils_1.readJSONFileSync)(path.resolve(process.cwd(), 'project.config.json'), {});
        const ignores = ((_a = projectConfigJson.packOptions) === null || _a === void 0 ? void 0 : _a.ignore) || [];
        const extraIgnores = projectConfigJson.extraIgnore || [];
        packIgnores = ignores
            .filter((item) => !extraIgnores.some((mItem) => mItem.type === item.type && mItem.value === item.value))
            .map((item) => item.value)
            .sort();
        return packIgnores;
    }
    function writePackIgnores(ignores, tabWidth) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectConfigPath = path.resolve(process.cwd(), 'project.config.json');
            const projectConfigJson = yield (0, utils_1.readJSONFile)(projectConfigPath, {});
            if (!projectConfigJson.packOptions) {
                projectConfigJson.packOptions = {};
            }
            const extraIgnores = projectConfigJson.extraIgnore || [];
            projectConfigJson.packOptions.ignore = extraIgnores.concat(ignores.map((item) => ({ type: 'glob', value: item })));
            yield fs.writeJSON(projectConfigPath, projectConfigJson, { spaces: tabWidth });
        });
    }
    function checkUpdatePackIgnore(tabWidth) {
        return __awaiter(this, void 0, void 0, function* () {
            UsingComponentsRecord.clear();
            exports.PageMap.forEach((value) => recordUsingComponentsOf(value));
            const allComponents = Array.from(ComponentMap.keys());
            const ignoreComponents = allComponents.filter((compPath) => !UsingComponentsRecord.get(compPath));
            let ignores = [];
            ignoreComponents.forEach((compPath) => {
                const compDir = path.dirname(compPath);
                const compDirWithSuffixSlash = compDir + '/';
                const subComps = allComponents.filter((compPath1) => compPath1.startsWith(compDirWithSuffixSlash) && compPath1.replace(compDirWithSuffixSlash, '').includes('/'));
                const siblingComps = allComponents.filter((compPath2) => compPath2 !== compPath && compPath2.startsWith(compDirWithSuffixSlash));
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
            ignores = mergeIgnores(ignores);
            const prevIgnores = getPrevPackIgnores();
            if (ignores.length === prevIgnores.length && ignores.every((item, index) => item === prevIgnores[index])) {
                return false;
            }
            // console.log(chalk.yellowBright('pack ignore'), prevIgnores.slice(), ignores)
            packIgnores = ignores;
            yield writePackIgnores(ignores, tabWidth);
            return true;
        });
    }
    exports.checkUpdatePackIgnore = checkUpdatePackIgnore;
    function mergeIgnores(ignores) {
        const mergedMap = {};
        ignores
            .filter((ignore) => /[A-Za-z0-9_-]+\/\*\.\*$/.test(ignore))
            .forEach((ignore) => {
            var _a;
            const [_, key] = ignore.match(/(.+\/)[A-Za-z0-9_-]+\/\*\.\*$/) || [];
            if (!key)
                return;
            mergedMap[key] = mergedMap[key] || [];
            const mergedFolder = ((_a = ignore.match(/([A-Za-z0-9_-]+)\/\*\.\*$/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
            mergedMap[key].push(mergedFolder);
        });
        const notMergedIgnores = ignores.filter((ignore) => !/[A-Za-z0-9_-]+\/\*\.\*$/.test(ignore));
        return [
            ...Object.entries(mergedMap).map(([key, folders]) => {
                return folders.length > 1 ? `${key}(${folders.join('|')})/*.*` : `${key}${folders[0]}/*.*`;
            }),
            ...notMergedIgnores,
        ].sort();
    }
    // ---------- 扁平存放页面或者组件及他所使用的组件情况 ----------
    /**
     * key: html文件path，以项目根目录为基础路径的相对路径
     */
    exports.PageOrComponentMap = new Map();
    /**
     * key: html文件path，以项目根目录为基础路径
     */
    exports.PageMap = new Map();
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
    const BuiltInComponentMap = new Map();
    /** 被使用到的组件，key: 组件html路径 */
    const UsingComponentsRecord = new Map();
    let packIgnores;
    let projectPackageConfig = {
        dependencies: {},
    };
    let subPackages;
    let componentPrefixConfig;
    function initBuiltInComponents(prefixConfig) {
        platformConfig_1.WxConfig.buildInUILibs.forEach((uiLib) => {
            const prefix = prefixConfig === null || prefixConfig === void 0 ? void 0 : prefixConfig[uiLib.name];
            uiLib.components.forEach((compPath) => {
                const compName = prefix + (0, path_1.getComponentNameFromPath)(compPath);
                BuiltInComponentMap.set(compName, {
                    isComponent: true,
                    componentName: compName,
                    path: (0, path_1.removePathExtension)(compPath),
                    json: {},
                    usingComponents: [],
                });
            });
        });
    }
    function init(platform, componentPrefixes) {
        return __awaiter(this, void 0, void 0, function* () {
            const [$projectPackageConfig, $subPackages] = yield Promise.all([readProjectPackageJson(), getSubPackages()]);
            projectPackageConfig = Object.assign(projectPackageConfig, $projectPackageConfig);
            subPackages = $subPackages;
            const buildInPrefixes = platformConfig_1.WxConfig.buildInUILibs.reduce((acc, uiLib) => ((acc[uiLib.name] = uiLib.prefix), acc), {});
            componentPrefixConfig = Object.assign({}, buildInPrefixes, componentPrefixes, projectPackageConfig.mpComponentPrefixes);
            subPackages.forEach((item) => SubPackagesComponentMap.set(item.root, new Map()));
            initBuiltInComponents(componentPrefixConfig);
            console.time('traverse');
            yield traverseAllHtml();
            console.timeEnd('traverse');
        });
    }
    exports.init = init;
});
