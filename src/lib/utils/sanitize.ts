import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'img', 'br', 'p', 'div'],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'style'],
    ADD_TAGS: ['b', 'i', 'u'],
    ADD_ATTR: ['style']
  });
}