import { createOptimizedPicture } from '../../scripts/aem.js';

const AUTOPLAY_MS = 5000;
const VIDEO_RE = /(youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|#|$))/i;
const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

const LABELS = {
  it: {
    carousel: 'Carosello',
    tabs: 'Selezione diapositiva',
    slide: 'Diapositiva',
    play: 'Avvia rotazione',
    stop: 'Ferma rotazione',
    playVideo: 'Riproduci video',
    close: 'Chiudi',
  },
  en: {
    carousel: 'Carousel',
    tabs: 'Slide selection',
    slide: 'Slide',
    play: 'Start rotation',
    stop: 'Stop rotation',
    playVideo: 'Play video',
    close: 'Close',
  },
};

function t(key) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  return (LABELS[lang] || LABELS.en)[key];
}

function optimizePictures(scope, eager) {
  scope.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
      if (eager) img.loading = 'eager';
      return;
    }
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, eager, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]),
    );
  });
}

/** True for a cell that only holds images (no text). */
function isImageOnly(cell) {
  return !!cell.querySelector('picture, img') && !cell.textContent.trim();
}

/** Splits an authored row into image, content and optional tab-label cells. */
function parseRow(row) {
  const cells = [...row.children];
  const image = cells.find(isImageOnly);
  const rest = cells.filter((c) => c !== image);
  const content = rest.find((c) => c.querySelector(HEADING_SEL))
    || rest.find((c) => c.textContent.trim());
  const labelCell = rest.find((c) => c !== content && c.textContent.trim());
  return { image, content, labelCell };
}

function buildVideoPlayer(href) {
  const url = new URL(href, window.location.href);
  if (/\.mp4$/i.test(url.pathname)) {
    const video = document.createElement('video');
    video.src = url.href;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    return video;
  }
  let src = url.href;
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    src = `https://www.youtube.com/embed/${url.pathname.slice(1)}?autoplay=1`;
  } else if (host.endsWith('youtube.com') && url.searchParams.get('v')) {
    src = `https://www.youtube.com/embed/${url.searchParams.get('v')}?autoplay=1`;
  } else if (host === 'vimeo.com') {
    src = `https://player.vimeo.com/video/${url.pathname.split('/').filter(Boolean).pop()}?autoplay=1`;
  }
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = t('playVideo');
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  return iframe;
}

function openVideo(block, href, onClose) {
  const dialog = document.createElement('dialog');
  dialog.className = 'carousel-hero-video-dialog';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'carousel-hero-video-close';
  close.setAttribute('aria-label', t('close'));
  close.addEventListener('click', () => dialog.close());
  const frame = document.createElement('div');
  frame.className = 'carousel-hero-video-frame';
  frame.append(buildVideoPlayer(href));
  dialog.append(close, frame);
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (onClose) onClose();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  block.append(dialog);
  dialog.showModal();
}

let carouselId = 0;

export default function decorate(block) {
  carouselId += 1;
  const id = `carousel-hero-${carouselId}`;
  block.id = block.id || id;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', t('carousel'));

  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-hero-slides';
  const tabs = document.createElement('div');
  tabs.className = 'carousel-hero-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', t('tabs'));

  const slides = [];
  [...block.children].forEach((row) => {
    const { image, content, labelCell } = parseRow(row);
    if (!image && !content) return;
    const index = slides.length;

    const slide = document.createElement('li');
    slide.className = 'carousel-hero-slide';
    slide.id = `${id}-slide-${index}`;
    slide.setAttribute('role', 'tabpanel');

    const imageWrap = document.createElement('div');
    imageWrap.className = 'carousel-hero-slide-image';
    if (image) imageWrap.append(...image.childNodes);
    // a picture authored inside the content cell becomes the background too
    if (!imageWrap.querySelector('picture, img') && content) {
      const pic = content.querySelector('picture') || content.querySelector('img');
      if (pic) {
        const parent = pic.parentElement;
        imageWrap.append(pic);
        const emptyWrapper = !parent.textContent.trim() && !parent.children.length;
        if (parent !== content && emptyWrapper) parent.remove();
      }
    }
    if (imageWrap.querySelector('picture, img')) {
      optimizePictures(imageWrap, index === 0);
      slide.append(imageWrap);
    } else {
      slide.classList.add('carousel-hero-slide-no-image');
    }

    if (content) {
      content.className = 'carousel-hero-slide-content';
      // a paragraph holding a single link is the slide CTA: an arrow, or a play button for videos
      content.querySelectorAll('p').forEach((p) => {
        const links = p.querySelectorAll('a[href]');
        if (links.length === 1 && p.textContent.trim() === links[0].textContent.trim()) {
          p.classList.add('carousel-hero-slide-cta');
          if (VIDEO_RE.test(links[0].href)) p.classList.add('carousel-hero-slide-cta-video');
        }
      });
      content.querySelectorAll('a[href]').forEach((a) => {
        if (!VIDEO_RE.test(a.href)) return;
        a.classList.add('carousel-hero-video-link');
        a.setAttribute('role', 'button');
        a.setAttribute('aria-haspopup', 'dialog');
      });
      slide.append(content);
    }

    const heading = content && content.querySelector(HEADING_SEL);
    if (heading) {
      heading.id = heading.id || `${id}-heading-${index}`;
      slide.setAttribute('aria-labelledby', heading.id);
    }
    const label = (labelCell && labelCell.textContent.trim())
      || (heading && heading.textContent.trim())
      || `${t('slide')} ${index + 1}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'carousel-hero-tab';
    tab.id = `${id}-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', slide.id);
    const tabText = document.createElement('span');
    tabText.className = 'carousel-hero-tab-text';
    tabText.textContent = label;
    tab.append(tabText);
    if (!heading) slide.setAttribute('aria-labelledby', tab.id);

    slides.push({ slide, tab });
    slidesList.append(slide);
    tabs.append(tab);
  });

  block.replaceChildren(slidesList);
  if (!slides.length) return;

  let active = 0;
  let timer = null;
  let playing = slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = (index, focus = false) => {
    active = (index + slides.length) % slides.length;
    block.dataset.activeSlide = active;
    slidesList.style.setProperty('--carousel-hero-active', active);
    slides.forEach(({ slide, tab }, i) => {
      const isActive = i === active;
      slide.classList.toggle('carousel-hero-slide-active', isActive);
      slide.setAttribute('aria-hidden', !isActive);
      slide.querySelectorAll('a, button').forEach((el) => {
        if (isActive) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
      tab.setAttribute('aria-selected', isActive);
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) tab.focus();
    });
  };

  block.style.setProperty('--carousel-hero-autoplay', `${AUTOPLAY_MS}ms`);
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
    block.classList.remove('carousel-hero-running');
  };
  const startTimer = () => {
    stopTimer();
    if (!playing) return;
    // force a reflow so the active tab's progress animation restarts
    block.getBoundingClientRect();
    block.classList.add('carousel-hero-running');
    timer = setInterval(() => show(active + 1), AUTOPLAY_MS);
  };

  block.addEventListener('click', (e) => {
    const link = e.target.closest('a.carousel-hero-video-link');
    if (!link) return;
    e.preventDefault();
    stopTimer();
    openVideo(block, link.href, startTimer);
  });
  // video links act as buttons, so Space opens them too
  block.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || !e.target.closest('a.carousel-hero-video-link')) return;
    e.preventDefault();
    e.target.closest('a.carousel-hero-video-link').click();
  });

  show(0);
  if (slides.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'carousel-hero-controls';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'carousel-hero-toggle';
  const syncToggle = () => {
    toggle.setAttribute('aria-label', playing ? t('stop') : t('play'));
    toggle.setAttribute('aria-pressed', playing);
    toggle.classList.toggle('carousel-hero-toggle-playing', playing);
  };
  toggle.addEventListener('click', () => {
    playing = !playing;
    syncToggle();
    startTimer();
  });
  syncToggle();
  controls.append(tabs, toggle);
  block.append(controls);

  slides.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => {
      show(i);
      startTimer();
    });
  });
  tabs.addEventListener('keydown', (e) => {
    const moves = {
      ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: slides.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    show(moves[e.key], true);
    startTimer();
  });

  // pause while the user is interacting with the slide content
  block.addEventListener('focusin', stopTimer);
  block.addEventListener('focusout', (e) => {
    if (!block.contains(e.relatedTarget)) startTimer();
  });

  startTimer();
}
