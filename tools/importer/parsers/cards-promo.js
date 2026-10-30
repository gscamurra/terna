/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo (three coloured text-only promo cards).
 * Instance selector matches the first .area--size-33 column (.area--area-13);
 * its next two .area--size-33 siblings are gathered into the same block and removed.
 * Block: one row per card, one text cell -> eyebrow <p>, <h3> title, description, CTA.
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

function para(document, value) {
  const p = document.createElement('p');
  if (typeof value === 'string') p.textContent = value;
  else p.append(value);
  return p;
}

function parseCard(document, area) {
  const out = [];
  const slide = area.querySelector('.swiper-slide:not(.swiper-slide-duplicate) .swiper-slide-content')
    || area.querySelector('.terna-slidecontent') || area;
  const eyebrow = text(slide.querySelector('.terna-slidecontent-item-section'));
  if (eyebrow) out.push(para(document, eyebrow));
  const title = text(slide.querySelector('.terna-slidecontent-item-title'));
  if (title) {
    const h = document.createElement('h3');
    h.textContent = title;
    out.push(h);
  }
  const desc = text(slide.querySelector('.terna-slidecontent-item-text'));
  if (desc) out.push(para(document, desc));
  const a = slide.querySelector('.terna-slidecontent-item-link a[href]');
  if (a) {
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'));
    link.textContent = text(a) || a.getAttribute('title') || '';
    out.push(para(document, link));
  }
  return out;
}

export default function parse(element, { document }) {
  const areas = [element];
  let next = element.nextElementSibling;
  while (next && areas.length < 3) {
    if (next.matches('.area--size-33')) areas.push(next);
    else if (next.tagName !== 'HR') break;
    next = next.nextElementSibling;
  }

  const cells = [];
  areas.forEach((area) => {
    const content = parseCard(document, area);
    if (content.length) cells.push([content]);
  });

  areas.slice(1).forEach((area) => area.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
