import { marked } from 'marked';

export function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'EM', 'B', 'I', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'CODE', 'PRE', 'SPAN', 'DIV']);
  const allowedAttrs = new Set(['class']);
  template.content.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    [...node.attributes].forEach(attr => {
      if (!allowedAttrs.has(attr.name)) node.removeAttribute(attr.name);
    });
  });
  return template.innerHTML;
}

export function renderMarkdown(text) {
  return sanitizeHtml(marked.parse(text || ''));
}
