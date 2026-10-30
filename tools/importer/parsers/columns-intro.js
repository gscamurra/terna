/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-intro (heading + link left, body paragraphs right).
 * Source: .boxevidence__wrapper
 * Block: one row, two cells -> [h2 + CTA link | body paragraphs]
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
  const lead = [];
  const titleEl = element.querySelector('.boxevidence--title h1, .boxevidence--title h2, .boxevidence--title h3, .boxevidence--title');
  const title = text(titleEl);
  if (title) {
    const h = document.createElement('h2');
    h.textContent = title;
    lead.push(h);
  }
  const a = element.querySelector('.boxevidence--link a[href]');
  if (a) {
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'));
    link.textContent = text(a) || a.getAttribute('title') || '';
    const p = document.createElement('p');
    p.append(link);
    lead.push(p);
  }

  const body = [];
  const textEl = element.querySelector('.boxevidence--text');
  if (textEl) {
    const paras = [...textEl.querySelectorAll('p')].filter((p) => text(p));
    if (paras.length) paras.forEach((p) => body.push(p));
    else if (text(textEl)) {
      const p = document.createElement('p');
      p.textContent = text(textEl);
      body.push(p);
    }
  }

  const cells = [[lead.length ? lead : '', body.length ? body : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-intro', cells });
  element.replaceWith(block);
}
