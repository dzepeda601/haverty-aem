/* eslint-disable */
/* global WebImporter */
/**
 * Parser for teaser-editorial. Base: teaser. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * Editorial lookbook promo: two images + a text card (heading "FALL 2026
 * LOOKBOOK" + description), the whole unit wrapped in one external link.
 * Standalone model: single row, single cell holding all content. The wrapping
 * <a> (with its href) is preserved first so the block's decorate() can lift the
 * href onto the clickable card. Local <img> tags are non-DM and pass through
 * unchanged.
 */
export default function parse(element, { document }) {
  const contentCell = [];

  // The outer link carries the lookbook href.
  const link = element.querySelector('a[href]');
  const href = link ? link.getAttribute('href') : null;

  // Images (two lookbook shots). Preserve <picture> wrappers when present.
  const images = [...element.querySelectorAll('picture')];
  const imgEls = images.length ? images : [...element.querySelectorAll('img')];

  // The text card: heading + description.
  const heading = element.querySelector('h1, h2, h3, h4, h5, h6, .title');
  const description = element.querySelector('.description, p.description, .card p, p');

  // Empty-block guard.
  if (!imgEls.length && !heading && !description) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Carry the href via an empty anchor so decorate() can wrap the card in it.
  if (href) {
    const hrefAnchor = document.createElement('a');
    hrefAnchor.href = href;
    if (link.title) hrefAnchor.title = link.title;
    hrefAnchor.textContent = link.title || 'Explore our Lookbook';
    contentCell.push(hrefAnchor);
  }

  imgEls.forEach((img) => contentCell.push(img));
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);

  const cells = [[contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'teaser-editorial', cells });
  element.replaceWith(block);
}
