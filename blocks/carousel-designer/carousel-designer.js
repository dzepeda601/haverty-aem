import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Carousel Designer — a rotating, one-slide-at-a-time editorial carousel.
 * Each slide is laid out in three columns (matching the source "Designer Pick"):
 *   [ text: eyebrow heading + description + shop link ]
 *   [ room-scene image ]
 *   [ product callout: thumbnail + product name + sale/original price ]
 *
 * Authored structure (one row per slide):
 *   [ room-scene image cell ][ content cell: eyebrow heading, description,
 *     shop link, product image, product name link, prices ]
 *
 * @param {Element} block The carousel-designer block element
 */
function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-designer-slide');
  const count = slides.length;
  const target = ((index % count) + count) % count;

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== target);
    slide.querySelectorAll('a').forEach((link) => {
      if (i !== target) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
    });
  });

  block.dataset.activeSlide = target;

  const dots = block.querySelectorAll('.carousel-designer-dot');
  dots.forEach((dot, i) => {
    dot.setAttribute('aria-current', i === target ? 'true' : 'false');
  });
}

/**
 * Split a concatenated price string (e.g. "$3,529.99$3,999.99") into a
 * rust sale price and a struck-through original price.
 * @param {Element} priceP paragraph containing the price text
 */
function splitPrice(priceP) {
  const matches = priceP.textContent.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  if (!matches.length) return;
  priceP.textContent = '';
  priceP.classList.add('carousel-designer-price');

  const sale = document.createElement('span');
  sale.className = 'carousel-designer-price-sale';
  sale.textContent = matches[0];
  priceP.append(sale);

  if (matches[1]) {
    const original = document.createElement('span');
    original.className = 'carousel-designer-price-original';
    original.textContent = matches[1];
    priceP.append(original);
  }
}

export default function decorate(block) {
  const rows = [...block.children];

  const track = document.createElement('div');
  track.className = 'carousel-designer-track';

  rows.forEach((row, idx) => {
    const cells = [...row.children];
    const roomCell = cells[0];
    const contentCell = cells[1] || document.createElement('div');

    const slide = document.createElement('div');
    slide.className = 'carousel-designer-slide';
    slide.dataset.slideIndex = idx;

    // Split the content cell at the product image: everything before it is the
    // text column; the product image and everything after it is the product column.
    const contentKids = [...contentCell.children];
    const boundary = contentKids.find(
      (el) => el.tagName === 'PICTURE' || el.tagName === 'IMG' || el.querySelector('img'),
    );

    const text = document.createElement('div');
    text.className = 'carousel-designer-text';
    const product = document.createElement('div');
    product.className = 'carousel-designer-product';

    let inProduct = false;
    contentKids.forEach((el) => {
      if (el === boundary) inProduct = true;
      (inProduct ? product : text).append(el);
    });

    // Room-scene image column.
    const imageCol = document.createElement('div');
    imageCol.className = 'carousel-designer-image';
    [...roomCell.childNodes].forEach((n) => imageCol.append(n));

    // Eyebrow heading ("Designer Pick").
    const eyebrow = text.querySelector('h2');
    if (eyebrow) eyebrow.classList.add('carousel-designer-eyebrow');

    // Normalize the shop link: EDS auto-decorates a standalone link into a
    // pill button, but the source renders it as a plain green text link.
    text.querySelectorAll('a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      a.classList.add('carousel-designer-shop');
    });
    text.querySelectorAll('.button-container').forEach((p) => {
      p.classList.remove('button-container');
      p.classList.add('carousel-designer-shop-container');
    });

    // Product name heading.
    const productName = product.querySelector('h2');
    if (productName) productName.classList.add('carousel-designer-product-name');

    // Split the sale/original price into distinct segments.
    const priceP = [...product.querySelectorAll('p')].find((p) => p.textContent.includes('$'));
    if (priceP) splitPrice(priceP);

    slide.append(text, imageCol, product);

    // Optimize images (room scene + product thumbnail).
    slide.querySelectorAll('img').forEach((img) => {
      const picture = img.closest('picture');
      const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      if (picture) picture.replaceWith(optimized);
      else img.replaceWith(optimized);
    });

    track.append(slide);
    row.remove();
  });

  block.append(track);

  const slides = track.querySelectorAll('.carousel-designer-slide');
  if (slides.length < 2) {
    showSlide(block, 0);
    return;
  }

  // Prev/next arrows.
  const nav = document.createElement('div');
  nav.className = 'carousel-designer-nav';
  nav.innerHTML = `
    <button type="button" class="carousel-designer-prev" aria-label="Show previous"></button>
    <button type="button" class="carousel-designer-next" aria-label="Show next"></button>
  `;
  block.append(nav);

  // Product-name tab indicators.
  const dots = document.createElement('div');
  dots.className = 'carousel-designer-dots';
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-designer-dot';
    const name = slide.querySelector('.carousel-designer-product-name');
    dot.textContent = name ? name.textContent.trim() : `Slide ${i + 1}`;
    dot.addEventListener('click', () => showSlide(block, i));
    dots.append(dot);
  });
  block.append(dots);

  nav.querySelector('.carousel-designer-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  nav.querySelector('.carousel-designer-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  showSlide(block, 0);
}
