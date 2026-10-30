/**
 * Loads the footer fragment: /content/footer.plain.html (local preview),
 * then /footer.plain.html (DA/EDS).
 * @returns {Promise<{ container: HTMLElement, base: string }|null>} fragment sections + base URL
 */
async function fetchFooter() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let base = '/content/footer.plain.html';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    base = '/footer.plain.html';
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return { container, base: new URL(base, window.location.href).href };
}

/**
 * Resolves relative image paths in the fragment against the fragment location.
 * @param {Element} scope container
 * @param {string} base fragment URL
 */
function fixImagePaths(scope, base) {
  scope.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) img.src = new URL(src, base).href;
    img.loading = 'lazy';
  });
}

/**
 * Names a fragment section by what it contains so the layout does not depend on order.
 * @param {Element} section top-level fragment section
 * @returns {string} section role
 */
function sectionRole(section) {
  const hasImages = !!section.querySelector('img');
  const lists = section.querySelectorAll('ul');
  if (hasImages && lists.length && section.querySelector('li img')) return 'brand';
  if (hasImages) return 'badges';
  if (section.querySelector('h1, h2, h3')) return 'about';
  if (section.querySelector('h4, h5, h6') && lists.length) return 'links';
  return 'legal';
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;
  const { container, base } = fragment;
  fixImagePaths(container, base);

  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  const rows = {
    top: document.createElement('div'),
    main: document.createElement('div'),
    legal: document.createElement('div'),
    badges: document.createElement('div'),
  };
  Object.entries(rows).forEach(([name, row]) => { row.className = `footer-row footer-row-${name}`; });

  [...container.children].forEach((section) => {
    const role = sectionRole(section);
    section.className = `footer-section footer-${role}`;
    if (role === 'brand') {
      const social = section.querySelector('ul');
      if (social) {
        social.className = 'footer-social';
        social.querySelectorAll('a').forEach((a) => {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          const img = a.querySelector('img');
          if (img && img.alt) a.setAttribute('aria-label', img.alt);
        });
      }
      rows.top.append(section);
    } else if (role === 'badges') {
      rows.badges.append(section);
    } else if (role === 'legal') {
      rows.legal.append(section);
    } else {
      rows.main.append(section);
    }
  });

  // the about block CTA is the paragraph holding only a link
  const aboutCta = rows.main.querySelector('.footer-about p:last-child');
  if (aboutCta && aboutCta.querySelector('a') && aboutCta.textContent.trim() === aboutCta.querySelector('a').textContent.trim()) {
    aboutCta.classList.add('footer-about-cta');
  }

  Object.values(rows).forEach((row) => { if (row.children.length) footer.append(row); });
  block.append(footer);
}
