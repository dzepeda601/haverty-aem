/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from './parsers/hero-overlay.js';
import carouselCategoryParser from './parsers/carousel-category.js';
import carouselDesignerParser from './parsers/carousel-designer.js';
import teaserEditorialParser from './parsers/teaser-editorial.js';
import teaserPromoParser from './parsers/teaser-promo.js';
import heroCtaParser from './parsers/hero-cta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/havertys-cleanup.js';
import sectionsTransformer from './transformers/havertys-sections.js';
import dmImagesTransformer from './transformers/havertys-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-overlay': heroOverlayParser,
  'carousel-category': carouselCategoryParser,
  'carousel-designer': carouselDesignerParser,
  'teaser-editorial': teaserEditorialParser,
  'teaser-promo': teaserPromoParser,
  'hero-cta': heroCtaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Havertys homepage: hero, shop-by-category carousel, designer-pick carousel, editorial lookbook, dual promo teasers, sign-up CTA, and fine print.',
  urls: [
    'https://www.havertys.com/',
  ],
  blocks: [
    {
      name: 'hero-overlay',
      instances: ['.hero-container .hero', '.hero-main-container'],
    },
    {
      name: 'carousel-category',
      instances: ['.category-carousel-container .category-carousel', '.category-carousel-main-container'],
    },
    {
      name: 'carousel-designer',
      instances: ['.highlight-carousel-container .highlight-carousel', '.highlight-container-wrapper'],
    },
    {
      name: 'teaser-editorial',
      instances: ['.editorial-container .editorial'],
    },
    {
      name: 'teaser-promo',
      instances: ['.commerce-teaser-container .commerce-teaser', '.commerce-teaser-wrapper .commerce-teaser'],
    },
    {
      name: 'hero-cta',
      instances: ['.call-to-action-container .call-to-action', '.call-to-action-main-container'],
    },
  ],
  sections: [
    {
      id: 'rc2', name: 'hero', selector: ['.section.hero-container'], style: null, blocks: ['hero-overlay'], defaultContent: [],
    },
    {
      id: 'rc3', name: 'shop-by-category', selector: ['.section.category-carousel-container'], style: null, blocks: ['carousel-category'], defaultContent: [],
    },
    {
      id: 'rc4', name: 'designer-pick', selector: ['.section.highlight-carousel-container'], style: null, blocks: ['carousel-designer'], defaultContent: [],
    },
    {
      id: 'rc5', name: 'lookbook', selector: ['.section.editorial-container'], style: null, blocks: ['teaser-editorial'], defaultContent: [],
    },
    {
      id: 'rc6', name: 'promo', selector: ['.section.commerce-teaser-container'], style: null, blocks: ['teaser-promo'], defaultContent: [],
    },
    {
      id: 'rc7', name: 'get-exclusive-access', selector: ['.section.call-to-action-container'], style: 'cta', blocks: ['hero-cta'], defaultContent: [],
    },
    {
      id: 'rc8', name: 'fine-print', selector: ['.section.read-more-container'], style: null, blocks: [], defaultContent: ['.hvt-text'],
    },
  ],
};

// TRANSFORMER REGISTRY
// cleanup runs first; sections adds <hr> breaks + metadata (2+ sections);
// dm-images rewrites DM/Scene7 imgs to carrier anchors (afterTransform).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook.
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Each block is matched by the FIRST instance selector that finds elements,
 * so alternate selectors act as fallbacks rather than duplicating a block.
 */
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

    // 6. Generate sanitized path; map the homepage root to /index.
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
