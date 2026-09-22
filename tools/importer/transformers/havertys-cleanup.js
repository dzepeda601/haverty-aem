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

    // Some authored blocks (e.g. the sale-page hvt-text SEO block) leak a
    // block style-option token into a stray <p> — e.g. <p>para-sm</p>. These
    // are decoration config, never real copy, and would otherwise render as
    // visible text. Remove any <p> whose entire text is exactly one such token.
    const STYLE_TOKEN = /^(para|label|title|body)-(xs|sm|md|lg|xl)$|^m-[btlr]-(0|xs|sm|md|lg|xl)$|^alignment-(left|center|right)$/;
    element.querySelectorAll('p').forEach((p) => {
      const text = (p.textContent || '').trim();
      if (STYLE_TOKEN.test(text) && p.children.length === 0) p.remove();
    });
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
