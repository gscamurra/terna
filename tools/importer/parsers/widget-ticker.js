/* eslint-disable */
/* global WebImporter */

/**
 * Parser for widget-ticker (Teleborsa share-price strip).
 * Source: .teleborsa--wrapper
 * Snapshot table: row 1 = title | timestamp; further rows = label | value.
 * The marquee repeats the figures several times; only the first copy is kept.
 */

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];

  const infoItems = [...element.querySelectorAll('.teleborsa--info-content > .teleborsa-content')];
  const title = infoItems[0]
    ? [...infoItems[0].querySelectorAll('span')].map(text).filter(Boolean).join(' ') || text(infoItems[0])
    : 'Terna - Indici Teleborsa';
  const time = infoItems[1] ? text(infoItems[1]) : '';
  cells.push([title, time]);

  const firstLoop = element.querySelector('.teleborsa--data-wrapper .animation-content') || element;
  firstLoop.querySelectorAll('.teleborsa-content').forEach((item) => {
    const key = text(item.querySelector('.teleborsa-key'));
    const val = text(item.querySelector('.teleborsa-val'));
    if (key || val) cells.push([key, val]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-ticker', cells });
  element.replaceWith(block);
}
