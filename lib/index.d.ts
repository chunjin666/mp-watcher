import type { BaseOptions, WatchOptions, GenerateCollectionPageOptions } from './types';
export declare const DefaultOptions: BaseOptions;
export declare function watch(options?: WatchOptions): Promise<void>;
export declare function updateJson(options: BaseOptions): Promise<void>;
export declare function updateIgnore(options: BaseOptions): Promise<void>;
export declare function generateCollectionPage(options: GenerateCollectionPageOptions): Promise<void>;
