import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero Overlay — full-bleed background media (image or video) with a single
 * call-to-action text link overlaid on top.
 *
 * Expected authored structure (rows):
 *   1. Background media: a <picture>/<img>, or a link to a video/asset.
 *   2. Overlay content: a text link (e.g. "learn more about our special financing").
 *
 * Missing/extra cells are handled gracefully.
 * @param {Element} block The hero-overlay block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // The first row is background media only when it actually contains an
  // image/picture or a link to a video asset. A media-less block (e.g. a
  // single overlaid CTA link over a video that can't be authored here) keeps
  // all of its rows as overlay content.
  const firstRow = rows[0];
  const firstImg = firstRow && firstRow.querySelector('picture > img, img');
  const firstVideoLink = firstRow
    && firstRow.querySelector('a[href$=".mp4"], a[href*=".mp4?"]');
  const hasMedia = Boolean(firstImg || firstVideoLink);

  let overlayRows = rows;

  if (hasMedia) {
    const mediaRow = firstRow;
    mediaRow.classList.add('hero-overlay-media');

    // Optimize any authored picture.
    if (firstImg) {
      const picture = firstImg.closest('picture');
      const optimized = createOptimizedPicture(firstImg.src, firstImg.alt || '', true, [{ width: '1600' }]);
      if (picture) picture.replaceWith(optimized);
      else firstImg.replaceWith(optimized);
    }

    // A bare link pointing at a video source becomes an autoplaying background video.
    if (firstVideoLink && !mediaRow.querySelector('video')) {
      const video = document.createElement('video');
      video.src = firstVideoLink.href;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      firstVideoLink.replaceWith(video);
    }

    overlayRows = rows.slice(1);
  } else {
    block.classList.add('hero-overlay-no-media');
  }

  // Remaining rows are overlay content (the CTA text/link).
  if (overlayRows.length) {
    const overlay = document.createElement('div');
    overlay.className = 'hero-overlay-content';
    overlayRows.forEach((row) => overlay.append(row));
    block.append(overlay);
  }
}
