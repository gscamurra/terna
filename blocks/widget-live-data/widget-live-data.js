import { loadCSS, toCamelCase } from '../../scripts/aem.js';

const DELTA_RE = /^[+\-−±]?\s*\d+(?:[.,]\d+)?\s*%$/;
const UPDATED_RE = /(aggiornament|updated|\d{1,2}\/\d{1,2}\/\d{2,4})/i;
const VALUE_RE = /^[+\-−]?\s*\d/;

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
    console.error(`widget-live-data: failed to load widget ${folder}/${name}`, error);
    return false;
  }
}

/** Flattens a row into text items: one per cell, or one per child element of a single cell. */
function rowItems(row) {
  const cells = [...row.children].filter((c) => c.textContent.trim());
  const sources = cells.length === 1 && cells[0].children.length > 1
    ? [...cells[0].children]
    : cells.flatMap((c) => (c.querySelector('p') ? [...c.children] : [c]));
  return sources
    .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function span(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

/**
 * One row per box: title | zone | value | delta | label | last update.
 * Delta, value and last-update are recognised by content, so authors may omit any of them.
 */
function buildBox(items) {
  const [title, ...rest] = items;
  const li = document.createElement('li');
  li.className = 'widget-live-data-box';
  li.append(span('widget-live-data-title', title));

  const deltaIndex = rest.findIndex((s) => DELTA_RE.test(s));
  const delta = deltaIndex >= 0 ? rest.splice(deltaIndex, 1)[0] : null;
  const updatedIndex = rest.findIndex((s) => UPDATED_RE.test(s));
  const updated = updatedIndex >= 0 ? rest.splice(updatedIndex, 1)[0] : null;
  const valueIndex = rest.findIndex((s) => VALUE_RE.test(s));
  const value = valueIndex >= 0 ? rest.splice(valueIndex, 1)[0] : null;
  // anything before the value is the zone, anything after it is the label
  const zone = valueIndex > 0 ? rest.splice(0, valueIndex).join(' ') : null;

  if (zone) li.append(span('widget-live-data-zone', zone));
  if (value || delta) {
    const figure = document.createElement('div');
    figure.className = 'widget-live-data-figure';
    if (value) figure.append(span('widget-live-data-value', value));
    if (delta) {
      const d = span('widget-live-data-delta', delta);
      if (/^[-−]/.test(delta)) d.classList.add('widget-live-data-delta-down');
      else if (/^\+/.test(delta)) d.classList.add('widget-live-data-delta-up');
      figure.append(d);
    }
    li.append(figure);
  }
  if (rest.length) li.append(span('widget-live-data-label', rest.join(' ')));
  if (updated) {
    const u = span('widget-live-data-updated', updated);
    // source shows the timestamp in bold after the "Ultimo aggiornamento" label
    const m = updated.match(/^(.*?\S)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}.*)$/);
    if (m) {
      const [, label, stamp] = m;
      const strong = document.createElement('strong');
      strong.textContent = stamp;
      u.replaceChildren(`${label} `, strong);
    }
    li.append(u);
  }
  return li;
}

function renderSnapshot(block) {
  const list = document.createElement('ul');
  list.className = 'widget-live-data-boxes';
  [...block.children].forEach((row) => {
    const items = rowItems(row);
    if (items.length) list.append(buildBox(items));
  });
  block.replaceChildren(list);
}

export default async function decorate(block) {
  const link = block.querySelector('a[href*="/widgets/"]');
  if (link && await loadLiveWidget(block, link)) {
    block.classList.add('widget-live-data-live');
    return;
  }
  if (link) {
    // drop the unusable widget reference, keep any authored snapshot rows
    const row = link.closest('.widget-live-data > div');
    if (row) row.remove();
  }
  renderSnapshot(block);
}
