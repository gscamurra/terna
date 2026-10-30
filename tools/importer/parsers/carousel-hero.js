/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-hero (Terna homepage full-height slider).
 * Source: .area--area-1 .terna-sliderfullheight
 * Block rows: one per slide -> [image | title + description + CTA | tab label]
 * The slider also wraps .teleborsa--wrapper (widget-ticker); it is moved out
 * (with its section <hr>) so the widget-ticker parser can still handle it.
 */

const ORIGIN = 'https://www.terna.it';

function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${ORIGIN}${url}`;
  if (/^(DesktopModules|Portals)\//i.test(url)) return `${ORIGIN}/${url}`;
  return url;
}

function cloneImage(document, img) {
  const out = document.createElement('img');
  out.src = absUrl(img.getAttribute('data-src') || img.getAttribute('src'));
  out.alt = img.getAttribute('alt') || '';
  return out;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Finds the slide's "video" URL in the Vue data-layer JSON (escaped inside a
 * JSON.parse('...') string) by locating the slide object via its image id.
 */
function videoFromConfig(config, img) {
  if (!config || !img) return '';
  const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
  const id = (src.match(/[?&]image=(\d+)/) || [])[1];
  if (!id) return '';
  const start = config.indexOf(`image=${id}\\"`);
  if (start < 0) return '';
  const next = config.indexOf('{\\"title\\"', start);
  const segment = config.slice(start, next < 0 ? start + 3000 : next);
  const m = segment.match(/\\"video\\":\\"([^"\\]+)\\"/);
  return m ? m[1] : '';
}

export default function parse(element, { document }) {
  // Keep the share-price ticker (and its section break) outside the block.
  const tickers = [...element.querySelectorAll('.teleborsa--wrapper')];
  let anchor = element;
  tickers.forEach((ticker) => {
    const prev = ticker.previousElementSibling;
    if (prev && prev.tagName === 'HR') {
      anchor.after(prev);
      anchor = prev;
    }
    anchor.after(ticker);
    anchor = ticker;
  });

  const slides = [...element.querySelectorAll('.swiper-wrapper > .swiper-slide')]
    .filter((s) => !s.classList.contains('swiper-slide-duplicate'));
  const labels = [...element.querySelectorAll('.swiper-pagination .swiper-pagination-bullet')]
    .map((b) => text(b.querySelector('.pagination-text') || b));

  const host = element.closest('.area') || element.parentElement || element;
  const configText = [...host.querySelectorAll('script')]
    .map((s) => s.textContent)
    .filter((s) => s.includes('vueDataLayer'))
    .join('\n');

  const cells = [];
  slides.forEach((slide, i) => {
    const img = slide.querySelector('img.swiper-slide-image')
      || [...slide.querySelectorAll('img')].find((im) => !im.closest('.item-link, .swiper-slide-content'));
    const imageCell = img ? [cloneImage(document, img)] : [''];

    const content = [];
    const titleEl = slide.querySelector('.item-title');
    const title = text(titleEl);
    if (title) {
      const h = document.createElement(titleEl.tagName === 'H1' ? 'h1' : 'h2');
      h.textContent = title;
      content.push(h);
    }

    const textEl = slide.querySelector('.item-text');
    if (textEl) {
      const paras = [...textEl.querySelectorAll('p')].filter((p) => text(p));
      if (paras.length) {
        paras.forEach((p) => {
          const np = document.createElement('p');
          np.textContent = text(p);
          content.push(np);
        });
      } else if (text(textEl)) {
        const np = document.createElement('p');
        np.textContent = text(textEl);
        content.push(np);
      }
    }

    const link = slide.querySelector('.item-link a[href], a.play-btn[href], a.overlay-link[href]');
    let href = link ? link.getAttribute('href') : '';
    let label = link ? (text(link) || link.getAttribute('title')) : '';
    if (!href) {
      // icon-only "Play video" button may be stripped before parsing: read the
      // slide's video URL from the Vue data-layer config instead
      href = videoFromConfig(configText, img);
      if (href) label = 'Play video';
    }
    if (href) {
      const a = document.createElement('a');
      a.href = absUrl(href);
      a.textContent = label || 'Scopri di più';
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    }

    cells.push([imageCell, content.length ? content : [''], labels[i] || title || '']);
  });

  // Tab labels are now in the block; drop the source bullets.
  element.querySelectorAll('.swiper-pagination').forEach((p) => p.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
