import fs = require('fs-extra')

export function kebabCase(str: string): string {
  if (!str) return str
  return str.replace(/[A-Z]/g, function(substring, index, ...args) {
    if (index === 0) return substring.toLowerCase()
    return '-' + substring.toLowerCase()
  })
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