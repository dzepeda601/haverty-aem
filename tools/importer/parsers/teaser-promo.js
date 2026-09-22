/* eslint-disable */
/* global WebImporter */
/**
 * Parser for teaser-promo. Base: teaser. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * A single promotional panel: [media (image or video)][content: eyebrow,
 * heading, description, one or more CTA links]. The page selector matches each
 * .commerce-teaser panel individually, so this parser runs once per panel and
 * emits a 2-column row = [media cell][content cell].
 *
 * Media handling:
 *  - Image panels: DM/Scene7 <img> left in place for the DM transformer to
 *    rewrite into a carrier anchor.
 *  - Video panels: the <video>/<source> mp4 URL is carried as an .mp4 anchor so
 *    the block's decorate() rebuilds it into a background <video>.
 */
export default function parse(element, { document }) {
  // --- Media cell ---
  const mediaCell = [];
  const mediaImg = element.querySelector('.image-container img, .scene7-image img, img');
  const videoSrc = element.querySelector('video source[src], video[src]');
  if (mediaImg) {
    mediaCell.push(mediaImg);
  } else if (videoSrc) {
    const url = videoSrc.getAttribute('src');
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      mediaCell.push(a);
    }
  }

  // --- Content cell ---
  const contentCell = [];
  const eyebrow = element.querySelector('.titles > div > p, .titles p:not(.description)');
  const heading = element.querySelector('.titles h2, h1, h2, h3');
  const description = element.querySelector('.description p, .para.description p, .para p');
  const ctas = element.querySelectorAll('.button-container a[href], .content-container a.button, a.cta');

  if (eyebrow) contentCell.push(eyebrow);
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  ctas.forEach((cta) => contentCell.push(cta));

  // Empty-block guard.
  if (!mediaCell.length && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[mediaCell, contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'teaser-promo', cells });
  element.replaceWith(block);
}
