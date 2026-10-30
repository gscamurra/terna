/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-hero.js
  var ORIGIN = "https://www.terna.it";
  function absUrl(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN}${url}`;
    if (/^(DesktopModules|Portals)\//i.test(url)) return `${ORIGIN}/${url}`;
    return url;
  }
  function cloneImage(document, img) {
    const out = document.createElement("img");
    out.src = absUrl(img.getAttribute("data-src") || img.getAttribute("src"));
    out.alt = img.getAttribute("alt") || "";
    return out;
  }
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function videoFromConfig(config, img) {
    if (!config || !img) return "";
    const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
    const id = (src.match(/[?&]image=(\d+)/) || [])[1];
    if (!id) return "";
    const start = config.indexOf(`image=${id}\\"`);
    if (start < 0) return "";
    const next = config.indexOf('{\\"title\\"', start);
    const segment = config.slice(start, next < 0 ? start + 3e3 : next);
    const m = segment.match(/\\"video\\":\\"([^"\\]+)\\"/);
    return m ? m[1] : "";
  }
  function parse(element, { document }) {
    const tickers = [...element.querySelectorAll(".teleborsa--wrapper")];
    let anchor = element;
    tickers.forEach((ticker) => {
      const prev = ticker.previousElementSibling;
      if (prev && prev.tagName === "HR") {
        anchor.after(prev);
        anchor = prev;
      }
      anchor.after(ticker);
      anchor = ticker;
    });
    const slides = [...element.querySelectorAll(".swiper-wrapper > .swiper-slide")].filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    const labels = [...element.querySelectorAll(".swiper-pagination .swiper-pagination-bullet")].map((b) => text(b.querySelector(".pagination-text") || b));
    const host = element.closest(".area") || element.parentElement || element;
    const configText = [...host.querySelectorAll("script")].map((s) => s.textContent).filter((s) => s.includes("vueDataLayer")).join("\n");
    const cells = [];
    slides.forEach((slide, i) => {
      const img = slide.querySelector("img.swiper-slide-image") || [...slide.querySelectorAll("img")].find((im) => !im.closest(".item-link, .swiper-slide-content"));
      const imageCell = img ? [cloneImage(document, img)] : [""];
      const content = [];
      const titleEl = slide.querySelector(".item-title");
      const title = text(titleEl);
      if (title) {
        const h = document.createElement(titleEl.tagName === "H1" ? "h1" : "h2");
        h.textContent = title;
        content.push(h);
      }
      const textEl = slide.querySelector(".item-text");
      if (textEl) {
        const paras = [...textEl.querySelectorAll("p")].filter((p) => text(p));
        if (paras.length) {
          paras.forEach((p) => {
            const np = document.createElement("p");
            np.textContent = text(p);
            content.push(np);
          });
        } else if (text(textEl)) {
          const np = document.createElement("p");
          np.textContent = text(textEl);
          content.push(np);
        }
      }
      const link2 = slide.querySelector(".item-link a[href], a.play-btn[href], a.overlay-link[href]");
      let href = link2 ? link2.getAttribute("href") : "";
      let label = link2 ? text(link2) || link2.getAttribute("title") : "";
      if (!href) {
        href = videoFromConfig(configText, img);
        if (href) label = "Play video";
      }
      if (href) {
        const a = document.createElement("a");
        a.href = absUrl(href);
        a.textContent = label || "Scopri di pi\xF9";
        const p = document.createElement("p");
        p.append(a);
        content.push(p);
      }
      cells.push([imageCell, content.length ? content : [""], labels[i] || title || ""]);
    });
    element.querySelectorAll(".swiper-pagination").forEach((p) => p.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget-ticker.js
  function text2(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse2(element, { document }) {
    const cells = [];
    const infoItems = [...element.querySelectorAll(".teleborsa--info-content > .teleborsa-content")];
    const title = infoItems[0] ? [...infoItems[0].querySelectorAll("span")].map(text2).filter(Boolean).join(" ") || text2(infoItems[0]) : "Terna - Indici Teleborsa";
    const time = infoItems[1] ? text2(infoItems[1]) : "";
    cells.push([title, time]);
    const firstLoop = element.querySelector(".teleborsa--data-wrapper .animation-content") || element;
    firstLoop.querySelectorAll(".teleborsa-content").forEach((item) => {
      const key = text2(item.querySelector(".teleborsa-key"));
      const val = text2(item.querySelector(".teleborsa-val"));
      if (key || val) cells.push([key, val]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "widget-ticker", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-tiles.js
  var ORIGIN2 = "https://www.terna.it";
  function absUrl2(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN2}${url}`;
    if (/^(DesktopModules|Portals)\//i.test(url)) return `${ORIGIN2}/${url}`;
    return url;
  }
  function text3(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function para(document, value) {
    const p = document.createElement("p");
    if (typeof value === "string") p.textContent = value;
    else p.append(value);
    return p;
  }
  function heading(document, value) {
    const h = document.createElement("h3");
    h.textContent = value;
    return h;
  }
  function link(document, href, label) {
    const a = document.createElement("a");
    a.href = absUrl2(href);
    a.textContent = label;
    return a;
  }
  function ctaFrom(document, scope) {
    const a = scope && scope.querySelector("a[href]");
    if (!a) return null;
    const label = text3(a) || a.getAttribute("title") || "Per saperne di pi\xF9";
    return para(document, link(document, a.getAttribute("href"), label));
  }
  function image(document, img) {
    const out = document.createElement("img");
    out.src = absUrl2(img.getAttribute("data-src") || img.getAttribute("src"));
    out.alt = img.getAttribute("alt") || "";
    return out;
  }
  function iframeTile(document, cmp) {
    const out = [];
    const eyebrow = text3(cmp.querySelector(".terna-iframe-section"));
    if (eyebrow) out.push(para(document, eyebrow));
    const iframe = cmp.querySelector("iframe[src], iframe[data-src]");
    let src = iframe ? iframe.getAttribute("src") || iframe.getAttribute("data-src") : "";
    if (!src || src === "about:blank") {
      const host = cmp.closest(".area--size-33") || cmp.closest(".area") || cmp;
      const m = host.innerHTML.match(/iframe_url\\*"\s*:\s*\\*"([^"\\]+)/);
      src = m ? m[1] : "";
    }
    if (src) {
      src = absUrl2(src);
      out.push(para(document, link(document, src, src)));
    }
    const cta = ctaFrom(document, cmp.querySelector(".terna-iframe-link"));
    if (cta) out.push(cta);
    return out;
  }
  function iconLabel(a) {
    const own = text3(a) || a.getAttribute("title") || a.getAttribute("aria-label");
    if (own) return own;
    const icon = a.querySelector('[class*="terna-icon-"]');
    const kind = icon ? (icon.className.match(/terna-icon-([a-z-]+)/) || [])[1] : "";
    const href = a.getAttribute("href") || "";
    if (kind === "download" || /\.pdf(\?|#|$)/i.test(href)) return "PDF";
    if (kind === "slideshare" || /slideshare\./i.test(href)) return "SlideShare";
    if (/euronext|engagestream|webcast/i.test(href)) return "Webcast";
    if (kind === "link-esterno") return "Link esterno";
    return "Dettaglio";
  }
  function listTile(document, cmp) {
    const out = [];
    const eyebrow = text3(cmp.querySelector(".terna-documentlistcover-section, .terna-documentlistcoverarchivio-section"));
    if (eyebrow) out.push(para(document, eyebrow));
    const ul = document.createElement("ul");
    cmp.querySelectorAll(".swiper-slide").forEach((item) => {
      const a = item.querySelector("a.item-title[href]");
      if (!a) return;
      const li = document.createElement("li");
      const label = a.getAttribute("title") || text3(a);
      li.append(para(document, link(document, a.getAttribute("href"), label)));
      const date = text3(item.querySelector(".item-date"));
      const iconLinks = [...item.querySelectorAll(".item-links a[href]")];
      if (date || iconLinks.length) {
        const p = document.createElement("p");
        if (date) p.append(date);
        iconLinks.forEach((icon) => {
          if (p.childNodes.length) p.append(" ");
          p.append(link(document, icon.getAttribute("href"), iconLabel(icon)));
        });
        li.append(p);
      }
      ul.append(li);
    });
    if (ul.children.length) out.push(ul);
    const cta = ctaFrom(document, cmp.querySelector(".terna-documentlistcover-link, .terna-documentlistcoverarchivio-link"));
    if (cta) out.push(cta);
    return out;
  }
  function slideTile(document, cmp) {
    const out = [];
    const slides = [...cmp.querySelectorAll(".swiper-slide")].filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    slides.forEach((slide) => {
      const img = [...slide.querySelectorAll("img")].find((im) => !im.closest(".terna-slidecontent-item-section, .terna-link"));
      const logo = slide.querySelector(".terna-slidecontent-item-section img, .item-logo-lightbox img");
      if (img || logo) {
        const p = document.createElement("p");
        if (img) p.append(image(document, img));
        if (logo) {
          const logoLink = logo.closest("a[href]");
          const logoImg = image(document, logo);
          if (logoLink) {
            const a = link(document, logoLink.getAttribute("href"), "");
            a.append(logoImg);
            p.append(a);
          } else {
            p.append(logoImg);
          }
        }
        out.push(p);
      }
      const eyebrow = text3(slide.querySelector(".terna-slidecontent-item-section"));
      if (eyebrow) out.push(para(document, eyebrow));
      const title = text3(slide.querySelector(".terna-slidecontent-item-title"));
      if (title) out.push(heading(document, title));
      const body = text3(slide.querySelector(".terna-slidecontent-item-text"));
      if (body) out.push(para(document, body));
      const cta = ctaFrom(document, slide.querySelector(".terna-slidecontent-item-link"));
      if (cta) out.push(cta);
    });
    return out;
  }
  function calendarTile(document, cmp) {
    const out = [];
    const slide = cmp.querySelector(".calendar-slide") || cmp;
    const eyebrow = text3(slide.querySelector(".calendar-slide__section"));
    if (eyebrow) out.push(para(document, eyebrow));
    const title = text3(slide.querySelector(".calendar-slide__title"));
    if (title) out.push(heading(document, title));
    const body = text3(slide.querySelector(".calendar-slide__text"));
    if (body) out.push(para(document, body));
    slide.querySelectorAll(".calendar-slide__date p").forEach((p) => {
      const v = text3(p);
      if (v) out.push(para(document, v));
    });
    const cta = ctaFrom(document, slide.querySelector(".calendar-slide__link-bottom"));
    if (cta) out.push(cta);
    return out;
  }
  function fallbackTile(document, area) {
    const out = [];
    area.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li").forEach((el) => {
      const v = text3(el);
      if (v) out.push(para(document, v));
    });
    return out;
  }
  function parseTile(document, area) {
    let cmp = area.querySelector(".terna-iframe, .cmp--terna-iframe");
    if (cmp) return iframeTile(document, cmp);
    cmp = area.querySelector(".terna-documentlistcover, .terna-documentlistcoverarchivio");
    if (cmp) return listTile(document, cmp);
    cmp = area.querySelector(".hp-calendar");
    if (cmp) return calendarTile(document, cmp);
    cmp = area.querySelector(".terna-slidecontent");
    if (cmp) return slideTile(document, cmp);
    return fallbackTile(document, area);
  }
  function parse3(element, { document }) {
    const areas = [element];
    let next = element.nextElementSibling;
    while (next && areas.length < 3) {
      if (next.matches(".area--size-33")) areas.push(next);
      else if (next.tagName !== "HR") break;
      next = next.nextElementSibling;
    }
    const row = areas.map((area) => {
      const content = parseTile(document, area);
      return content.length ? content : "";
    });
    while (row.length < 3) row.push("");
    areas.slice(1).forEach((area) => area.remove());
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-tiles", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-intro.js
  var ORIGIN3 = "https://www.terna.it";
  function absUrl3(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN3}${url}`;
    return url;
  }
  function text4(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse4(element, { document }) {
    const lead = [];
    const titleEl = element.querySelector(".boxevidence--title h1, .boxevidence--title h2, .boxevidence--title h3, .boxevidence--title");
    const title = text4(titleEl);
    if (title) {
      const h = document.createElement("h2");
      h.textContent = title;
      lead.push(h);
    }
    const a = element.querySelector(".boxevidence--link a[href]");
    if (a) {
      const link2 = document.createElement("a");
      link2.href = absUrl3(a.getAttribute("href"));
      link2.textContent = text4(a) || a.getAttribute("title") || "";
      const p = document.createElement("p");
      p.append(link2);
      lead.push(p);
    }
    const body = [];
    const textEl = element.querySelector(".boxevidence--text");
    if (textEl) {
      const paras = [...textEl.querySelectorAll("p")].filter((p) => text4(p));
      if (paras.length) paras.forEach((p) => body.push(p));
      else if (text4(textEl)) {
        const p = document.createElement("p");
        p.textContent = text4(textEl);
        body.push(p);
      }
    }
    const cells = [[lead.length ? lead : "", body.length ? body : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-intro", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  var ORIGIN4 = "https://www.terna.it";
  function absUrl4(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN4}${url}`;
    return url;
  }
  function text5(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function para2(document, value) {
    const p = document.createElement("p");
    if (typeof value === "string") p.textContent = value;
    else p.append(value);
    return p;
  }
  function parseCard(document, area) {
    const out = [];
    const slide = area.querySelector(".swiper-slide:not(.swiper-slide-duplicate) .swiper-slide-content") || area.querySelector(".terna-slidecontent") || area;
    const eyebrow = text5(slide.querySelector(".terna-slidecontent-item-section"));
    if (eyebrow) out.push(para2(document, eyebrow));
    const title = text5(slide.querySelector(".terna-slidecontent-item-title"));
    if (title) {
      const h = document.createElement("h3");
      h.textContent = title;
      out.push(h);
    }
    const desc = text5(slide.querySelector(".terna-slidecontent-item-text"));
    if (desc) out.push(para2(document, desc));
    const a = slide.querySelector(".terna-slidecontent-item-link a[href]");
    if (a) {
      const link2 = document.createElement("a");
      link2.href = absUrl4(a.getAttribute("href"));
      link2.textContent = text5(a) || a.getAttribute("title") || "";
      out.push(para2(document, link2));
    }
    return out;
  }
  function parse5(element, { document }) {
    const areas = [element];
    let next = element.nextElementSibling;
    while (next && areas.length < 3) {
      if (next.matches(".area--size-33")) areas.push(next);
      else if (next.tagName !== "HR") break;
      next = next.nextElementSibling;
    }
    const cells = [];
    areas.forEach((area) => {
      const content = parseCard(document, area);
      if (content.length) cells.push([content]);
    });
    areas.slice(1).forEach((area) => area.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-kpi.js
  var ORIGIN5 = "https://www.terna.it";
  function absUrl5(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN5}${url}`;
    return url;
  }
  function text6(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function slug(value) {
    return (value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function para3(document, value) {
    const p = document.createElement("p");
    p.textContent = value;
    return p;
  }
  function parse6(element, { document }) {
    const icons = [...element.querySelectorAll(".kpi-swiper__pagination > *")].map((btn) => {
      const holder = btn.querySelector("[aria-label]");
      const alt = holder && holder.getAttribute("aria-label") || "";
      const img = btn.querySelector("img[src]");
      if (img) return { src: absUrl5(img.getAttribute("src")), alt: img.getAttribute("alt") || alt };
      const svg = btn.querySelector("svg");
      if (svg) {
        if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`, alt };
      }
      return null;
    });
    let anchor = element;
    [...element.querySelectorAll("div.kpi-swiper--link")].forEach((linkWrap) => {
      anchor.after(linkWrap);
      anchor = linkWrap;
    });
    const slides = [...element.querySelectorAll(".swiper-wrapper > .swiper-slide")].filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    const cells = [];
    slides.forEach((slide, i) => {
      const content = [];
      const title = text6(slide.querySelector(".kpi-slide--title"));
      if (title) {
        const h = document.createElement("h3");
        h.textContent = title;
        content.push(h);
      }
      const subtitle = text6(slide.querySelector(".kpi-slide--subtitle"));
      if (subtitle) content.push(para3(document, subtitle));
      const ul = document.createElement("ul");
      slide.querySelectorAll(".kpi-slide--content").forEach((stat) => {
        const li = document.createElement("li");
        const value = text6(stat.querySelector("h1, h2, h3, h4, strong"));
        if (value) li.append(para3(document, value));
        const p = stat.querySelector("p");
        if (p) {
          const label = p.cloneNode(true);
          label.querySelectorAll("small, br").forEach((n) => n.remove());
          if (text6(label)) {
            const lp = document.createElement("p");
            lp.innerHTML = label.innerHTML.trim();
            li.append(lp);
          }
          p.querySelectorAll("small").forEach((s) => {
            const v = text6(s);
            if (!v) return;
            const sp = document.createElement("p");
            if (s.querySelector("em")) {
              const em = document.createElement("em");
              em.textContent = v;
              sp.append(em);
            } else {
              sp.textContent = v;
            }
            li.append(sp);
          });
        }
        if (li.children.length) ul.append(li);
      });
      if (ul.children.length) content.push(ul);
      const icon = icons[i];
      const iconSource = icon && icon.alt || title.replace(/^highlight\s+/i, "KPI ");
      const iconName = slug(iconSource.replace(/^icona\s+/i, ""));
      const iconCell = iconName ? [para3(document, `:${iconName}:`)] : "";
      cells.push([iconCell, content.length ? content : ""]);
    });
    element.querySelectorAll(".kpi-swiper__pagination").forEach((p) => p.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-kpi", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  var ORIGIN6 = "https://www.terna.it";
  function absUrl6(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN6}${url}`;
    if (/^(DesktopModules|Portals)\//i.test(url)) return `${ORIGIN6}/${url}`;
    return url;
  }
  function text7(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function para4(document, value) {
    const p = document.createElement("p");
    if (typeof value === "string") p.textContent = value;
    else p.append(value);
    return p;
  }
  function parse7(element, { document }) {
    const slide = element.querySelector(".swiper-slide:not(.swiper-slide-duplicate)") || element;
    const content = slide.querySelector(".swiper-slide-content") || slide;
    const cells = [];
    const srcImg = [...slide.querySelectorAll("img")].find((im) => !im.closest(".swiper-slide-content"));
    if (srcImg) {
      const img = document.createElement("img");
      img.src = absUrl6(srcImg.getAttribute("data-src") || srcImg.getAttribute("src"));
      img.alt = srcImg.getAttribute("alt") || "";
      cells.push([img]);
    } else {
      cells.push([""]);
    }
    const out = [];
    const eyebrow = text7(content.querySelector(".terna-slidecontent-item-section"));
    if (eyebrow) out.push(para4(document, eyebrow));
    const title = text7(content.querySelector(".terna-slidecontent-item-title"));
    if (title) {
      const h = document.createElement("h2");
      h.textContent = title;
      out.push(h);
    }
    const desc = text7(content.querySelector(".terna-slidecontent-item-text"));
    if (desc) out.push(para4(document, desc));
    const a = content.querySelector(".terna-slidecontent-item-link a[href]");
    if (a) {
      const link2 = document.createElement("a");
      link2.href = absUrl6(a.getAttribute("href"));
      link2.textContent = text7(a) || a.getAttribute("title") || "Per saperne di pi\xF9";
      out.push(para4(document, link2));
    }
    cells.push([out.length ? out : ""]);
    const variants = element.querySelector(".image-overlay") ? [] : ["no overlay"];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget-live-data.js
  function text8(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse8(element, { document }) {
    const cells = [];
    element.querySelectorAll(".boxdatiso__box").forEach((box) => {
      const title = text8(box.querySelector(".boxdatiso__box-title"));
      const zone = text8(box.querySelector(".boxdatiso__box-zone"));
      const value = text8(box.querySelector(".boxdatiso__box-total"));
      const delta = text8(box.querySelector(".boxdatiso__box--percentage"));
      const label = text8(box.querySelector(".boxdatiso__box-load_type"));
      const updateEl = box.querySelector(".boxdatiso__box-last_update");
      const update = updateEl ? [...updateEl.querySelectorAll("span")].map(text8).filter(Boolean).join(" ") || text8(updateEl) : "";
      if (title || value) cells.push([title, zone, value, delta, label, update]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "widget-live-data", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-nav.js
  var ORIGIN7 = "https://www.terna.it";
  function absUrl7(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN7}${url}`;
    return url;
  }
  function text9(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse9(element, { document }) {
    const cells = [];
    element.querySelectorAll(":scope > li.link-card, :scope > li").forEach((item, i, list) => {
      if ([...list].indexOf(item) !== i) return;
      const a = item.querySelector("a[href]");
      const title = text9(item.querySelector(".link-card__header")) || text9(a);
      const desc = text9(item.querySelector(".link-card__body"));
      const content = [];
      if (title) {
        const h = document.createElement("h3");
        if (a) {
          const link2 = document.createElement("a");
          link2.href = absUrl7(a.getAttribute("href"));
          link2.textContent = title;
          h.append(link2);
        } else {
          h.textContent = title;
        }
        content.push(h);
      }
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc;
        content.push(p);
      }
      if (content.length) cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/terna-cleanup.js
  var BEFORE_SELECTORS = [
    // Cookiebot consent banner / overlay and its helper iframes
    "#CybotCookiebotDialog",
    "#CybotCookiebotDialogBodyUnderlay",
    '[id^="CybotCookiebot"]',
    "iframe.CybotCookiebotHiddenIframe",
    "iframe.CybotCookiebotOffscreenIframe",
    'iframe[src*="cookiebot.com"]',
    // Global header / website menu (skip-nav + mobile menu live inside it)
    ".cmp--website-menu",
    "div.terna-header",
    "#terna-mobile-menu",
    ".skip-nav",
    // Global footer
    "div.mainFooter.cmp",
    ".cmp--website-footer",
    // "Vedi sul CMS" editor links
    "div.cms-panel",
    // Loaders / spinners
    "div.cmp--loader",
    // Swiper non-authorable chrome (bullets, a11y live regions, arrows)
    ".swiper-notification",
    ".slideshow-pagination",
    ".swiper-button-prev",
    ".swiper-button-next",
    ".swiper-scrollbar"
  ];
  var AFTER_SELECTORS = [
    "script",
    "style",
    "noscript",
    "link",
    'input[type="hidden"]',
    // Hero bullets carry the only copy of the slide tab labels (span.pagination-text)
    // and the KPI tab bar carries per-slide icons; both are left for the
    // carousel parsers and dropped here if they survived.
    ".swiper-pagination",
    ".kpi-swiper__pagination",
    // Tracking pixels / third-party frames (content iframe .terna-iframe-wrapper is kept)
    'img[width="1"][height="1"]',
    'img[src*="facebook.com/tr"]',
    'img[src*="doubleclick.net"]',
    'img[src*="px.ads.linkedin.com"]',
    'img[src*="bat.bing.com"]',
    'iframe[src*="googletagmanager.com"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="cookiebot.com"]',
    'iframe[title="Blank"]'
  ];
  var TRACKING_ATTRS = [
    "onclick",
    "onload",
    "onerror",
    "data-gtm",
    "data-ga",
    "data-track",
    "data-tracking",
    "data-analytics",
    "data-event",
    "data-v-app"
  ];
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, BEFORE_SELECTORS);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, AFTER_SELECTORS);
      element.querySelectorAll("*").forEach((el) => {
        TRACKING_ATTRS.forEach((attr) => {
          if (el.hasAttribute(attr)) el.removeAttribute(attr);
        });
        [...el.attributes].forEach(({ name }) => {
          if (/^data-v-/.test(name)) el.removeAttribute(name);
        });
      });
    }
  }

  // tools/importer/transformers/terna-sections.js
  var MARKER = "data-excat-section-id";
  function findSection(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSection(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (i === 0) hr.setAttribute("data-excat-first-section", "true");
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        const el = findSection(element, section);
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (el) {
          el.after(meta);
        } else if (marker) {
          marker.after(meta);
        }
      }
      element.querySelectorAll("hr[data-excat-first-section]").forEach((hr) => hr.remove());
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
        "name": "Promo tiles: Sostenibilit\xE0 / Innovazione / Sistema elettrico",
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
  var parsers = {
    "carousel-hero": parse,
    "widget-ticker": parse2,
    "columns-tiles": parse3,
    "columns-intro": parse4,
    "cards-promo": parse5,
    "carousel-kpi": parse6,
    "hero-banner": parse7,
    "widget-live-data": parse8,
    "cards-nav": parse9
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
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
  function labelIconLinks(document) {
    const ICON_LABELS = [
      [/euronext|engagestream|webcast/i, "Webcast"],
      [/slideshare\./i, "SlideShare"],
      [/\.pdf(\?|#|$)/i, "PDF"]
    ];
    document.querySelectorAll(".terna-sliderfullheight a.play-btn[href]").forEach((a) => {
      if (!a.textContent.trim()) a.textContent = a.getAttribute("title") || "Play video";
    });
    document.querySelectorAll(".item-links a[href]").forEach((a) => {
      if (a.textContent.trim() || a.querySelector("img")) return;
      const href = a.getAttribute("href");
      const icon = a.querySelector('[class*="terna-icon-"]');
      const kind = icon ? (icon.className.match(/terna-icon-([a-z-]+)/) || [])[1] : "";
      let label = (ICON_LABELS.find(([re]) => re.test(href)) || [])[1];
      if (!label) label = kind === "download" ? "PDF" : kind === "link-esterno" ? "Link esterno" : "Dettaglio";
      a.textContent = label;
    });
  }
  var import_home_default = {
    preprocess: ({ document }) => {
      labelIconLinks(document);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const isLocaleRoot = /^\/[a-z]{2}$/.test(rawPath);
      let docPath = rawPath;
      if (rawPath === "") docPath = "/index";
      else if (isLocaleRoot) docPath = `${rawPath}/index`;
      const path = WebImporter.FileUtils.sanitizePath(docPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
