/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-overlay. Base: hero. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * Full-bleed background media (image or video) with a single overlay CTA text
 * link. 1-column hero table: optional media row, then a content row holding the
 * CTA. DM/Scene7 <img> tags are left in place so the DM transformer can rewrite
 * them into carrier anchors; a real <video> uses a blob: URL that cannot be
 * preserved, so only an .mp4 asset link (if any) is carried forward.
 */
export default function parse(element, { document }) {
  const cells = [];

  // --- Background media (optional) ---
  // A real background image (DM/Scene7 or otherwise). blob: <video> sources are
  // runtime-only and cannot survive the round-trip, so skip them; only a
  // shareable .mp4 asset link is carried as media. When the hero is a <video>
  // with a poster frame (a real DM/Scene7 asset), carry the poster as the
  // background image so the hero has a visible backdrop after import.
  const bgImg = element.querySelector('.hero-inner-image-container img, .hero-main-container > .hero-inner-image-container img, img');
  const bgVideoLink = element.querySelector('a[href$=".mp4"], a[href*=".mp4?"]');
  const video = element.querySelector('video[poster]');
  const posterUrl = video && video.getAttribute('poster');
  const mediaCell = [];
  if (bgImg && !(bgImg.getAttribute('src') || '').startsWith('blob:')) {
    mediaCell.push(bgImg);
  } else if (posterUrl && !posterUrl.startsWith('blob:')) {
    const poster = document.createElement('img');
    poster.setAttribute('src', posterUrl);
    poster.setAttribute('alt', '');
    mediaCell.push(poster);
  }
  if (bgVideoLink) mediaCell.push(bgVideoLink);
  if (mediaCell.length) cells.push([mediaCell]);

  // --- Overlay content: the CTA text link ---
  const cta = element.querySelector('.feature-product-text a[href], .hero-text-content a[href], a[href]:not(.hero-first-variation-anchor-img)');
  const contentCell = [];
  if (cta) {
    // Preserve the emphasis wrapper (e.g. <em><a>…</a></em>) when present.
    const wrapper = cta.closest('em, p');
    contentCell.push(wrapper && wrapper.textContent.trim() === cta.textContent.trim() ? wrapper : cta);
  }

  // Empty-block guard: no media and no CTA means nothing meaningful to import.
  if (!cells.length && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (contentCell.length) cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-overlay', cells });
  element.replaceWith(block);
}
