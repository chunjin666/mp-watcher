export function getAllTagsFromHtml(html: string): string[] {
  if (!html) return []
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  const tags = html.match(/<[\w-]+(>|\/|\s)/g)?.map((value) => value.trim().replace(/<|>|\//g, ''))!
  return Array.from(new Set(tags))
}
