
export interface PlatformConfig {
  platform: string,
  htmlExtension: string,
  cssExtension: string,
  extraScriptExtension: string,
  projectConfigName: string,
  buildInUILibs: { name: string, prefix: string, components: string[] } []
}

export const WxConfig: Readonly<PlatformConfig> = {
  platform: 'wx',
  htmlExtension: '.wxml',
  cssExtension: '.wxss',
  extraScriptExtension: '.wxs',
  projectConfigName: 'project.config.json',
  buildInUILibs: [
    {
      name: 'weui-miniprogram',
      prefix: 'mp-',
      components: [
        'weui-miniprogram/actionsheet/actionsheet',
        'weui-miniprogram/badge/badge',
        'weui-miniprogram/cell/cell',
        'weui-miniprogram/cells/cells',
        'weui-miniprogram/checkbox/checkbox',
        'weui-miniprogram/checkbox-group/checkbox-group',
        'weui-miniprogram/dialog/dialog',
        'weui-miniprogram/form/form',
        'weui-miniprogram/form-page/form-page',
        'weui-miniprogram/gallery/gallery',
        'weui-miniprogram/grids/grids',
        'weui-miniprogram/half-screen-dialog/half-screen-dialog',
        'weui-miniprogram/icon/icon',
        'weui-miniprogram/loading/loading',
        'weui-miniprogram/msg/msg',
        'weui-miniprogram/navigation-bar/navigation-bar',
        'weui-miniprogram/searchbar/searchbar',
        'weui-miniprogram/slideview/slideview',
        'weui-miniprogram/tabbar/tabbar',
        'weui-miniprogram/toptips/toptips',
        'weui-miniprogram/uploader/uploader',
      ]
    }
  ]
}
