const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

/**
 * Text-only navigation tiles. Each row is one tile: a title (heading or paragraph, linked)
 * and a short description. The first link becomes the tile's link and the whole tile is clickable.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim()) return;
    const li = document.createElement('li');
    li.className = 'cards-nav-card';
    const body = document.createElement('div');
    body.className = 'cards-nav-card-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));
    // wrap stray text nodes so every child is an element
    [...body.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = node.textContent.trim();
        node.replaceWith(p);
      } else if (node.nodeType === Node.TEXT_NODE) {
        node.remove();
      }
    });

    const title = body.querySelector(HEADING_SEL)
      || [...body.children].find((el) => el.querySelector('a[href]'))
      || body.firstElementChild;
    if (title) title.classList.add('cards-nav-card-title');
    [...body.children].forEach((el) => {
      if (el !== title) el.classList.add('cards-nav-card-text');
    });

    const link = (title && title.querySelector('a[href]')) || body.querySelector('a[href]');
    if (link) {
      link.classList.add('cards-nav-card-link');
      link.classList.remove('button', 'primary', 'secondary', 'accent');
      const wrapper = link.closest('.button-wrapper');
      if (wrapper) wrapper.classList.remove('button-wrapper');
      li.classList.add('cards-nav-card-linked');
    }
    li.append(body);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
