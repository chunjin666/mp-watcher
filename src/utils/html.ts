
export function getAllTagsFromHtml(html: string): string[] {
  if (!html)
    return [];
  html = html.replace(/<!--\.*-->/g, '');
  return html.match(/<[\w-]+(>|\/|\s)/g)?.map((value) => value.trim().replace(/<|>|\//g, ''))!;
}
const WxPrimitiveTags = ['cover-image', 'cover-view', 'match-media', 'movable-area', 'page-container', 'scroll-view', 'share-element', 'swiper', 'swiper-item', 'view', 'icon', 'progress', 'rich-text', 'text', 'button', 'checkbox', 'checkbox-group', 'editor', 'form', 'input', 'keyboard-accessory', 'label', 'picker', 'picker-view', 'picker-view-column', 'radio', 'radio-group', 'slider', 'switch', 'textarea', 'functional-page-navigator', 'navigator', 'audio', 'camera', 'image', 'live-player', 'live-pusher', 'video', 'video-room', 'voip-room', 'map', 'canvas', 'ad', 'ad-custom', 'official-account', 'open-data', 'web-view', 'navigation-bar'];

export function filterNonPrimitiveTags(tags: string[]): string[] {
  return tags.filter((tag) => !WxPrimitiveTags.includes(tag));
}

export function getNonPrimitiveTagsFromHtml(html: string): string[] {
  return filterNonPrimitiveTags(getAllTagsFromHtml(html))
}
