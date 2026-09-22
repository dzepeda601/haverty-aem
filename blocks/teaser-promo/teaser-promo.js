import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Teaser Promo — one or more promotional panels presented side by side over a
 * shared background image. Each panel pairs media (image or video) with a
 * content column (eyebrow, heading, description, and one or more CTA links).
 *
 * Expected authored structure (one row per panel):
 *   [ media cell (image or .mp4 link) ][ content cell: eyebrow, heading,
 *     description, CTA link(s) ]
 *
 * The importer/Dynamic Media pipeline turns a bare `.mp4` asset link into an
 * `<img>` (or `<picture>`) pointing at the video file. This decorator detects
 * any such media and swaps it for an autoplaying, muted, looping `<video>`.
 *
 * @param {Element} block The teaser-promo block element
 */
const MP4_RE = /\.mp4(?:$|[?#])/i;

function findVideoUrl(cell) {
  // A converted <img>/<source> or a raw <a> may carry the .mp4 URL.
  const img = cell.querySelector('img');
  if (img && MP4_RE.test(img.getAttribute('src') || '')) return img.getAttribute('src');
  const source = cell.querySelector('source');
  if (source && MP4_RE.test(source.getAttribute('srcset') || '')) {
    return (source.getAttribute('srcset') || '').split('?')[0]
      + (source.getAttribute('srcset').includes('?') ? `?${source.getAttribute('srcset').split('?').slice(1).join('?')}` : '');
  }
  const link = cell.querySelector('a[href]');
  if (link && MP4_RE.test(link.getAttribute('href') || '')) return link.getAttribute('href');
  return null;
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('teaser-promo-panel');

    [...row.children].forEach((cell) => {
      const videoUrl = findVideoUrl(cell);
      if (videoUrl) {
        // Media cell containing a video asset.
        cell.classList.add('teaser-promo-media', 'teaser-promo-media-video');
        cell.textContent = '';
        const video = document.createElement('video');
        // Strip any resizing query the image pipeline appended; keep the asset URL.
        const [base, query = ''] = videoUrl.split('?');
        const params = new URLSearchParams(query);
        params.delete('width');
        params.delete('quality');
        const search = params.toString();
        video.src = search ? `${base}?${search}` : base;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.setAttribute('muted', '');
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.preload = 'auto';
        cell.append(video);
      } else if (cell.querySelector('img, picture')) {
        cell.classList.add('teaser-promo-media');
        // Optimize any images.
        cell.querySelectorAll('img').forEach((img) => {
          const picture = img.closest('picture');
          const optimized = createOptimizedPicture(
            img.src,
            img.alt || '',
            false,
            [{ width: '1600' }],
          );
          if (picture) picture.replaceWith(optimized);
          else img.replaceWith(optimized);
        });
      } else {
        cell.classList.add('teaser-promo-content');
      }
    });
  });
}
