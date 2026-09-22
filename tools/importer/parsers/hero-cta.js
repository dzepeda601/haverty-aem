/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cta. Base: hero. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * Compact call-to-action band: heading "GET EXCLUSIVE ACCESS" + subheading +
 * a single "Sign Up" CTA link. The block's decorate() splits cells by whether a
 * cell's text equals its link text (that cell becomes the button, the rest
 * becomes heading text), so we emit one row with two cells:
 * [heading + subheading][CTA link].
 */
export default function parse(element, { document }) {
  // Text cell: heading + subheading.
  const textCell = [];
  const heading = element.querySelector('.call-to-action-text h2, h1, h2, h3');
  const subheading = element.querySelector('.call-to-action-text h5, h4, h5, h6, p');
  if (heading) textCell.push(heading);
  if (subheading && subheading !== heading) textCell.push(subheading);

  // CTA cell: the sign-up link (a standalone anchor, so its text == link text).
  const cta = element.querySelector('.call-to-action-cta a[href], a.button, a[href]');
  const ctaCell = [];
  if (cta) {
    // Use the inner text so the cell's textContent equals the link text; this
    // lets decorate() recognise it as the CTA and render it as a button.
    const link = document.createElement('a');
    link.href = cta.getAttribute('href');
    if (cta.title) link.title = cta.title;
    link.textContent = cta.textContent.trim();
    ctaCell.push(link);
  }

  // Empty-block guard.
  if (!textCell.length && !ctaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell, ctaCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
