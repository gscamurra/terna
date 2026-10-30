/* eslint-disable */
/* global WebImporter */

/**
 * Terna sections transformer.
 * beforeTransform: insert <hr> section breaks (reverse order) while the
 *   section elements still exist; styled sections get a temporary marker.
 * afterTransform: add Section Metadata for styled sections, drop markers and
 *   the temporary first-section <hr>.
 */

const MARKER = 'data-excat-section-id';

function findSection(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSection(element, section);
      if (!el) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      if (i === 0) hr.setAttribute('data-excat-first-section', 'true');
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      const el = findSection(element, section);
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      if (el) {
        el.after(meta);
      } else if (marker) {
        marker.after(meta);
      }
    }

    element.querySelectorAll('hr[data-excat-first-section]').forEach((hr) => hr.remove());
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
  }
}
