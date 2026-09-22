/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Havertys site-wide cleanup.
 * All selectors verified against migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable skip links (cleaned.html lines 2-3: skip-to-chat / skip-to-main).
    WebImporter.DOMUtils.remove(element, ['.skip-to-link']);

    // Search widget button uses an inline base64 SVG data-URI <img>
    // (cleaned.html line 56); it lives in the header but strip any stray
    // data-URI imgs so they never leak into block/image cells.
    element.querySelectorAll('img[src^="data:"]').forEach((img) => img.remove());
  }

  if (hookName === TransformHook.afterTransform) {
    // Site shell / non-authorable chrome verified in cleaned.html:
    //  - header.header-wrapper (#header nav, search, mobilenav/meganav) line 4
    //  - footer.footer-wrapper line 1443
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'header',
      'footer.footer-wrapper',
      'footer',
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
