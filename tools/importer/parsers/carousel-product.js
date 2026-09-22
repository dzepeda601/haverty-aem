/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-product. Base: carousel. Source: https://www.havertys.com/sale
 *
 * Follows the carousel convention: a 2-column table where each slide row has an
 * image cell (first) and a content cell (second). Here each slide is one product
 * card:
 *   [ product image (+ optional hover image) ][ name link, price, description ]
 *
 * A leading single-cell row carries the carousel's row title (e.g. "Shop These
 * Limited-Time Deals"). DM/Scene7 <img> tags are left in place so the DM
 * transformer rewrites them into carrier anchors afterward.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Leading title row (single cell) — the label-sm in the content container.
  const title = element.querySelector('.content-container .label-sm, .label-sm');
  if (title) {
    const p = document.createElement('p');
    p.textContent = title.textContent.trim();
    cells.push([p]);
  }

  // One row per product card: [image cell][content cell].
  element.querySelectorAll('.product-item').forEach((item) => {
    const imageCell = [];
    const silo = item.querySelector('.silo-image, .image-link-wrapper img');
    if (silo) imageCell.push(silo);
    const hover = item.querySelector('.hover-image img');
    if (hover) imageCell.push(hover);

    const contentCell = [];

    // Name link.
    const name = item.querySelector('.product-name');
    if (name) {
      const a = document.createElement('a');
      a.setAttribute('href', name.getAttribute('href') || '#');
      a.textContent = (name.textContent || '').trim();
      contentCell.push(a);
    }

    // Prices — original + special combined into one paragraph.
    const og = item.querySelector('.product-og-price');
    const sp = item.querySelector('.product-price');
    const prices = [og, sp]
      .filter(Boolean)
      .map((el) => (el.textContent || '').replace(/Original price:|Special price:/g, '').trim())
      .filter(Boolean);
    if (prices.length) {
      const p = document.createElement('p');
      p.textContent = prices.join(' ');
      contentCell.push(p);
    }

    // Short description.
    const desc = item.querySelector('.product-description');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = (desc.textContent || '').trim();
      contentCell.push(p);
    }

    if (imageCell.length || contentCell.length) {
      cells.push([imageCell, contentCell]);
    }
  });

  if (cells.length <= 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-product', cells });
  element.replaceWith(block);
}
