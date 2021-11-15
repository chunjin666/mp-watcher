import fs = require('fs-extra')

export function kebabCase(str: string): string {
  if (!str) return str
  return str.replace(/[A-Z]/g, function(substring, index, ...args) {
    if (index === 0) return substring.toLowerCase()
    return '-' + substring.toLowerCase()
  })
}

export function getComponentNameFromPath(path: string): string {
  if (!path) throw new Error("invalid, path can not be empty");
  const componentName: string = /index(\.\w+)?$/.test(path)
    ? (path.match(/([\w-]+)\/index(\.\w+)?$/)?.[1]) as string
    : path.match(/([\w-]+)(\.\w+)?$/)?.[1] as string
  return kebabCase(componentName)
}

export function removePathExtension(path: string): string {
  return path.replace(/\.\w+$/, '')
}

export function toJSONPath(path: string): string {
  if (!path.includes('.')) return path + '.json'
  return path.replace(/\.\w+$/, '.json')
}

export function toCSSPath(path: string): string {
  if (!path.includes('.')) return path + '.wxss'
  return path.replace(/\.\w+$/, '.wxss')
}

export function toHtmlPath(path: string): string {
  if (!path.includes('.')) return path + '.wxml'
  return path.replace(/\.\w+$/, '.wxml')
}

export function toJsPath(path: string): string {
  if (!path.includes('.')) return path + '.js'
  return path.replace(/\.\w+$/, '.js')
}

export function toRelativeHtmlPath(path: string): string {
  return toHtmlPath(path).replace(/^\//, '')
}

export function pathJoin(...paths: string[]): string {
  paths = paths.filter(p => p)
  if (!paths.length) return ''
  if (paths[0].match(/^\/|\\/)) {
    return '/' + paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '')
  } else {
    return paths.reduce((acc, current) => (acc + '/' + current.replace(/^\/|\\/, '').replace(/\/|\\$/, '')), '')
  }
}

/**
 * 把 windows 格式路径改为 unix 格式
 * @param path 
 */
export function formatPath(path: string): string {
  return path.replace(/\\/g, '/')
}

export async function readJSONFile(path: string, defaultValue: any) {
  let json
  try {
    json = (await fs.readJSON(path, 'utf-8')) || defaultValue
  } catch (error) {
    console.error(error)
    json = defaultValue
  }
  return json
}

export function readJSONFileSync(path: string, defaultValue: any) {
  let json
  try {
    json = fs.readJSONSync(path, 'utf-8') || defaultValue
  } catch (error) {
    console.error(error)
    json = defaultValue
  }
  return json
}