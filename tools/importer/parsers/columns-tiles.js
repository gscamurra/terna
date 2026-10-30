/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-tiles (3 bordered tiles side by side).
 * Instance selector matches the first .area--size-33 column of a row
 * (.area--area-3 / -23 / -26); its next two .area--size-33 siblings are
 * gathered into the same block and removed.
 * Block: one row, three cells (one per tile). Tile content:
 *   eyebrow <p>, title <h3>, body (embed link / list / slides), CTA <p><a>.
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

function heading(document, value) {
  const h = document.createElement('h3');
  h.textContent = value;
  return h;
}

function link(document, href, label) {
  const a = document.createElement('a');
  a.href = absUrl(href);
  a.textContent = label;
  return a;
}

function ctaFrom(document, scope) {
  const a = scope && scope.querySelector('a[href]');
  if (!a) return null;
  const label = text(a) || a.getAttribute('title') || 'Per saperne di più';
  return para(document, link(document, a.getAttribute('href'), label));
}

function image(document, img) {
  const out = document.createElement('img');
  out.src = absUrl(img.getAttribute('data-src') || img.getAttribute('src'));
  out.alt = img.getAttribute('alt') || '';
  return out;
}

/** Embedded chart tile (.terna-iframe). */
function iframeTile(document, cmp) {
  const out = [];
  const eyebrow = text(cmp.querySelector('.terna-iframe-section'));
  if (eyebrow) out.push(para(document, eyebrow));
  const iframe = cmp.querySelector('iframe[src], iframe[data-src]');
  let src = iframe ? (iframe.getAttribute('src') || iframe.getAttribute('data-src')) : '';
  if (!src || src === 'about:blank') {
    // live DOM may not have rendered the iframe yet; read the Vue data-layer config
    const host = cmp.closest('.area--size-33') || cmp.closest('.area') || cmp;
    const m = host.innerHTML.match(/iframe_url\\*"\s*:\s*\\*"([^"\\]+)/);
    src = m ? m[1] : '';
  }
  if (src) {
    src = absUrl(src);
    out.push(para(document, link(document, src, src)));
  }
  const cta = ctaFrom(document, cmp.querySelector('.terna-iframe-link'));
  if (cta) out.push(cta);
  return out;
}

/**
 * Text label for an icon-only document link (<a><i class="terna-icon-*"></i></a>).
 * import-home.js preprocess() writes the same label into the link so it survives
 * the importer's empty-inline cleanup; this also covers the direct parse path.
 */
function iconLabel(a) {
  const own = text(a) || a.getAttribute('title') || a.getAttribute('aria-label');
  if (own) return own;
  const icon = a.querySelector('[class*="terna-icon-"]');
  const kind = icon ? (icon.className.match(/terna-icon-([a-z-]+)/) || [])[1] : '';
  const href = a.getAttribute('href') || '';
  if (kind === 'download' || /\.pdf(\?|#|$)/i.test(href)) return 'PDF';
  if (kind === 'slideshare' || /slideshare\./i.test(href)) return 'SlideShare';
  if (/euronext|engagestream|webcast/i.test(href)) return 'Webcast';
  if (kind === 'link-esterno') return 'Link esterno';
  return 'Dettaglio';
}

/** Document list tile (.terna-documentlistcover / -archivio). */
function listTile(document, cmp) {
  const out = [];
  const eyebrow = text(cmp.querySelector('.terna-documentlistcover-section, .terna-documentlistcoverarchivio-section'));
  if (eyebrow) out.push(para(document, eyebrow));
  const ul = document.createElement('ul');
  cmp.querySelectorAll('.swiper-slide').forEach((item) => {
    const a = item.querySelector('a.item-title[href]');
    if (!a) return;
    const li = document.createElement('li');
    const label = a.getAttribute('title') || text(a);
    li.append(para(document, link(document, a.getAttribute('href'), label)));
    // date + icon links (PDF / SlideShare / webcast) share one row on the source;
    // keeping them in the date paragraph avoids single-link button decoration
    const date = text(item.querySelector('.item-date'));
    const iconLinks = [...item.querySelectorAll('.item-links a[href]')];
    if (date || iconLinks.length) {
      const p = document.createElement('p');
      if (date) p.append(date);
      iconLinks.forEach((icon) => {
        if (p.childNodes.length) p.append(' ');
        p.append(link(document, icon.getAttribute('href'), iconLabel(icon)));
      });
      li.append(p);
    }
    ul.append(li);
  });
  if (ul.children.length) out.push(ul);
  const cta = ctaFrom(document, cmp.querySelector('.terna-documentlistcover-link, .terna-documentlistcoverarchivio-link'));
  if (cta) out.push(cta);
  return out;
}

/** Slide content tile (.terna-slidecontent): one or more slides. */
function slideTile(document, cmp) {
  const out = [];
  const slides = [...cmp.querySelectorAll('.swiper-slide')]
    .filter((s) => !s.classList.contains('swiper-slide-duplicate'));
  slides.forEach((slide) => {
    const img = [...slide.querySelectorAll('img')].find((im) => !im.closest('.terna-slidecontent-item-section, .terna-link'));
    // Lightbox logo link ("Vai al Blog") above the slide title. It shares the
    // slide-image paragraph: the block starts a new slide at every element
    // holding an image, so a separate paragraph would split each slide in two.
    const logo = slide.querySelector('.terna-slidecontent-item-section img, .item-logo-lightbox img');
    if (img || logo) {
      const p = document.createElement('p');
      if (img) p.append(image(document, img));
      if (logo) {
        const logoLink = logo.closest('a[href]');
        const logoImg = image(document, logo);
        if (logoLink) {
          const a = link(document, logoLink.getAttribute('href'), '');
          a.append(logoImg);
          p.append(a);
        } else {
          p.append(logoImg);
        }
      }
      out.push(p);
    }
    const eyebrow = text(slide.querySelector('.terna-slidecontent-item-section'));
    if (eyebrow) out.push(para(document, eyebrow));
    const title = text(slide.querySelector('.terna-slidecontent-item-title'));
    if (title) out.push(heading(document, title));
    const body = text(slide.querySelector('.terna-slidecontent-item-text'));
    if (body) out.push(para(document, body));
    const cta = ctaFrom(document, slide.querySelector('.terna-slidecontent-item-link'));
    if (cta) out.push(cta);
  });
  return out;
}

/** Investor calendar tile (custom HTML .hp-calendar). */
function calendarTile(document, cmp) {
  const out = [];
  const slide = cmp.querySelector('.calendar-slide') || cmp;
  const eyebrow = text(slide.querySelector('.calendar-slide__section'));
  if (eyebrow) out.push(para(document, eyebrow));
  const title = text(slide.querySelector('.calendar-slide__title'));
  if (title) out.push(heading(document, title));
  const body = text(slide.querySelector('.calendar-slide__text'));
  if (body) out.push(para(document, body));
  slide.querySelectorAll('.calendar-slide__date p').forEach((p) => {
    const v = text(p);
    if (v) out.push(para(document, v));
  });
  const cta = ctaFrom(document, slide.querySelector('.calendar-slide__link-bottom'));
  if (cta) out.push(cta);
  return out;
}

function fallbackTile(document, area) {
  const out = [];
  area.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach((el) => {
    const v = text(el);
    if (v) out.push(para(document, v));
  });
  return out;
}

function parseTile(document, area) {
  let cmp = area.querySelector('.terna-iframe, .cmp--terna-iframe');
  if (cmp) return iframeTile(document, cmp);
  cmp = area.querySelector('.terna-documentlistcover, .terna-documentlistcoverarchivio');
  if (cmp) return listTile(document, cmp);
  cmp = area.querySelector('.hp-calendar');
  if (cmp) return calendarTile(document, cmp);
  cmp = area.querySelector('.terna-slidecontent');
  if (cmp) return slideTile(document, cmp);
  return fallbackTile(document, area);
}

export default function parse(element, { document }) {
  const areas = [element];
  let next = element.nextElementSibling;
  while (next && areas.length < 3) {
    if (next.matches('.area--size-33')) areas.push(next);
    else if (next.tagName !== 'HR') break;
    next = next.nextElementSibling;
  }

  const row = areas.map((area) => {
    const content = parseTile(document, area);
    return content.length ? content : '';
  });
  while (row.length < 3) row.push('');

  areas.slice(1).forEach((area) => area.remove());

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-tiles', cells });
  element.replaceWith(block);
}
