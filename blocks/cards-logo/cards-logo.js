import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards Logo — a grid of brand logo images, each linking to a category page.
 * No visible captions; the whole logo is the clickable link.
 *
 * Expected authored structure (cards convention, 2 cells per row):
 *   [ logo image ][ link (its href is the destination; text = brand name) ]
 *
 * The link's href is applied to the whole card and its text becomes the image
 * alt / accessible label; it is not shown as a visible caption.
 *
 * @param {Element} block The cards-logo block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-logo-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-logo-item';

    const img = row.querySelector('img');
    const link = row.querySelector('a[href]');
    const label = link ? link.textContent.trim() : (img ? img.alt : '');

    if (img) {
      const optimized = createOptimizedPicture(img.src, label || img.alt || '', false, [{ width: '600' }]);
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        if (label) a.title = label;
        a.className = 'cards-logo-link';
        a.setAttribute('aria-label', label || 'Shop now');
        a.append(optimized);
        li.append(a);
      } else {
        li.append(optimized);
      }
    } else if (link) {
      li.append(link);
    }

    if (li.childNodes.length) ul.append(li);
    row.remove();
  });

  block.replaceChildren(ul);
}
