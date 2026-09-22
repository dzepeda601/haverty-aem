/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from './parsers/hero-overlay.js';
import carouselProductParser from './parsers/carousel-product.js';
import cardsLogoParser from './parsers/cards-logo.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/havertys-cleanup.js';
import sectionsTransformer from './transformers/havertys-sections.js';
import dmImagesTransformer from './transformers/havertys-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-overlay': heroOverlayParser,
  'carousel-product': carouselProductParser,
  'cards-logo': cardsLogoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (sale)
const PAGE_TEMPLATE = {
  name: 'sale',
  description: 'Havertys sale landing page: hero, product carousels, mattress-brand logo grid, and SEO copy.',
  urls: [
    'https://www.havertys.com/sale',
  ],
  blocks: [
    {
      name: 'hero-overlay',
      instances: ['.section.bg-image.hvt-text-container'],
    },
    {
      name: 'carousel-product',
      instances: ['.product-carousel-container .product-carousel'],
    },
    {
      name: 'cards-logo',
      instances: ['.grid-container.dynamic-media-image-container'],
    },
  ],
  sections: [
    {
      id: 'rc2', name: 'hero', selector: ['.section.bg-image.hvt-text-container'], style: null, blocks: ['hero-overlay'], defaultContent: [],
    },
    {
      id: 'rc3', name: 'deals-carousel', selector: ['#fabric', '.section.product-carousel-container'], style: null, blocks: ['carousel-product'], defaultContent: [],
    },
    {
      id: 'rc4', name: 'bestseller-carousels', selector: ['.section.product-carousel-container:nth-of-type(3)'], style: null, blocks: ['carousel-product'], defaultContent: [],
    },
    {
      id: 'rc5', name: 'mattress-brands-label', selector: ['.section.hvt-text-container:nth-of-type(4)'], style: null, blocks: [], defaultContent: ['.hvt-text'],
    },
    {
      id: 'rc6', name: 'brand-logos', selector: ['.section.grid-container.dynamic-media-image-container'], style: null, blocks: ['cards-logo'], defaultContent: [],
    },
    {
      id: 'rc7', name: 'seo-fineprint', selector: ['.section.hvt-text-container.fragment-container'], style: null, blocks: [], defaultContent: ['.hvt-text'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    let matched = false;
    blockDef.instances.forEach((selector) => {
      if (matched) return;
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) return;
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
      matched = true;
    });
    if (!matched) {
      console.warn(`Block "${blockDef.name}" not found with any selector: ${blockDef.instances.join(', ')}`);
    }
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup, section breaks/metadata, DM images)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path; map the root to /index (defensive).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
