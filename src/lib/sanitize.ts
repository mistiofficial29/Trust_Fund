import sanitizeHtml from "sanitize-html";

export function sanitizeStory(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "a", "blockquote"],
    allowedAttributes: { a: ["href", "rel", "target"] },
  });
}
