import { createOptimizedPicture } from '../../scripts/aem.js';

const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

/** A paragraph holding exactly one link and nothing else (also after button decoration). */
function isLinkOnly(el) {
  if (!el || !el.matches('p')) return false;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && !el.querySelector('picture, img')
    && el.textContent.trim() === links[0].textContent.trim();
}

function decorateBody(body) {
  body.className = 'cards-promo-card-body';
  const children = [...body.children];
  const headingIndex = children.findIndex((el) => el.matches(HEADING_SEL));
  // a short text paragraph before the title is the eyebrow
  if (headingIndex > 0) {
    children.slice(0, headingIndex).forEach((el) => {
      if (el.matches('p') && !el.querySelector('a, picture, img')) el.classList.add('cards-promo-card-eyebrow');
    });
  }
  if (headingIndex >= 0) children[headingIndex].classList.add('cards-promo-card-title');
  const last = body.lastElementChild;
  if (isLinkOnly(last)) last.classList.add('cards-promo-card-cta');
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-promo-card';
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
    const bodies = [];
    cells.forEach((cell) => {
      if (cell.querySelector('picture, img') && !cell.textContent.trim()) {
        cell.className = 'cards-promo-card-image';
        li.append(cell);
      } else {
        bodies.push(cell);
      }
    });
    // several text cells (author split eyebrow/title/text) collapse into one body
    if (bodies.length) {
      const [body, ...extra] = bodies;
      extra.forEach((cell) => body.append(...cell.childNodes));
      decorateBody(body);
      li.append(body);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
