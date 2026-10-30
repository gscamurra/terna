// desktop menu layout (three hover columns) starts at the same width the source switches
const isDesktop = window.matchMedia('(min-width: 1200px)');

const LABELS = {
  it: {
    open: 'Apri menu', close: 'Chiudi menu', search: 'Cerca', closeSearch: 'Chiudi ricerca', menu: 'Menu principale',
  },
  en: {
    open: 'Open menu', close: 'Close menu', search: 'Search', closeSearch: 'Close search', menu: 'Main menu',
  },
};

function t(key) {
  const lang = (document.documentElement.lang || 'it').slice(0, 2);
  return (LABELS[lang] || LABELS.it)[key];
}

/**
 * Loads the nav fragment: /content/nav.plain.html (local preview), then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container with the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return container;
}

/**
 * Resolves relative image paths in the fragment against the fragment location.
 * @param {Element} scope container
 * @param {string} base fragment base URL
 */
function fixImagePaths(scope, base) {
  scope.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.src = new URL(src, base).href;
    }
  });
}

function setMenuState(header, open) {
  const toggle = header.querySelector('.nav-hamburger');
  const menu = header.querySelector('.nav-menu');
  header.classList.toggle('is-menu-open', open);
  document.body.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? t('close') : t('open'));
  menu.setAttribute('aria-hidden', !open);
  if (!open) menu.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
}

function setSearchState(header, open) {
  const toggle = header.querySelector('.nav-search-toggle');
  const search = header.querySelector('.nav-search');
  header.classList.toggle('is-search-open', open);
  document.body.classList.toggle('nav-open', open || header.classList.contains('is-menu-open'));
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? t('closeSearch') : t('search'));
  search.setAttribute('aria-hidden', !open);
  if (open) search.querySelector('input').focus();
}

/**
 * Shows the children of a menu item in the next desktop column (hover drill-down).
 * @param {Element} li hovered/focused list item
 * @param {Element[]} columns the three menu columns
 * @param {number} level 1-based level of the item
 */
function activateItem(li, columns, level) {
  li.parentElement.querySelectorAll(':scope > li.is-active').forEach((s) => s.classList.remove('is-active'));
  li.classList.add('is-active');
  // clear deeper columns
  columns.slice(level).forEach((col) => col.replaceChildren());
  const sub = li.querySelector(':scope > ul');
  if (sub && columns[level]) {
    const clone = sub.cloneNode(true);
    clone.className = `nav-menu-list nav-menu-level-${level + 1}`;
    // desktop columns drill down on hover, the mobile chevrons / back rows are not needed
    clone.querySelectorAll('.nav-menu-expand, .nav-menu-back-item').forEach((b) => b.remove());
    clone.querySelectorAll('.is-open').forEach((o) => o.classList.remove('is-open'));
    columns[level].append(clone);
  }
}

function bindColumns(columns) {
  columns.forEach((col, index) => {
    const level = index + 1;
    const handler = (e) => {
      if (!isDesktop.matches) return;
      const li = e.target.closest('li');
      if (!li || !col.contains(li) || li.parentElement.parentElement !== col) return;
      activateItem(li, columns, level);
    };
    col.addEventListener('mouseover', handler);
    col.addEventListener('focusin', handler);
  });
}

/**
 * Mobile: the chevron of an item with children slides its sub-list in from the right
 * (each nested list sits one panel to the right of its parent; the root list moves left
 * one panel per open level). The back row slides back; item labels keep navigating.
 * @param {Element} menu menu overlay
 * @param {Element} list level-1 list
 * @returns {{ reset: Function }} controller
 */
function bindSlideIn(menu, list) {
  const setOpen = (li, open) => {
    li.classList.toggle('is-open', open);
    const expand = li.querySelector(':scope > .nav-menu-expand');
    if (expand && !isDesktop.matches) expand.setAttribute('aria-expanded', open);
  };
  const update = () => {
    const depth = list.querySelectorAll('li.is-open').length;
    list.style.transform = depth ? `translateX(-${depth * 100}%)` : '';
    menu.classList.toggle('is-subpanel', depth > 0);
    menu.scrollTop = 0;
  };
  const closeItem = (li) => {
    li.querySelectorAll('li.is-open').forEach((o) => setOpen(o, false));
    setOpen(li, false);
    update();
  };
  const openItem = (li) => {
    // open the item's whole path, close any other branch
    const path = [];
    for (let n = li; n && list.contains(n); n = n.parentElement.closest('li')) path.unshift(n);
    list.querySelectorAll('li.is-open').forEach((o) => { if (!path.includes(o)) setOpen(o, false); });
    path.forEach((n) => setOpen(n, true));
    update();
  };

  list.addEventListener('click', (e) => {
    if (isDesktop.matches) return;
    const expand = e.target.closest('.nav-menu-expand');
    if (expand) {
      e.preventDefault();
      const li = expand.closest('li');
      if (li.classList.contains('is-open')) {
        closeItem(li);
      } else {
        openItem(li);
        const back = li.querySelector(':scope > ul > .nav-menu-back-item > .nav-menu-back');
        if (back) back.focus({ preventScroll: true });
      }
      return;
    }
    const back = e.target.closest('.nav-menu-back');
    if (back) {
      e.preventDefault();
      const li = back.closest('ul').closest('li');
      closeItem(li);
      li.querySelector(':scope > .nav-menu-expand').focus({ preventScroll: true });
    }
  });

  return {
    reset() {
      list.querySelectorAll('li.is-open').forEach((o) => setOpen(o, false));
      update();
    },
  };
}

/**
 * Chevron buttons only exist on mobile layouts; desktop drills down on hover.
 * @param {Element} list level-1 list
 */
function syncExpandButtons(list) {
  list.querySelectorAll('.nav-menu-expand').forEach((b) => {
    b.hidden = isDesktop.matches;
    if (isDesktop.matches) b.removeAttribute('aria-expanded');
    else b.setAttribute('aria-expanded', 'false');
  });
}

function decorateMenuList(list) {
  list.classList.add('nav-menu-list', 'nav-menu-level-1');
  list.querySelectorAll('li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (!sub) return;
    li.classList.add('has-children');
    const link = li.querySelector(':scope > a');
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'nav-menu-expand';
    expand.setAttribute('aria-expanded', 'false');
    expand.setAttribute('aria-label', link ? link.textContent.trim() : '');
    li.insertBefore(expand, sub);
    // mobile sub-panel back row with the parent title
    const backItem = document.createElement('li');
    backItem.className = 'nav-menu-back-item';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'nav-menu-back';
    back.textContent = link ? link.textContent.trim() : '';
    backItem.append(back);
    sub.prepend(backItem);
  });
}

function buildSearch(toolsSection) {
  const searchLink = toolsSection.querySelector('a[href*="ricerca"], a[href*="search"]');
  const placeholder = [...toolsSection.querySelectorAll('p')].find((p) => !p.querySelector('a, img'));
  const icon = searchLink ? searchLink.querySelector('img') : null;

  const search = document.createElement('div');
  search.className = 'nav-search';
  search.id = 'nav-search';
  search.setAttribute('aria-hidden', 'true');
  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder ? placeholder.textContent.trim() : '';
  input.setAttribute('aria-label', input.placeholder || t('search'));
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', t('search'));
  if (icon) submit.append(icon.cloneNode(true));
  form.append(input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = input.value.trim();
    if (!term || !searchLink) return;
    window.location.href = `${searchLink.href}${encodeURIComponent(term)}`;
  });
  search.append(form);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-controls', 'nav-search');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', t('search'));
  if (icon) toggle.append(icon);
  return { search, toggle };
}

function buildLanguages(toolsSection) {
  const list = toolsSection.querySelector('ul');
  if (!list) return null;
  const languages = document.createElement('div');
  languages.className = 'nav-languages';
  list.querySelectorAll(':scope > li').forEach((li) => {
    if (!li.querySelector('a')) li.classList.add('is-current');
  });
  languages.append(list);
  return languages;
}

/**
 * Headroom behaviour: solid once scrolled, hidden while scrolling down, shown on scroll up.
 * @param {Element} wrapper nav wrapper
 */
function bindScroll(wrapper) {
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    wrapper.classList.toggle('is-scrolled', y > 0);
    const hide = y > lastY && y > wrapper.offsetHeight && !wrapper.matches('.is-menu-open, .is-search-open');
    wrapper.classList.toggle('is-hidden', hide);
    lastY = y;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  const base = new URL(window.location.pathname.startsWith('/content/') ? '/content/nav.plain.html' : '/nav.plain.html', window.location.href).href;
  fixImagePaths(fragment, base);

  const [brandSection, menuSection, utilitySection, toolsSection] = [...fragment.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', t('menu'));

  // left: hamburger + brand
  const left = document.createElement('div');
  left.className = 'nav-left';
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav-menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', t('open'));
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const link = brandSection.querySelector('a');
    const logos = [...brandSection.querySelectorAll('img')];
    const brandLink = document.createElement('a');
    brandLink.href = link ? link.getAttribute('href') : '/';
    brandLink.setAttribute('aria-label', logos[0] ? logos[0].alt : 'Home');
    logos.forEach((img, i) => {
      img.classList.add(i === 0 ? 'nav-logo-light' : 'nav-logo-dark');
      img.setAttribute('alt', i === 0 ? img.alt : '');
      brandLink.append(img);
    });
    brand.append(brandLink);
  }
  left.append(hamburger, brand);

  // right: search + languages
  const right = document.createElement('div');
  right.className = 'nav-tools';
  let search = null;
  if (toolsSection) {
    const built = buildSearch(toolsSection);
    search = built.search;
    right.append(built.toggle);
    const languages = buildLanguages(toolsSection);
    if (languages) right.append(languages);
  }
  nav.append(left, right);

  // menu overlay: three columns + utility footer
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  menu.id = 'nav-menu';
  menu.setAttribute('aria-hidden', 'true');
  const columnsWrap = document.createElement('div');
  columnsWrap.className = 'nav-menu-columns';
  const columns = [1, 2, 3].map((n) => {
    const col = document.createElement('div');
    col.className = `nav-menu-col nav-menu-col-${n}`;
    columnsWrap.append(col);
    return col;
  });
  const mainList = menuSection ? menuSection.querySelector('ul') : null;
  let slider = { reset() {} };
  if (mainList) {
    decorateMenuList(mainList);
    columns[0].append(mainList);
    bindColumns(columns);
    slider = bindSlideIn(menu, mainList);
    syncExpandButtons(mainList);
  }
  menu.append(columnsWrap);
  const utilityList = utilitySection ? utilitySection.querySelector('ul') : null;
  if (utilityList) {
    const footer = document.createElement('div');
    footer.className = 'nav-menu-footer';
    footer.append(utilityList);
    menu.append(footer);
  }
  // mobile: the language switch moves into a bar at the bottom of the open menu
  const barLanguages = right.querySelector('.nav-languages ul');
  if (barLanguages) {
    const menuLanguages = document.createElement('div');
    menuLanguages.className = 'nav-menu-languages';
    menuLanguages.append(barLanguages.cloneNode(true));
    menu.append(menuLanguages);
  }
  const closeMenu = () => {
    setMenuState(wrapper, false);
    slider.reset();
  };

  wrapper.append(nav, menu);
  if (search) wrapper.append(search);
  block.append(wrapper);

  // pages without a full-bleed hero get the solid header so white text never sits on white
  const hero = document.querySelector('main > .section:first-child .carousel-hero, main > .section:first-child .hero-banner');
  if (!hero) wrapper.classList.add('is-solid');

  hamburger.addEventListener('click', () => {
    if (wrapper.classList.contains('is-search-open')) setSearchState(wrapper, false);
    if (wrapper.classList.contains('is-menu-open')) closeMenu();
    else setMenuState(wrapper, true);
  });
  const searchToggle = right.querySelector('.nav-search-toggle');
  if (searchToggle && search) {
    searchToggle.addEventListener('click', () => {
      if (wrapper.classList.contains('is-menu-open')) closeMenu();
      setSearchState(wrapper, !wrapper.classList.contains('is-search-open'));
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (wrapper.classList.contains('is-menu-open')) {
      closeMenu();
      hamburger.focus();
    }
    if (search && wrapper.classList.contains('is-search-open')) {
      setSearchState(wrapper, false);
      searchToggle.focus();
    }
  });

  // crossing the breakpoint closes the menu and resets columns / slide-in panels
  isDesktop.addEventListener('change', () => {
    if (wrapper.classList.contains('is-menu-open')) closeMenu();
    else slider.reset();
    columns.slice(1).forEach((col) => col.replaceChildren());
    menu.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
    if (mainList) syncExpandButtons(mainList);
  });

  bindScroll(wrapper);
}
