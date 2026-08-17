# Local service icon bundle

- `icons.svg` contains all 62 namespaced service symbols and is the only icon file used by the application.
- Fifty-three symbols contain vector artwork.
- Nine symbols contain losslessly embedded raster artwork because a faithful vector replacement was unavailable.
- `icons.svg.br` is an optional Brotli-compressed copy. Vite development and preview serve it transparently when the browser requests `icons.svg` with Brotli support; other production servers require equivalent precompressed-file configuration.

The original `multiall/`, `asktoall/`, and `aiforall/` icon folders were removed after their contents were consolidated and validated against every catalog entry.
