/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-logo. Base: cards. Source: https://www.havertys.com/sale
 *
 * A grid of brand logo image links. In the source (pre-decoration) each
 * `.dynamic-media-image` block holds two cells:
 *   cell 1: a link whose HREF is the DM logo image URL (title = "Shop X …")
 *   cell 2: a link to the brand's category page
 *
 * Follows the cards convention (2 columns per row): image cell + content cell.
 * We synthesize an <img> from the DM logo URL (left in place for the DM
 * transformer to rewrite into a carrier anchor) and put the category link in
 * the content cell.
 */
export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.dynamic-media-image').forEach((logo) => {
    const links = [...logo.querySelectorAll('a[href]')];
    if (!links.length) return;

    // The image link: its href is the logo image URL (has a title / no
    // leading slash). The category link: an internal path (starts with /).
    const imgLink = links.find((a) => /\.(avif|jpe?g|png|webp|gif)|\/adobe\/assets\/|\/is\/image\//i.test(a.getAttribute('href') || ''))
      || links[0];
    const catLink = links.find((a) => a !== imgLink && (a.getAttribute('href') || '').startsWith('/'))
      || links.find((a) => a !== imgLink);

    const imageCell = [];
    if (imgLink) {
      const img = document.createElement('img');
      img.setAttribute('src', imgLink.getAttribute('href'));
      img.setAttribute('alt', imgLink.getAttribute('title') || '');
      imageCell.push(img);
    }

    const contentCell = [];
    if (catLink) {
      const a = document.createElement('a');
      a.setAttribute('href', catLink.getAttribute('href'));
      a.textContent = (imgLink && imgLink.getAttribute('title')) || (catLink.textContent || '').trim() || 'Shop now';
      contentCell.push(a);
    }

    if (imageCell.length) cells.push([imageCell, contentCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logo', cells });
  element.replaceWith(block);
}
