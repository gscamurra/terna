import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';
// a stat value: starts with a digit, short, optionally followed by a short unit ("4.033,0", "98%")
const VALUE_RE = /^\d[\d.,'\s]*\S{0,6}$/;
// a delta line: "+4,6% vs 2024", "-1,2%", "vs 2024"
const DELTA_RE = /^([+\-−±]\s?\d|.*\bvs\.?\s)/i;

const LABELS = {
  it: {
    carousel: 'Carosello indicatori',
    nav: 'Categorie indicatori',
    prev: 'Diapositiva precedente',
    next: 'Diapositiva successiva',
    slide: 'Diapositiva',
  },
  en: {
    carousel: 'KPI carousel',
    nav: 'KPI categories',
    prev: 'Previous slide',
    next: 'Next slide',
    slide: 'Slide',
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
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });
}

const ICON_TOKEN_RE = /^:([a-z0-9-]+):$/;

/** Resolves an authored `:icon-name:` token left as plain text into an /icons/ image. */
function decorateIconToken(cell) {
  const match = cell.textContent.trim().match(ICON_TOKEN_RE);
  if (!match || cell.querySelector('picture, img, span.icon')) return;
  const span = document.createElement('span');
  span.className = `icon icon-${match[1]}`;
  cell.replaceChildren(span);
  decorateIcons(cell);
}

// a trailing parenthetical unit note, e.g. "al 31 dicembre 2025 (milioni di euro)"
const TRAILING_NOTE_RE = /^(.*\S)\s+(\([^()]+\))$/;

/** Renders a trailing "(unit)" note of a plain-text paragraph in a smaller size. */
function smallTrailingNote(el) {
  if (el.children.length) return;
  const match = el.textContent.trim().match(TRAILING_NOTE_RE);
  if (!match) return;
  const [, text, note] = match;
  const small = document.createElement('small');
  small.textContent = note;
  el.replaceChildren(`${text} `, small);
}

function isIconCell(cell) {
  return !!cell.querySelector('picture, img, span.icon') && !cell.textContent.trim();
}

/**
 * Turns one group of elements (value, label, delta lines) into a stat item.
 * When the group comes from an explicit container (list item, cell), the first line is
 * always the value, so figures like "Top Employer 2025", "oltre 59" or "-31%" style as values.
 */
function buildStat(elements, firstIsValue = false) {
  const li = document.createElement('li');
  li.className = 'carousel-kpi-stat';
  elements.forEach((el, i) => {
    const text = el.textContent.trim();
    if (i === 0 && (firstIsValue || VALUE_RE.test(text))) el.classList.add('carousel-kpi-stat-value');
    else if (DELTA_RE.test(text)) el.classList.add('carousel-kpi-stat-delta');
    else if (!li.querySelector('.carousel-kpi-stat-label')) el.classList.add('carousel-kpi-stat-label');
    else el.classList.add('carousel-kpi-stat-note');
    li.append(el);
  });
  return li;
}

/**
 * Splits slide content into header (title + reference date) and stats.
 * Stats come from a list (one item per stat), from extra cells, or from paragraph runs
 * where each numeric paragraph starts a new stat.
 */
function buildSlideBody(content, extraCells) {
  const header = document.createElement('div');
  header.className = 'carousel-kpi-slide-header';
  const stats = document.createElement('ul');
  stats.className = 'carousel-kpi-stats';

  const children = content ? [...content.children] : [];
  const list = children.find((el) => el.matches('ul, ol'));
  let group = null;
  let seenHeading = false;

  children.forEach((el) => {
    if (el === list) {
      [...list.children].forEach((item) => {
        const parts = [...item.children].filter((c) => c.matches('p, div, span, strong'));
        if (parts.length > 1) {
          stats.append(buildStat(parts, true));
        } else {
          item.className = 'carousel-kpi-stat';
          stats.append(item);
        }
      });
      return;
    }
    const text = el.textContent.trim();
    if (el.matches(HEADING_SEL)) {
      el.classList.add('carousel-kpi-slide-title');
      header.append(el);
      seenHeading = true;
      return;
    }
    if (!text && !el.querySelector('picture, img')) return;
    if (!list && VALUE_RE.test(text)) {
      if (group) stats.append(buildStat(group));
      group = [el];
    } else if (group) {
      group.push(el);
    } else {
      el.classList.add(seenHeading ? 'carousel-kpi-slide-meta' : 'carousel-kpi-slide-eyebrow');
      if (seenHeading) smallTrailingNote(el);
      header.append(el);
    }
  });
  if (group) stats.append(buildStat(group));

  extraCells.forEach((cell) => {
    const parts = [...cell.children];
    if (parts.length) stats.append(buildStat(parts, parts.length > 1));
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      stats.append(buildStat([p]));
    }
  });

  return { header, stats };
}

let carouselId = 0;

export default function decorate(block) {
  carouselId += 1;
  const id = `carousel-kpi-${carouselId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', t('carousel'));

  const nav = document.createElement('div');
  nav.className = 'carousel-kpi-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', t('nav'));
  nav.setAttribute('aria-orientation', 'vertical');

  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-kpi-slides';

  const slides = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    cells.forEach(decorateIconToken);
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const icon = cells.find(isIconCell);
    const rest = cells.filter((c) => c !== icon && (c.textContent.trim() || c.children.length));
    const content = rest.find((c) => c.querySelector(HEADING_SEL)) || rest[0];
    const extra = rest.filter((c) => c !== content);
    const index = slides.length;

    const slide = document.createElement('li');
    slide.className = 'carousel-kpi-slide';
    slide.id = `${id}-slide-${index}`;
    slide.setAttribute('role', 'tabpanel');
    const { header, stats } = buildSlideBody(content, extra);
    slide.append(header);
    if (stats.children.length) slide.append(stats);

    const title = header.querySelector('.carousel-kpi-slide-title');
    const label = (title && title.textContent.trim()) || `${t('slide')} ${index + 1}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'carousel-kpi-nav-item';
    tab.id = `${id}-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', slide.id);
    tab.setAttribute('aria-label', label);
    slide.setAttribute('aria-labelledby', tab.id);
    if (icon) {
      optimizePictures(icon);
      tab.append(...icon.childNodes);
      tab.querySelectorAll('img').forEach((img) => { img.alt = ''; });
      // monochrome SVG icons (stroke="currentColor") are painted via a CSS mask so they
      // can take the active/inactive colour, which an <img> cannot inherit
      const svg = tab.querySelector('.icon img[src$=".svg"]');
      if (svg) {
        tab.classList.add('carousel-kpi-nav-item-mask');
        svg.closest('.icon').style.setProperty('--carousel-kpi-icon', `url("${svg.getAttribute('src')}")`);
      }
    } else {
      tab.textContent = String(index + 1);
    }

    slides.push({ slide, tab });
    slidesList.append(slide);
    nav.append(tab);
  });

  if (!slides.length) {
    block.replaceChildren();
    return;
  }

  const viewport = document.createElement('div');
  viewport.className = 'carousel-kpi-viewport';
  viewport.append(slidesList);

  let active = 0;
  let prev;
  let next;
  const show = (index, focus = false) => {
    active = (index + slides.length) % slides.length;
    block.dataset.activeSlide = active;
    slides.forEach(({ slide, tab }, i) => {
      const isActive = i === active;
      slide.classList.toggle('carousel-kpi-slide-active', isActive);
      slide.setAttribute('aria-hidden', !isActive);
      slide.querySelectorAll('a, button').forEach((el) => {
        if (isActive) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
      tab.setAttribute('aria-selected', isActive);
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) tab.focus();
    });
    // prev/next stop at the ends, like the source slider (no loop)
    if (prev) prev.disabled = active === 0;
    if (next) next.disabled = active === slides.length - 1;
  };

  if (slides.length > 1) {
    prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'carousel-kpi-prev';
    prev.setAttribute('aria-label', t('prev'));
    prev.addEventListener('click', () => show(active - 1));
    next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-kpi-next';
    next.setAttribute('aria-label', t('next'));
    next.addEventListener('click', () => show(active + 1));

    slides.forEach(({ tab }, i) => tab.addEventListener('click', () => show(i)));
    nav.addEventListener('keydown', (e) => {
      const moves = {
        ArrowDown: active + 1,
        ArrowRight: active + 1,
        ArrowUp: active - 1,
        ArrowLeft: active - 1,
        Home: 0,
        End: slides.length - 1,
      };
      if (!(e.key in moves)) return;
      e.preventDefault();
      show(moves[e.key], true);
    });

    const panel = document.createElement('div');
    panel.className = 'carousel-kpi-panel';
    panel.append(nav, viewport);
    block.replaceChildren(prev, panel, next);
  } else {
    const panel = document.createElement('div');
    panel.className = 'carousel-kpi-panel';
    panel.append(viewport);
    block.replaceChildren(panel);
  }

  show(0);
}
