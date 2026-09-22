import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Carousel Product — a titled, horizontally-scrollable strip of product cards.
 * Each card has a product image (optionally a second "hover" image), a product
 * name link, an original (struck-through) price + special price, and a short
 * description.
 *
 * Expected authored structure:
 *   Row 1 (optional): a single cell holding the row title (e.g. a heading/label).
 *   Each subsequent row = one product card. Within the card cell, in order:
 *     - product image (first <picture>/<img>); an optional second image = hover
 *     - a name link (<a>)
 *     - price text (may contain "$orig $special" — split into struck + special)
 *     - a short description paragraph
 *
 * @param {Element} block The carousel-product block element
 */
function splitPrices(priceEl) {
  const matches = priceEl.textContent.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  if (matches.length < 1) return;
  priceEl.textContent = '';
  priceEl.classList.add('carousel-product-prices');
  // When two prices exist, the first (higher) is the struck original.
  if (matches.length >= 2) {
    const orig = document.createElement('span');
    orig.className = 'carousel-product-price-original';
    orig.textContent = matches[0];
    const special = document.createElement('span');
    special.className = 'carousel-product-price-special';
    special.textContent = matches[1];
    priceEl.append(special, orig);
  } else {
    const special = document.createElement('span');
    special.className = 'carousel-product-price-special';
    special.textContent = matches[0];
    priceEl.append(special);
  }
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row with no image is the title row.
  let titleRow = null;
  if (rows.length && !rows[0].querySelector('img, picture')) {
    titleRow = rows.shift();
    titleRow.classList.add('carousel-product-title');
  }

  const track = document.createElement('ul');
  track.className = 'carousel-product-track';

  rows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'carousel-product-card';
    // Flatten the row's cells (image cell + content cell) into the card,
    // unwrapping the cell <div>s so images and text sit as direct children.
    [...row.children].forEach((cell) => {
      if (cell.tagName === 'DIV') {
        while (cell.firstChild) li.append(cell.firstChild);
      } else {
        li.append(cell);
      }
    });

    // Images: first is the product image, an optional second is the hover image.
    const pictures = [...li.querySelectorAll('picture')];
    const imgs = [...li.querySelectorAll('img')];
    if (imgs.length) {
      const imageWrap = document.createElement('div');
      imageWrap.className = 'carousel-product-image';
      imgs.forEach((img, i) => {
        const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '500' }]);
        if (i === 1) optimized.classList.add('carousel-product-hover-image');
        imageWrap.append(optimized);
      });
      pictures.forEach((p) => p.remove());
      li.prepend(imageWrap);
    }

    // Name link.
    const nameLink = li.querySelector('a[href]');
    if (nameLink) nameLink.classList.add('carousel-product-name');

    // Price: find a text node/element containing a $ amount.
    const priceEl = [...li.querySelectorAll('p, div, span')]
      .find((el) => /\$\d/.test(el.textContent) && !el.querySelector('a'));
    if (priceEl) splitPrices(priceEl);

    track.append(li);
    row.remove();
  });

  block.replaceChildren();
  if (titleRow) block.append(titleRow);

  // Prev/next arrows.
  const nav = document.createElement('div');
  nav.className = 'carousel-product-nav';
  nav.innerHTML = `
    <button type="button" class="carousel-product-prev" aria-label="Show previous"></button>
    <button type="button" class="carousel-product-next" aria-label="Show next"></button>
  `;
  block.append(nav, track);

  const prev = nav.querySelector('.carousel-product-prev');
  const next = nav.querySelector('.carousel-product-next');
  const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };
  const step = () => Math.max(track.clientWidth * 0.8, 260);
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  track.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', updateArrows, { once: true });
  });
  updateArrows();
  requestAnimationFrame(updateArrows);
}
