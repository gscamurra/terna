/* eslint-disable */
/* global WebImporter */

import carouselHeroParser from './parsers/carousel-hero.js';
import widgetTickerParser from './parsers/widget-ticker.js';
import columnsTilesParser from './parsers/columns-tiles.js';
import columnsIntroParser from './parsers/columns-intro.js';
import cardsPromoParser from './parsers/cards-promo.js';
import carouselKpiParser from './parsers/carousel-kpi.js';
import heroBannerParser from './parsers/hero-banner.js';
import widgetLiveDataParser from './parsers/widget-live-data.js';
import cardsNavParser from './parsers/cards-nav.js';
import ternaCleanupTransformer from './transformers/terna-cleanup.js';
import ternaSectionsTransformer from './transformers/terna-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.terna.it/it"
  ],
  "representativeUrl": "https://www.terna.it/it",
  "description": "Terna homepage: hero carousel, share-price ticker, tile rows, promo cards, KPI slider, photo banners, live data and section navigation",
  "blocks": [
    {
      "name": "carousel-hero",
      "instances": [
        ".area--area-1 .terna-sliderfullheight"
      ]
    },
    {
      "name": "widget-ticker",
      "instances": [
        ".teleborsa--wrapper"
      ]
    },
    {
      "name": "columns-tiles",
      "instances": [
        ".area--area-3",
        ".area--area-23",
        ".area--area-26"
      ]
    },
    {
      "name": "columns-intro",
      "instances": [
        ".boxevidence__wrapper"
      ]
    },
    {
      "name": "cards-promo",
      "instances": [
        ".area--area-13"
      ]
    },
    {
      "name": "carousel-kpi",
      "instances": [
        ".kpi-swiper"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        ".area--area-32 .website-vue .terna-slidecontent"
      ]
    },
    {
      "name": "widget-live-data",
      "instances": [
        ".boxdatiso__box-wrapper"
      ]
    },
    {
      "name": "cards-nav",
      "instances": [
        "ul.link-card__deck"
      ]
    }
  ],
  "urlPattern": "/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Hero carousel",
      "selector": [
        ".area--area-1 .terna-sliderfullheight"
      ],
      "style": null,
      "blocks": [
        "carousel-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Teleborsa stock ticker",
      "selector": [
        ".teleborsa--wrapper"
      ],
      "style": null,
      "blocks": [
        "widget-ticker"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Tiles row: Fabbisogno energetico / Comunicati stampa / Lightbox",
      "selector": [
        ".area--area-3"
      ],
      "style": null,
      "blocks": [
        "columns-tiles"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Intro: Siamo dietro l'energia che usi ogni giorno",
      "selector": [
        ".area--area-9",
        ".boxevidence__wrapper"
      ],
      "style": "light-blue",
      "blocks": [
        "columns-intro"
      ],
      "defaultContent": []
    },
    {
      "id": "section-5",
      "name": "Promo tiles: Sostenibilità / Innovazione / Sistema elettrico",
      "selector": [
        ".area--area-13"
      ],
      "style": null,
      "blocks": [
        "cards-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Tiles row: Risultati 2025 / Info finanziarie / Calendario",
      "selector": [
        ".area--area-23"
      ],
      "style": null,
      "blocks": [
        "columns-tiles"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Tiles row: Programmazione territoriale / News operatori / Dietro i nostri progetti",
      "selector": [
        ".area--area-26"
      ],
      "style": null,
      "blocks": [
        "columns-tiles"
      ],
      "defaultContent": []
    },
    {
      "id": "section-8",
      "name": "KPI highlights carousel",
      "selector": [
        ".area--area-32 > .fullwidthtemplate:first-child",
        ".kpi-swiper"
      ],
      "style": "light-grey",
      "blocks": [
        "carousel-kpi"
      ],
      "defaultContent": [
        "div.kpi-swiper--link"
      ]
    },
    {
      "id": "section-9",
      "name": "Terna incontra (photo banner)",
      "selector": [
        ".area--area-32 .website-vue .content-item:nth-child(1)"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "section-10",
      "name": "Dati.Terna live data",
      "selector": [
        ".boxdatiso__wrapper"
      ],
      "style": null,
      "blocks": [
        "widget-live-data"
      ],
      "defaultContent": [
        ".boxdatiso__item-section",
        ".boxdatiso__item-title",
        ".boxdatiso__item-text",
        ".boxdatiso__item-link"
      ]
    },
    {
      "id": "section-11",
      "name": "Lavora con noi (photo banner)",
      "selector": [
        ".area--area-32 .website-vue .content-item:nth-child(3)"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "section-12",
      "name": "Navigazione pagine di sezione",
      "selector": [
        ".area--area-32 > .fullwidthtemplate:last-child",
        "section.t-component"
      ],
      "style": null,
      "blocks": [
        "cards-nav"
      ],
      "defaultContent": [
        "h2.visually-hidden"
      ]
    }
  ]
};

const parsers = {
  'carousel-hero': carouselHeroParser,
  'widget-ticker': widgetTickerParser,
  'columns-tiles': columnsTilesParser,
  'columns-intro': columnsIntroParser,
  'cards-promo': cardsPromoParser,
  'carousel-kpi': carouselKpiParser,
  'hero-banner': heroBannerParser,
  'widget-live-data': widgetLiveDataParser,
  'cards-nav': cardsNavParser,
};

const transformers = [ternaCleanupTransformer, ternaSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

/**
 * Icon-only links (no text) are deleted by the importer's empty-inline cleanup
 * before parsers run. Give the ones parsers need a text label on the raw DOM:
 * the hero "Play video" button and the Info Finanziarie document icon links.
 */
function labelIconLinks(document) {
  const ICON_LABELS = [
    [/euronext|engagestream|webcast/i, 'Webcast'],
    [/slideshare\./i, 'SlideShare'],
    [/\.pdf(\?|#|$)/i, 'PDF'],
  ];
  document.querySelectorAll('.terna-sliderfullheight a.play-btn[href]').forEach((a) => {
    if (!a.textContent.trim()) a.textContent = a.getAttribute('title') || 'Play video';
  });
  document.querySelectorAll('.item-links a[href]').forEach((a) => {
    if (a.textContent.trim() || a.querySelector('img')) return;
    const href = a.getAttribute('href');
    const icon = a.querySelector('[class*="terna-icon-"]');
    const kind = icon ? (icon.className.match(/terna-icon-([a-z-]+)/) || [])[1] : '';
    let label = (ICON_LABELS.find(([re]) => re.test(href)) || [])[1];
    if (!label) label = kind === 'download' ? 'PDF' : (kind === 'link-esterno' ? 'Link esterno' : 'Dettaglio');
    a.textContent = label;
  });
}

export default {
  preprocess: ({ document }) => {
    labelIconLinks(document);
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Locale roots (e.g. /it) are folder homepages: map them to /it/index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const isLocaleRoot = /^\/[a-z]{2}$/.test(rawPath);
    let docPath = rawPath;
    if (rawPath === '') docPath = '/index';
    else if (isLocaleRoot) docPath = `${rawPath}/index`;
    const path = WebImporter.FileUtils.sanitizePath(docPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
