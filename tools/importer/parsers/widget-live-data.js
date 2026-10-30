/* eslint-disable */
/* global WebImporter */

/**
 * Parser for widget-live-data (Dati.Terna live figures, snapshot mode).
 * Source: .boxdatiso__box-wrapper (section intro texts stay as default content)
 * Block: one row per box -> title | zone | value | delta | label | last update.
 * Boxes without a delta get an empty delta cell so every row has six cells.
 */

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('.boxdatiso__box').forEach((box) => {
    const title = text(box.querySelector('.boxdatiso__box-title'));
    const zone = text(box.querySelector('.boxdatiso__box-zone'));
    const value = text(box.querySelector('.boxdatiso__box-total'));
    const delta = text(box.querySelector('.boxdatiso__box--percentage'));
    const label = text(box.querySelector('.boxdatiso__box-load_type'));
    const updateEl = box.querySelector('.boxdatiso__box-last_update');
    const update = updateEl
      ? [...updateEl.querySelectorAll('span')].map(text).filter(Boolean).join(' ') || text(updateEl)
      : '';
    if (title || value) cells.push([title, zone, value, delta, label, update]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-live-data', cells });
  element.replaceWith(block);
}
