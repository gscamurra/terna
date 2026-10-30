/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-nav (linked section-navigation tiles).
 * Source: ul.link-card__deck
 * Block: one row per tile, one cell -> <h3><a>title</a></h3> + <p>description</p>.
 */

const ORIGIN = 'https://www.terna.it';

function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${ORIGIN}${url}`;
  return url;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll(':scope > li.link-card, :scope > li').forEach((item, i, list) => {
    if ([...list].indexOf(item) !== i) return;
    const a = item.querySelector('a[href]');
    const title = text(item.querySelector('.link-card__header')) || text(a);
    const desc = text(item.querySelector('.link-card__body'));
    const content = [];
    if (title) {
      const h = document.createElement('h3');
      if (a) {
        const link = document.createElement('a');
        link.href = absUrl(a.getAttribute('href'));
        link.textContent = title;
        h.append(link);
      } else {
        h.textContent = title;
      }
      content.push(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc;
      content.push(p);
    }
    if (content.length) cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-nav', cells });
  element.replaceWith(block);
}
