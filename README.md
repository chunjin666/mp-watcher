# 小程序命令行工具

## 安装

```bash
npm i -g mpcli
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
yarn watch
````

### 前缀配置

目前已经内置了[@vant/weapp](https://youzan.github.io/vant-weapp/#/home) 组件库的前缀配置。如果使用到其他组件库，需要配置组件库组件对应的组件前缀，可以在package.json中增加一个`mpComponentPrefixes`字段，配置格式：

```json
{
  "mpComponentPrefixes": {
    "@vant/weapp": "van-"
  }
}
```

### watch 监听html文件改动，自动更新json的usingComponents字段

开启`--update-ignore`选项后，会自动更新不打包目录，当使用的组件有变化之后也会更新配置。
> ⚠️⚠️⚠️如果有需要手动配置的`ignore`内容，需要添加到`manualIgnore`字段中，脚本会把自动生成的列表和该字段的内容合并。

```bash
$ mpcli watch -h
Usage: mpcli watch [options]

监听html文件变化，并自动更新引用信息到json文件中，此外还可以自动更新不打包组件配置

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  --update-ignore           更新项目打包配置，添加不打包的组件目录。比如微信小程序project.config.json中packOption的ignore字段，需要手动添加的ignore配 
置请写到packOption.manualIgnore中
  -h, --help                display help for command
```

### update-json 自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除

```bash
$ mpcli update-json -h
Usage: mpcli update-json [options]

自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  -h, --help                display help for command
```

### update-ignore 自动更新项目打包配置，添加不打包的组件目录

```bash
$ mpcli update-ignore -h                                                                                                                              
Usage: mpcli update-ignore [options]

自动更新项目打包配置，添加不打包的组件目录

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  -h, --help                display help for command
```

### generate-collection-page 生成所有页面列表页面，可以用来进入所有页面检查问题

```bash
$ mpcli generate-collection-page -h
Usage: mpcli generate-collection-page [options]

生成所有页面列表页面，可以用来进入所有页面检查问题

Options:
  -p --platform <platform>  小程序平台，目前仅支持wx (default: "wx")
  --tab-width <width>       写JSON时换行缩近字符个数 (default: "2")
  --name <name>             页面名称 (default: "collection-page")
  --path <path>             页面路径 (default: "pages/")
  -h, --help                display help for command
```
