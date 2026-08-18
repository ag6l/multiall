import { iconRaster } from '../data/iconRaster.js';
import { iconTones } from '../data/iconTones.js';

/**
 * The single place icon loading is decided. A service's `icon` is the id of a
 * `<symbol>` in `public/assets/icons.svg` and nothing else: no prefixes, no
 * per-service resolution, no favicon guessing at runtime. `pnpm icons` fails
 * loudly when a mark cannot be sourced, so by the time the app runs every
 * service has one and callers never need a fallback branch.
 *
 * Whether a mark is vector or an embedded bitmap is a property of the sprite,
 * not of the catalog, so both lookups below are keyed on the symbol id and fed
 * by generated tables rather than hand-written per-service flags that can drift.
 *
 * @param {string} icon sprite symbol id
 * @returns {string}
 */
export const iconHref = (icon) => `./assets/icons.svg#${icon}`;

const raster = new Set(iconRaster);

/**
 * Bitmap marks sit on the same shell as the vector ones but carry their own
 * white background, which the shell has to knock out. Vector marks must not get
 * the filter: it would replace the tone correction below.
 *
 * @param {string|undefined} icon sprite symbol id
 * @returns {boolean}
 */
export const iconIsRaster = (icon) => raster.has(icon ?? '');

/**
 * Icons are single-colour brand marks sitting on a shell that is black on the
 * dark theme and white on the light one, so the extremes vanish: a near-black
 * mark disappears on dark, a near-white or very bright one on light.
 *
 * `scripts/generate-icons.mjs` measures each symbol's luminance and records
 * which extreme it falls into; the CSS then corrects only that case, on only
 * the theme where it is a problem. Everything in between keeps its own colour.
 *
 * @param {string|undefined} icon sprite symbol id
 * @returns {'dark'|'light'|''}
 */
export const iconTone = (icon) =>
  /** @type {Record<string, 'dark'|'light'>} */ (iconTones)[icon ?? ''] ?? '';
