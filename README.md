# 小程序命令行工具

本工具的主要功能为：根据小程序的模板文件的内容自动更新 json 文件中的引用组件配置，以及自动更新未使用到的组件到忽略打包配置中。可以提高编码体验和缩小小程序线上包体积。

## 安装

```bash
# 全局安装的使用方式
npm i -g mpcli
# 项目级安装的使用方式
npm i -D mpcli
```

## 命令

> ⚠️⚠️⚠️ 初次使用请先提交代码

使用 `mpcli -h` 命令查看使用方法说明

```bash
$ mpcli -h
Usage: mpcli [options] [command]

Options:
  -h, --help                          display help for command

Commands:
  watch [options]                     监听html文件变化，并自动更新引用信息到json文件中，此外还可以自动更新不打包组件配置
  update-json [options]               自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除
  update-ignore [options]             自动更新项目打包配置，添加不打包的组件目录
  generate-collection-page [options]  生成所有页面列表页面，可以用来进入所有页面检查问题
  help [command]                      display help for command
```

### 添加脚本的使用方式

如果需要添加额外的参数，或者不希望记命令名的话，推荐把命令配置到 `package.json` 中使用。

```json
{
  "scripts": {
    "watch": "mpcli watch --update-ignore"
  }
}
```

开发前开启 watch：

```bash
npm run watch
````

### 第三方组件库配置

由于要通过组件模板代码中的元素标签找出所用到的组件，需要组件前缀与组件库的对应关系比如 `<van-button>` 中的 `van-` 对应 组件库 `@vant/weapp`。所以用户需要增加此项配置。

目前已经内置了[@vant/weapp](https://youzan.github.io/vant-weapp/#/home) 组件库的前缀配置。如果使用到其他组件库，需要配置组件库组件对应的组件前缀，可以在package.json中增加一个`mpComponentPrefixes`字段，配置格式：

```json
{
  "mpComponentPrefixes": {
    "@vant/weapp": "van-"
  }
}
```

### watch 命令

> **监听 html 文件改动，自动更新 json 的 usingComponents 字段**

```bash
$ mpcli watch -h
Usage: mpcli watch [options]

监听html文件变化，并自动更新引用信息到json文件中，此外还可以自动更新不打包组件配置

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  --update-ignore           更新项目打包配置，添加不打包的组件目录。微信小程序平台配置到 project.config.json 中的 packOption.ignore 字段，如果需要手动添加忽略其他文件，本配置到 packOption.extraIgnore 中。
  -h, --help                display help for command
```

开启 `--update-ignore` 选项后，会自动更新不打包目录，当使用的组件有变化之后也会更新配置。
> ⚠️⚠️⚠️如果有需要手动配置的 `ignore` 内容，需要添加到 `extraIgnore` 字段中，脚本会把自动生成的列表和该字段的内容合并。

### update-json 命令

> **自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除。** 初次使用时可先用此命令把所有json文件更新一遍。

```bash
$ mpcli update-json -h
Usage: mpcli update-json [options]

自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除。初次使用时可先用此命令把所有json文件更新一遍。

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  -h, --help                display help for command
```

### update-ignore 命令

> **自动更新项目打包配置，添加不打包的组件目录，缩小上传后的代码体积。**
> </br>微信小程序平台配置到 project.config.json 中的 packOption.ignore 字段，如果需要手动添加忽略其他文件，本配置到 packOption.extraIgnore 中。

```bash
$ mpcli update-ignore -h                                                                                                                              
Usage: mpcli update-ignore [options]

自动更新项目打包配置，添加不打包的组件目录

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  -h, --help                display help for command
```

### generate-collection-page 命令

> **生成所有页面列表页面，可以用来进入所有页面检查问题。**

```bash

```bash
$ mpcli generate-collection-page -h
Usage: mpcli generate-collection-page [options]

生成所有页面列表页面，可以用来进入所有页面检查问题。

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  --name <name>             页面名称 (default: "collection-page")
  --path <path>             页面路径 (default: "pages/")
  -h, --help                display help for command
```
