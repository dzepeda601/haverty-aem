import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Teaser Editorial — an editorial lookbook promo: two side-by-side room images
 * with a centered "frosted glass" title/description card floating over them.
 * The whole unit is a single link to an external lookbook; the link text is the
 * accessible label only (not visible copy).
 *
 * Expected authored structure (single cell):
 *   - A link whose text is the accessible label and whose href targets the lookbook.
 *   - Two image cells (rendered side-by-side; first = right half, second = left half).
 *   - A heading (card title).
 *   - A paragraph (card description).
 *
 * @param {Element} block The teaser-editorial block element
 */
export default function decorate(block) {
  // Optimize all images.
  block.querySelectorAll('img').forEach((img) => {
    const picture = img.closest('picture');
    const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '1200' }]);
    if (picture) picture.replaceWith(optimized);
    else img.replaceWith(optimized);
  });

  // The link supplies the href + accessible label for the whole unit.
  const link = block.querySelector('a[href]');
  const href = link ? link.getAttribute('href') : null;
  const label = link ? (link.getAttribute('title') || link.textContent.trim()) : '';

  // Gather content.
  const pictures = [...block.querySelectorAll('picture')];
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const description = [...block.querySelectorAll('p')].find((p) => !p.querySelector('a'));

  // Build the media band (two images side-by-side).
  // Authored order is right-image first, left-image second — reverse so the
  // left half renders first (matches source layout).
  const media = document.createElement('div');
  media.className = 'teaser-editorial-media';
  pictures.reverse().forEach((pic) => media.append(pic));

  // Build the floating title/description card.
  const card = document.createElement('div');
  card.className = 'teaser-editorial-card';
  if (heading) card.append(heading);
  if (description) card.append(description);

  // Compose everything inside a single anchor (the whole unit is clickable).
  const anchor = document.createElement('a');
  anchor.className = 'teaser-editorial-link';
  if (href) anchor.href = href;
  if (label) {
    anchor.setAttribute('aria-label', label);
    anchor.title = label;
  }
  // External lookbook opens in a new tab.
  if (href && /^https?:\/\//.test(href)) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  if (media.children.length) anchor.append(media);
  anchor.append(card);

  block.textContent = '';
  block.append(anchor);
}
