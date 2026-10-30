/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner (in-page photo banner with overlay text).
 * Source: .area--area-32 .website-vue .content-item:nth-child(1|3) .terna-slidecontent
 * Block: row 1 = background image; row 2 = eyebrow <p>, <h2> title, description, CTA link.
 */

const ORIGIN = 'https://www.terna.it';

function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${ORIGIN}${url}`;
  if (/^(DesktopModules|Portals)\//i.test(url)) return `${ORIGIN}/${url}`;
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

export default function parse(element, { document }) {
  const slide = element.querySelector('.swiper-slide:not(.swiper-slide-duplicate)') || element;
  const content = slide.querySelector('.swiper-slide-content') || slide;

  const cells = [];

  const srcImg = [...slide.querySelectorAll('img')].find((im) => !im.closest('.swiper-slide-content'));
  if (srcImg) {
    const img = document.createElement('img');
    img.src = absUrl(srcImg.getAttribute('data-src') || srcImg.getAttribute('src'));
    img.alt = srcImg.getAttribute('alt') || '';
    cells.push([img]);
  } else {
    cells.push(['']);
  }

  const out = [];
  const eyebrow = text(content.querySelector('.terna-slidecontent-item-section'));
  if (eyebrow) out.push(para(document, eyebrow));
  const title = text(content.querySelector('.terna-slidecontent-item-title'));
  if (title) {
    const h = document.createElement('h2');
    h.textContent = title;
    out.push(h);
  }
  const desc = text(content.querySelector('.terna-slidecontent-item-text'));
  if (desc) out.push(para(document, desc));
  const a = content.querySelector('.terna-slidecontent-item-link a[href]');
  if (a) {
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'));
    link.textContent = text(a) || a.getAttribute('title') || 'Per saperne di più';
    out.push(para(document, link));
  }
  cells.push([out.length ? out : '']);

  // The source only darkens photos that carry an .image-overlay element
  const variants = element.querySelector('.image-overlay') ? [] : ['no overlay'];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', variants, cells });
  element.replaceWith(block);
}
