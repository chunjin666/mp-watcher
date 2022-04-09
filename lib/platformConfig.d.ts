export interface PlatformConfig {
    platform: string;
    htmlExtension: string;
    cssExtension: string;
    extraScriptExtension: string;
    projectConfigName: string;
    buildInUILibs: {
        name: string;
        prefix: string;
        components: string[];
    }[];
}
export declare const WxConfig: Readonly<PlatformConfig>;
