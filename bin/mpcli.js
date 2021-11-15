#!/usr/bin/env node

const { Command } = require('commander');

const program = new Command();

function toNumber(value, defaultVal) {
  value = Number(value)
  if (isNaN(value)) {
    return defaultVal === undefined ? 0 : defaultVal
  }
  return value
}

program
  .command('watch')
  .description('监听html文件变化，并自动更新引用信息到json文件中，此外还可以自动更新不打包组件配置')
  .option('-p --platform <platform>', '小程序平台，目前仅支持wx', 'wx')
  .option('--tab-width <width>', '写JSON时换行缩近字符个数', '2')
  .option('--update-ignore', '更新项目打包配置，添加不打包的组件目录。比如微信小程序project.config.json中packOption的ignore字段，需要手动添加的ignore配置请写到packOption.manualIgnore中')
  .action(({ platform, tabWidth, updateIgnore }) => {
    tabWidth = toNumber(tabWidth)
    require('../lib/index').watch({ platform, tabWidth, updateIgnore });
  });

program
  .command('update-json')
  .description('自动更新所有页面和组件的引用信息到json文件中，可以把一些无用的引用清除')
  .option('-p --platform <platform>', '小程序平台，目前仅支持wx', 'wx')
  .option('--tab-width <width>', '写JSON时换行缩近字符个数', '2')
  .action(({ platform, tabWidth }) => {
    tabWidth = toNumber(tabWidth)
    require('../lib/index').updateJson({ platform, tabWidth });
  });

program
  .command('update-ignore')
  .description('自动更新项目打包配置，添加不打包的组件目录')
  .option('-p --platform <platform>', '小程序平台，目前仅支持wx', 'wx')
  .option('--tab-width <width>', '写JSON时换行缩近字符个数', '2')
  .action(({ platform, tabWidth }) => {
    tabWidth = toNumber(tabWidth)
    require('../lib/index').updateIgnore({ platform, tabWidth });
  });

program
  .command('generate-collection-page')
  .description('生成所有页面列表页面，可以用来进入所有页面检查问题')
  .option('-p --platform <platform>', '小程序平台，目前仅支持wx', 'wx')
  .option('--tab-width <width>', '写JSON时换行缩近字符个数', '2')
  .option('--name <name>', '页面名称', 'collection-page')
  .option('--path <path>', '页面路径', 'pages/')
  .action(({ platform, tabWidth, name, path }) => {
    tabWidth = toNumber(tabWidth)
    require('../lib/index').generateCollectionPage({ platform, tabWidth, name, path });
  });

program.parse();
