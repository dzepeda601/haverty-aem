import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Carousel Category — a horizontal, swipeable strip of category tiles.
 * Each tile is an image plus a label that links to a category page. Multiple
 * tiles are visible at once; prev/next arrows scroll the strip.
 *
 * Expected authored structure (one row per tile):
 *   [ image cell ][ label/link cell ]
 *
 * A single-cell row (label only, or image only) is handled gracefully.
 * @param {Element} block The carousel-category block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const track = document.createElement('ul');
  track.className = 'carousel-category-track';

  rows.forEach((row) => {
    const cells = [...row.children];
    const li = document.createElement('li');
    li.className = 'carousel-category-tile';

    // Image cell → optimize.
    const img = row.querySelector('img');
    if (img) {
      const picture = img.closest('picture');
      const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '600' }]);
      const imageDiv = document.createElement('div');
      imageDiv.className = 'carousel-category-tile-image';
      imageDiv.append(optimized);
      li.append(imageDiv);
      if (picture) picture.remove();
    }

    // Remaining content (label + link).
    const label = document.createElement('div');
    label.className = 'carousel-category-tile-label';
    cells.forEach((cell) => {
      if (cell.querySelector('img')) return;
      while (cell.firstChild) label.append(cell.firstChild);
    });
    // EDS auto-decorates standalone links as `.button`; category labels are
    // plain text, so undo that styling.
    label.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    if (label.childNodes.length) li.append(label);

    // If the tile has a link, make the whole tile clickable via the first link.
    const link = li.querySelector('a[href]');
    if (link && img) {
      const anchor = document.createElement('a');
      anchor.href = link.getAttribute('href');
      anchor.className = 'carousel-category-tile-link';
      if (link.title) anchor.title = link.title;
      const imageDiv = li.querySelector('.carousel-category-tile-image');
      if (imageDiv) {
        anchor.append(imageDiv);
        li.prepend(anchor);
      }
    }

    track.append(li);
    row.remove();
  });

  // Navigation arrows, placed above the strip (top-right).
  const nav = document.createElement('div');
  nav.className = 'carousel-category-nav';
  nav.innerHTML = `
    <button type="button" class="carousel-category-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-category-next" aria-label="Next slide"></button>
  `;
  block.append(nav, track);

  const prev = nav.querySelector('.carousel-category-prev');
  const next = nav.querySelector('.carousel-category-next');

  // Reflect scroll position in the arrows' enabled/disabled state.
  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= maxScroll;
  };

  const scrollByAmount = () => Math.max(track.clientWidth * 0.8, 240);
  prev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    track.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
  });
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  // Recompute once images have loaded and given the track its full scroll width.
  track.querySelectorAll('img').forEach((image) => {
    if (image.complete) return;
    image.addEventListener('load', updateArrows, { once: true });
  });
  updateArrows();
  // Recompute after layout settles (scroll width depends on rendered tiles).
  requestAnimationFrame(updateArrows);
}
