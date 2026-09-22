/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-category. Base: carousel. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * Horizontal strip of category tiles. 2-column carousel table: one row per
 * tile = [image cell][label/link cell]. DM/Scene7 <img> tags are left in place
 * so the DM transformer can rewrite them into carrier anchors.
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('.category-slide, [class*="category-slide"]');
  const cells = [];

  slides.forEach((slide) => {
    // First cell: the tile image.
    const img = slide.querySelector('.category-image img, .image-wrapper img, img');
    // Second cell: the label link (category name + href). Prefer the visible
    // title link (has text) over the image-wrapping link (empty text). Grouped
    // selectors resolve by document order, so use an explicit OR-chain instead.
    const label = slide.querySelector('.category-title-container a[href]')
      || slide.querySelector('.category-link')
      || slide.querySelector('a[href]');
    if (!img && !label) return;
    cells.push([img || '', label || '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-category', cells });
  element.replaceWith(block);
}
