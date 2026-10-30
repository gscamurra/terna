import { createOptimizedPicture } from '../../scripts/aem.js';

const LIST_PAGE_SIZE = 3;
const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

const LABELS = {
  it: {
    page: 'Pagina', slide: 'Articolo', pages: 'Paginazione', embed: 'Contenuto incorporato',
  },
  en: {
    page: 'Page', slide: 'Article', pages: 'Pagination', embed: 'Embedded content',
  },
};

function t(key) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  return (LABELS[lang] || LABELS.en)[key];
}

function optimizePictures(scope) {
  scope.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/** A paragraph holding exactly one link and nothing else (also after button decoration). */
function isLinkOnly(el) {
  if (!el || !el.matches('p, div')) return false;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && !el.querySelector('picture, img')
    && el.textContent.trim() === links[0].textContent.trim();
}

/** A link whose visible text is its own URL: authored as an embed (iframe) reference. */
function embedLink(el) {
  if (!isLinkOnly(el)) return null;
  const a = el.querySelector('a[href]');
  const text = a.textContent.trim();
  if (!/^https?:\/\//i.test(text) || a.href.includes('/widgets/')) return null;
  try {
    return new URL(a.href).href === new URL(text).href ? a : null;
  } catch {
    return null;
  }
}

/** Builds dot pagination that shows one group of elements at a time. */
function buildPager(groups, labelKey, onChange) {
  const pager = document.createElement('div');
  pager.className = 'columns-tiles-pager';
  pager.setAttribute('role', 'group');
  pager.setAttribute('aria-label', t('pages'));
  const buttons = groups.map((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'columns-tiles-pager-dot';
    btn.setAttribute('aria-label', `${t(labelKey)} ${i + 1} / ${groups.length}`);
    pager.append(btn);
    return btn;
  });
  const show = (index) => {
    groups.forEach((els, i) => els.forEach((el) => { el.hidden = i !== index; }));
    buttons.forEach((btn, i) => btn.setAttribute('aria-current', i === index));
    if (onChange) onChange(index);
  };
  buttons.forEach((btn, i) => btn.addEventListener('click', () => show(i)));
  show(0);
  return pager;
}

function paginateList(list) {
  const items = [...list.children];
  if (items.length <= LIST_PAGE_SIZE) return;
  const groups = [];
  for (let i = 0; i < items.length; i += LIST_PAGE_SIZE) {
    groups.push(items.slice(i, i + LIST_PAGE_SIZE));
  }
  list.classList.add('columns-tiles-list-paged');
  list.after(buildPager(groups, 'page'));
}

/** True when the element is or holds a content image (decorated icons do not count). */
function hasImage(el) {
  if (el.matches('img')) return !el.closest('.icon');
  return [...el.querySelectorAll('img')].some((img) => !img.closest('.icon'));
}

/**
 * A slide-start paragraph may hold the background image plus a linked logo image
 * (e.g. the Lightbox brand mark): the linked image moves to its own logo paragraph.
 */
function splitSlideLogos(tile) {
  [...tile.children].forEach((el) => {
    if (!el.matches('p') || el.textContent.trim()) return;
    const hasBackground = [...el.querySelectorAll('img')].some((img) => !img.closest('a, .icon'));
    if (!hasBackground) return;
    const links = [...el.querySelectorAll('a[href]')].filter((a) => a.querySelector('picture, img'));
    if (!links.length) return;
    const logo = document.createElement('p');
    logo.className = 'columns-tiles-slide-logo';
    logo.append(...links);
    el.after(logo);
  });
}

/** Groups tile content into slides: each image starts a new slide. */
function buildSlider(tile) {
  splitSlideLogos(tile);
  const slider = document.createElement('div');
  slider.className = 'columns-tiles-slider';
  const slides = [];
  let current = null;
  [...tile.children].forEach((el) => {
    if (hasImage(el) && !el.classList.contains('columns-tiles-slide-logo')) {
      current = document.createElement('div');
      current.className = 'columns-tiles-slide';
      slides.push(current);
      slider.append(current);
    }
    if (current) {
      if (!el.textContent.trim() && !el.classList.contains('columns-tiles-slide-logo')) {
        el.classList.add('columns-tiles-slide-image');
      }
      current.append(el);
    }
  });
  if (slides.length < 2) return;
  slides.forEach((slide) => {
    if (isLinkOnly(slide.lastElementChild)) slide.lastElementChild.classList.add('columns-tiles-cta');
  });
  tile.append(slider);
  tile.classList.add('columns-tiles-tile-slider');
  slider.append(buildPager(slides.map((s) => [s]), 'slide'));
}

/** Icon for a document link, chosen from its label (PDF, SlideShare, Webcast, Dettaglio). */
function docLinkIcon(label) {
  const text = label.toLowerCase();
  if (text.includes('pdf')) return 'download';
  if (text.includes('slideshare')) return 'slideshare';
  if (text.includes('webcast')) return 'external';
  return 'link';
}

/**
 * Document lists carry links next to the item date (PDF / SlideShare / Webcast / Dettaglio):
 * they render as an icon row on the right of the date, as on the source.
 */
function decorateDocLinks(list) {
  let found = false;
  list.querySelectorAll(':scope > li > p:not(:first-child)').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (!links.length) return;
    found = true;
    p.classList.add('columns-tiles-doc-meta');
    links.forEach((a) => {
      const label = a.textContent.trim();
      a.classList.add('columns-tiles-doc-link', `columns-tiles-doc-link-${docLinkIcon(label)}`);
      if (label && !a.getAttribute('aria-label')) a.setAttribute('aria-label', label);
    });
  });
  if (found) list.classList.add('columns-tiles-list-docs');
}

function decorateTile(tile) {
  tile.classList.add('columns-tiles-tile');
  if (!tile.textContent.trim() && !tile.querySelector('picture, img, iframe')) {
    tile.classList.add('columns-tiles-tile-empty');
    return;
  }
  optimizePictures(tile);

  const children = [...tile.children];
  const first = children[0];
  if (
    first && children.length > 1 && first.matches('p')
    && !first.querySelector('a, picture, img') && first.textContent.trim().length <= 80
  ) {
    first.classList.add('columns-tiles-eyebrow');
  }
  children.filter((el) => el.matches(HEADING_SEL)).forEach((h) => h.classList.add('columns-tiles-title'));

  children.forEach((el) => {
    const link = embedLink(el);
    if (!link) return;
    const iframe = document.createElement('iframe');
    iframe.src = link.href;
    iframe.loading = 'lazy';
    const eyebrow = tile.querySelector('.columns-tiles-eyebrow');
    iframe.title = (eyebrow && eyebrow.textContent.trim()) || t('embed');
    const wrap = document.createElement('div');
    wrap.className = 'columns-tiles-embed';
    wrap.append(iframe);
    el.replaceWith(wrap);
    tile.classList.add('columns-tiles-tile-embed');
  });

  const imageCount = [...tile.querySelectorAll('img')].filter((img) => !img.closest('.icon')).length;
  if (imageCount > 1) {
    buildSlider(tile);
  } else if (imageCount === 1) {
    tile.classList.add('columns-tiles-tile-image');
  }

  tile.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
    list.classList.add('columns-tiles-list');
    decorateDocLinks(list);
    paginateList(list);
    tile.classList.add('columns-tiles-tile-list');
  });

  // the trailing link-only paragraph is the tile CTA, pinned to the bottom
  const last = tile.lastElementChild;
  if (isLinkOnly(last)) last.classList.add('columns-tiles-cta');

  // a title followed by body text (e.g. calendar event) is laid out centered
  const title = tile.querySelector(':scope > .columns-tiles-title');
  const next = title && title.nextElementSibling;
  if (next && next.matches('p:not(.columns-tiles-cta)')) tile.classList.add('columns-tiles-tile-event');
}

export default function decorate(block) {
  const rows = [...block.children];
  const cols = Math.max(1, ...rows.map((row) => row.children.length));
  block.classList.add(`columns-tiles-${cols}-cols`);
  rows.forEach((row) => {
    row.classList.add('columns-tiles-row');
    [...row.children].forEach(decorateTile);
  });
}
