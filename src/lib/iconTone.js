import { iconTones } from '../data/iconTones.js';

/**
 * Icons are single-colour brand marks sitting on a shell that is black on the
 * dark theme and white on the light one, so the extremes vanish: a near-black
 * mark disappears on dark, a near-white or very bright one on light.
 *
 * `scripts/generate-icons.mjs` measures each symbol's luminance and records
 * which extreme it falls into; the CSS then corrects only that case, on only
 * the theme where it is a problem. Everything in between keeps its own colour.
 *
 * Raster symbols are excluded: they already carry the white-background filter
 * and a second `filter` would replace it.
 *
 * @param {{symbol?: string, raster?: boolean}|null|undefined} icon
 * @returns {'dark'|'light'|''}
 */
export function iconTone(icon) {
  if (!icon?.symbol || icon.raster) return '';
  return iconTones[icon.symbol] ?? '';
}
