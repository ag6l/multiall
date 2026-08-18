# Local service icon bundle

- `icons.svg` contains all 490 service symbols and is the only icon file used by the application. 500 services share them, because services of the same brand share a mark.
- Symbol ids are the service slug and nothing else (`google`, `google-scholar`, `hacker-news`). The old `multiall-`, `asktoall-` and `aiforall-` prefixes are gone, which also collapsed the duplicate marks the prefixes had been hiding.
- 411 symbols are vector artwork, from simple-icons (CC0-1.0) or the site's own `favicon.svg` when it is a genuine vector.
- 79 symbols carry a losslessly embedded raster favicon, because no vector mark exists for that brand — simple-icons has dropped many (Amazon, LinkedIn, Nature, Walmart and others) and those sites publish no SVG mark. They are listed in the generated `src/data/iconRaster.js`, which is what keys the white-background filter in the CSS. Letter monograms are never used.
- `icons.svg.br` is an optional Brotli-compressed copy. Vite development and preview serve it transparently when the browser requests `icons.svg` with Brotli support; other production servers require equivalent precompressed-file configuration.

Run `pnpm run icons` to add symbols for newly added services. It resolves a missing mark from simple-icons first, then the site's vector `favicon.svg`, then the site's raster favicon, and fails the run if none of those yield anything.
