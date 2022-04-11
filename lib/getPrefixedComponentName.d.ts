import { ComponentPrefixConfig, PageOrComponent, PageOrCompJSON, WatchOptions, Platforms, PageInfo } from './types';
export declare function addPageOrComponent(htmlPath: string, json: PageOrCompJSON): Promise<void>;
export declare function updateUsingComponentsInJson(path: string, tabWidth: number): Promise<void>;
export declare function checkUpdatePackIgnore(tabWidth: number): Promise<boolean>;
export declare function watchHtml(options?: WatchOptions): void;
export declare function watchJson($options?: WatchOptions): void;
/**
 * key: html文件path，以项目根目录为基础路径的相对路径
 */
export declare const PageOrComponentMap: Map<string, PageOrComponent>;
/**
 * key: html文件path，以项目根目录为基础路径
 */
export declare const PageMap: Map<string, PageInfo>;
export declare function init(platform: Platforms, componentPrefixes?: ComponentPrefixConfig): Promise<void>;
