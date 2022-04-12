/**
 * 返回一个列表，这个列表中的元素中 array 中，但不在 excludes 中
 */
export function difference<T>(array: T[], excludes?: any[]): T[] {
  if (!array) return []
  return array.filter((value) => !excludes?.includes(value))
}
