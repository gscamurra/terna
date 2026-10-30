/* eslint-disable */
/* global WebImporter */

/**
 * Terna (www.terna.it) cleanup transformer.
 * Removes non-authorable site chrome captured in migration-work/cleaned.html.
 */

// Chrome that must be gone before parsers run (affects block matching).
const BEFORE_SELECTORS = [
  // Cookiebot consent banner / overlay and its helper iframes
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBodyUnderlay',
  '[id^="CybotCookiebot"]',
  'iframe.CybotCookiebotHiddenIframe',
  'iframe.CybotCookiebotOffscreenIframe',
  'iframe[src*="cookiebot.com"]',
  // Global header / website menu (skip-nav + mobile menu live inside it)
  '.cmp--website-menu',
  'div.terna-header',
  '#terna-mobile-menu',
  '.skip-nav',
  // Global footer
  'div.mainFooter.cmp',
  '.cmp--website-footer',
  // "Vedi sul CMS" editor links
  'div.cms-panel',
  // Loaders / spinners
  'div.cmp--loader',
  // Swiper non-authorable chrome (bullets, a11y live regions, arrows)
  '.swiper-notification',
  '.slideshow-pagination',
  '.swiper-button-prev',
  '.swiper-button-next',
  '.swiper-scrollbar',
];

// Final sweep after parsers ran.
const AFTER_SELECTORS = [
  'script',
  'style',
  'noscript',
  'link',
  'input[type="hidden"]',
  // Hero bullets carry the only copy of the slide tab labels (span.pagination-text)
  // and the KPI tab bar carries per-slide icons; both are left for the
  // carousel parsers and dropped here if they survived.
  '.swiper-pagination',
  '.kpi-swiper__pagination',
  // Tracking pixels / third-party frames (content iframe .terna-iframe-wrapper is kept)
  'img[width="1"][height="1"]',
  'img[src*="facebook.com/tr"]',
  'img[src*="doubleclick.net"]',
  'img[src*="px.ads.linkedin.com"]',
  'img[src*="bat.bing.com"]',
  'iframe[src*="googletagmanager.com"]',
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="cookiebot.com"]',
  'iframe[title="Blank"]',
];

const TRACKING_ATTRS = [
  'onclick',
  'onload',
  'onerror',
  'data-gtm',
  'data-ga',
  'data-track',
  'data-tracking',
  'data-analytics',
  'data-event',
  'data-v-app',
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, BEFORE_SELECTORS);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, AFTER_SELECTORS);

    element.querySelectorAll('*').forEach((el) => {
      TRACKING_ATTRS.forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
      [...el.attributes].forEach(({ name }) => {
        if (/^data-v-/.test(name)) el.removeAttribute(name);
      });
    });
  }
}
