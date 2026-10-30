/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-kpi (KPI highlights slider with icon navigation).
 * Source: .kpi-swiper
 * Block: one row per slide -> [icon | h3 title, reference date <p>, <ul> stats]
 * Icons come from the .kpi-swiper__pagination buttons (same order as slides).
 * Each stat <li> holds: value <p>, label <p>, then delta / note <p>s.
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

function slug(value) {
  return (value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function para(document, value) {
  const p = document.createElement('p');
  p.textContent = value;
  return p;
}

export default function parse(element, { document }) {
  // Tab buttons hold the icons: <img> in the cached DOM, inline <svg> on the live page.
  const icons = [...element.querySelectorAll('.kpi-swiper__pagination > *')].map((btn) => {
    const holder = btn.querySelector('[aria-label]');
    const alt = (holder && holder.getAttribute('aria-label')) || '';
    const img = btn.querySelector('img[src]');
    if (img) return { src: absUrl(img.getAttribute('src')), alt: img.getAttribute('alt') || alt };
    const svg = btn.querySelector('svg');
    if (svg) {
      if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`, alt };
    }
    return null;
  });

  // "Per saperne di più" link sits inside the slider but is section default content.
  let anchor = element;
  [...element.querySelectorAll('div.kpi-swiper--link')].forEach((linkWrap) => {
    anchor.after(linkWrap);
    anchor = linkWrap;
  });

  const slides = [...element.querySelectorAll('.swiper-wrapper > .swiper-slide')]
    .filter((s) => !s.classList.contains('swiper-slide-duplicate'));

  const cells = [];
  slides.forEach((slide, i) => {
    const content = [];
    const title = text(slide.querySelector('.kpi-slide--title'));
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title;
      content.push(h);
    }
    const subtitle = text(slide.querySelector('.kpi-slide--subtitle'));
    if (subtitle) content.push(para(document, subtitle));

    const ul = document.createElement('ul');
    slide.querySelectorAll('.kpi-slide--content').forEach((stat) => {
      const li = document.createElement('li');
      const value = text(stat.querySelector('h1, h2, h3, h4, strong'));
      if (value) li.append(para(document, value));
      const p = stat.querySelector('p');
      if (p) {
        const label = p.cloneNode(true);
        label.querySelectorAll('small, br').forEach((n) => n.remove());
        if (text(label)) {
          const lp = document.createElement('p');
          lp.innerHTML = label.innerHTML.trim();
          li.append(lp);
        }
        p.querySelectorAll('small').forEach((s) => {
          const v = text(s);
          if (!v) return;
          const sp = document.createElement('p');
          if (s.querySelector('em')) {
            const em = document.createElement('em');
            em.textContent = v;
            sp.append(em);
          } else {
            sp.textContent = v;
          }
          li.append(sp);
        });
      }
      if (li.children.length) ul.append(li);
    });
    if (ul.children.length) content.push(ul);

    // The source icons are inline SVG / data: URIs, which html2md drops, so the
    // icon cell is authored as an EDS icon token (:kpi-<name>:) resolved from /icons.
    // Name comes from the tab aria-label ("Icona KPI Finanziari") or the slide title.
    const icon = icons[i];
    const iconSource = (icon && icon.alt) || title.replace(/^highlight\s+/i, 'KPI ');
    const iconName = slug(iconSource.replace(/^icona\s+/i, ''));
    const iconCell = iconName ? [para(document, `:${iconName}:`)] : '';

    cells.push([iconCell, content.length ? content : '']);
  });

  // Icons are now in the block; drop the source tab bar.
  element.querySelectorAll('.kpi-swiper__pagination').forEach((p) => p.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-kpi', cells });
  element.replaceWith(block);
}
