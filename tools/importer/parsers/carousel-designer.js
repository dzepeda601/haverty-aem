/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-designer. Base: carousel. Source: https://www.havertys.com/
 * Generated: 2026-09-22
 *
 * Rotating editorial carousel. 2-column carousel table: one row per slide =
 * [room-scene image cell][content cell: heading "Designer Pick", description,
 * Shop-collection CTA, product image, product name link, sale + original price].
 * DM/Scene7 <img> tags are left in place for the DM transformer to rewrite into
 * carrier anchors.
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('.highlight-slide, .swiper-slide.highlight-slide, [class*="highlight-slide"]');
  const cells = [];

  slides.forEach((slide) => {
    // Cell 1: the room-scene image (lives under .asset-container; the product
    // image lives under .product-item, which is a sibling of .asset-container).
    const sceneImg = slide.querySelector('.asset-container .image img, .asset-container img');

    // Cell 2: editorial content + product details.
    const contentCell = [];
    const heading = slide.querySelector('.title-container h2, .content h2, h2');
    const description = slide.querySelector('.para p, .content .para p, p');
    const cta = slide.querySelector('.button-container a[href], .content a.button, .content a[href]');
    const productImg = slide.querySelector('.product-item img');
    const productName = slide.querySelector('.product-name a[href], .product-name, .details a[href]');
    const priceRange = slide.querySelector('.price-range, .product-price .price-range, .price');

    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    if (productImg) contentCell.push(productImg);
    if (productName) contentCell.push(productName);
    if (priceRange) contentCell.push(priceRange);

    if (!sceneImg && !contentCell.length) return;
    cells.push([sceneImg || '', contentCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-designer', cells });
  element.replaceWith(block);
}
