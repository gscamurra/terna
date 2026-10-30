import { loadCSS, toCamelCase } from '../../scripts/aem.js';

const LABELS = {
  it: { ticker: 'Andamento titolo' },
  en: { ticker: 'Share price' },
};

function t(key) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  return (LABELS[lang] || LABELS.en)[key];
}

/**
 * Loads a live widget from `/widgets/<path>/<name>.html|css|js` into the block.
 * The link may already sit inside a nested auto-built widget wrapper (scripts.js auto-blocking).
 * @returns {Promise<boolean>} true when the widget loaded
 */
async function loadLiveWidget(block, link) {
  const { pathname, searchParams } = new URL(link.href, window.location.href);
  const segments = pathname.split('/').filter(Boolean);
  const start = segments.indexOf('widgets');
  const name = segments[segments.length - 1].split('.')[0];
  const folder = segments.slice(start + 1, -1).join('/');
  const base = `${window.hlx?.codeBasePath || ''}/widgets/${folder ? `${folder}/` : ''}${name}`;
  const authored = [...block.children];
  try {
    const resp = await fetch(`${base}.html`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    block.dataset.source = link.href;
    block.dataset.widgetName = name;
    searchParams.forEach((value, key) => {
      block.dataset[toCamelCase(key)] = value;
    });
    block.innerHTML = await resp.text();
    const css = loadCSS(`${base}.css`);
    const mod = await import(`${base}.js`);
    if (mod.default) await mod.default(block);
    await css;
    return true;
  } catch (error) {
    block.replaceChildren(...authored);
    // eslint-disable-next-line no-console
    console.error(`widget-ticker: failed to load widget ${folder}/${name}`, error);
    return false;
  }
}

function cellText(cell) {
  return cell ? cell.textContent.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Snapshot mode. Row 1: title | optional timestamp. Further rows: label | value.
 */
function renderSnapshot(block) {
  const rows = [...block.children].filter((row) => row.textContent.trim());
  const infoRow = rows.length > 1 ? rows.shift() : null;

  const info = document.createElement('div');
  info.className = 'widget-ticker-info';
  if (infoRow) {
    [...infoRow.children].filter((c) => cellText(c)).forEach((cell, i) => {
      const span = document.createElement('span');
      span.className = i === 0 ? 'widget-ticker-title' : 'widget-ticker-time';
      span.textContent = cellText(cell);
      info.append(span);
    });
  }

  const list = document.createElement('ul');
  list.className = 'widget-ticker-items';
  rows.forEach((row) => {
    const cells = [...row.children].filter((c) => cellText(c));
    if (!cells.length) return;
    const li = document.createElement('li');
    li.className = 'widget-ticker-item';
    const key = document.createElement('span');
    key.className = 'widget-ticker-key';
    key.textContent = cellText(cells[0]);
    li.append(key);
    if (cells.length > 1) {
      const val = document.createElement('span');
      val.className = 'widget-ticker-value';
      val.textContent = cells.slice(1).map(cellText).join(' ');
      if (/^[-−]/.test(val.textContent)) val.classList.add('widget-ticker-negative');
      else if (/^\+/.test(val.textContent)) val.classList.add('widget-ticker-positive');
      li.append(val);
    }
    list.append(li);
  });

  const track = document.createElement('div');
  track.className = 'widget-ticker-track';
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', cellText(info.firstElementChild) || t('ticker'));
  track.append(list);

  // two hidden copies (as on the source) keep the strip seamless when one list is narrower
  // than the track
  if (list.children.length > 1) {
    for (let i = 0; i < 2; i += 1) {
      const copy = list.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.classList.add('widget-ticker-items-copy');
      track.append(copy);
    }
    block.classList.add('widget-ticker-scrolling');
  }

  const children = [];
  if (info.children.length) children.push(info);
  if (list.children.length) children.push(track);
  block.replaceChildren(...children);
}

export default async function decorate(block) {
  const link = block.querySelector('a[href*="/widgets/"]');
  if (link && await loadLiveWidget(block, link)) {
    block.classList.add('widget-ticker-live');
    return;
  }
  if (link) {
    // drop the unusable widget reference, keep any authored snapshot rows
    const row = link.closest('.widget-ticker > div');
    if (row) row.remove();
  }
  renderSnapshot(block);
}
