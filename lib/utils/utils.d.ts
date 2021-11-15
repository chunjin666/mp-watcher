export declare function kebabCase(str: string): string;
export declare function getComponentNameFromPath(path: string): string;
export declare function removePathExtension(path: string): string;
export declare function toJSONPath(path: string): string;
export declare function toCSSPath(path: string): string;
export declare function toHtmlPath(path: string): string;
export declare function toJsPath(path: string): string;
export declare function toRelativeHtmlPath(path: string): string;
export declare function pathJoin(...paths: string[]): string;
/**
 * 把 windows 格式路径改为 unix 格式
 * @param path
 */
export declare function formatPath(path: string): string;
export declare function readJSONFile(path: string, defaultValue: any): Promise<any>;
export declare function readJSONFileSync(path: string, defaultValue: any): any;
