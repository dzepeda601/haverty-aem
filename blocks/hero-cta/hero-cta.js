/**
 * Hero CTA — a compact call-to-action band: heading, subheading, and a single
 * call-to-action button. Used mid-page (e.g. a newsletter sign-up prompt).
 *
 * Expected authored structure:
 *   - A heading and subheading (default content).
 *   - A single CTA link.
 *
 * The authored DOM is used directly; this decorator only tags the text and CTA
 * for layout and ensures the CTA renders as a button.
 * @param {Element} block The hero-cta block element
 */
export default function decorate(block) {
  const text = document.createElement('div');
  text.className = 'hero-cta-text';

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'hero-cta-action';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const link = cell.querySelector('a[href]');
      if (link && cell.textContent.trim() === link.textContent.trim()) {
        ctaWrap.append(...cell.childNodes);
      } else {
        text.append(...cell.childNodes);
      }
    });
    row.remove();
  });

  if (text.childNodes.length) block.append(text);
  if (ctaWrap.childNodes.length) block.append(ctaWrap);
}
