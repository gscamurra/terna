import { createOptimizedPicture } from '../../scripts/aem.js';

const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

/** A paragraph holding exactly one link and nothing else (also after button decoration). */
function isLinkOnly(el) {
  if (!el || !el.matches('p')) return false;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && !el.querySelector('picture, img')
    && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * In-page photo banner. Accepts the image in its own row/cell or inside the text cell;
 * every other element becomes overlay content (eyebrow, title, text, link).
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-banner-image';
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim()) {
            const p = document.createElement('p');
            p.textContent = node.textContent.trim();
            content.append(p);
          }
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const pic = node.matches('picture, img') ? node : node.querySelector('picture, img');
        // first image is the background; text-free wrappers around it are dropped
        if (pic && !media.children.length && !node.textContent.trim()) {
          media.append(pic);
          return;
        }
        if (pic && !media.children.length) media.append(pic);
        content.append(node);
      });
    });
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]));
  });

  const children = [...content.children];
  const headingIndex = children.findIndex((el) => el.matches(HEADING_SEL));
  if (headingIndex > 0) {
    children.slice(0, headingIndex).forEach((el) => {
      if (el.matches('p') && !el.querySelector('a, picture, img')) el.classList.add('hero-banner-eyebrow');
    });
  }
  if (headingIndex >= 0) children[headingIndex].classList.add('hero-banner-title');
  if (isLinkOnly(content.lastElementChild)) content.lastElementChild.classList.add('hero-banner-cta');

  if (media.children.length) {
    block.replaceChildren(media, content);
  } else {
    block.classList.add('hero-banner-no-image');
    block.replaceChildren(content);
  }
}
