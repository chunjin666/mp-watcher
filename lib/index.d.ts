import type { ComponentPrefixConfig } from './types';
declare type Platforms = 'wx' | 'ali';
export interface BaseOptions {
    platform: Platforms;
    tabWidth?: number;
    componentPrefixes?: ComponentPrefixConfig;
}
export interface WatchOptions extends BaseOptions {
    updateIgnore?: boolean;
}
export interface GenerateCollectionPageOptions extends BaseOptions {
    name: string;
    path: string;
}
export declare function watch(options?: WatchOptions): Promise<void>;
export declare function updateJson(options: BaseOptions): Promise<void>;
export declare function updateIgnore(options: BaseOptions): Promise<void>;
export declare function generateCollectionPage(options: GenerateCollectionPageOptions): Promise<void>;
export {};
