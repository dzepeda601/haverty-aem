/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/havertys-cleanup.js';
import dmImagesTransformer from './transformers/havertys-dm-images.js';

// This fragment is pure default content (financing / promo disclaimer text),
// so there are no block parsers — just site cleanup, DM image handling, and
// the WebImporter built-in rules.
const PAGE_TEMPLATE = {
  name: 'fragment-disclaimer',
  description: 'Financing & promo disclaimer fragment.',
  urls: ['https://www.havertys.com/fragments/promo-callout/financing/financing-promo-disclaimer'],
  blocks: [],
  sections: [],
};

const transformers = [cleanupTransformer, dmImagesTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);
    // No block parsers — the fragment is default content.
    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: [] },
    }];
  },
};
