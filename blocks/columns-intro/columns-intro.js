import { createOptimizedPicture } from '../../scripts/aem.js';

const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

function optimizePictures(scope) {
  scope.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/** A paragraph holding exactly one link and nothing else (also after button decoration). */
function isLinkOnly(el) {
  if (!el || !el.matches('p')) return false;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && !el.querySelector('picture, img')
    && el.textContent.trim() === links[0].textContent.trim();
}

export default function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
    [...row.children].forEach((cell) => {
      if (!cells.includes(cell)) cell.remove();
    });
    row.classList.add('columns-intro-row');
    // the cell holding the heading leads; if none does, the first cell leads
    const main = cells.find((cell) => cell.querySelector(HEADING_SEL)) || cells[0];
    cells.forEach((cell) => {
      optimizePictures(cell);
      if (cell.querySelector('picture, img') && !cell.textContent.trim()) {
        cell.classList.add('columns-intro-image');
      } else {
        cell.classList.add(cell === main ? 'columns-intro-main' : 'columns-intro-text');
      }
      [...cell.children].forEach((el) => {
        if (isLinkOnly(el)) el.classList.add('columns-intro-cta');
      });
    });
    row.classList.add(`columns-intro-${cells.length}-cols`);
    // keep the leading cell first regardless of authored order
    if (main && row.firstElementChild !== main) row.prepend(main);
  });
}
