/**
 * key: lib name, value: prefix
 */
export declare type ComponentPrefixConfig = Record<string, string>;
export declare type PageOrCompJSON = {
    component?: boolean;
    usingComponents?: Record<string, string>;
} & Record<string, any>;
export interface ComponentBaseInfo {
    name: string;
    /** xxx/yyy.html */
    path: string;
}
export interface UsingComponentInfo {
    name: string;
    /** /xxx/yyy 文件绝对路径，不带文件扩展名 */
    path: string;
}
export interface SubPackageItem {
    root: string;
    independent?: boolean;
    components?: Map<string, ComponentBaseInfo>;
}
export interface PageOrComponent {
    /** xxx/yyy.html */
    path: string;
    component: boolean;
    usingComponents: UsingComponentInfo[];
}
