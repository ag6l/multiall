import { createReadStream, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const iconsBrotliPath = resolve(projectDirectory, 'public/assets/icons.svg.br');

function serveBrotliIcon() {
  const middleware = (request, response, next) => {
    const pathname = request.url?.split('?', 1)[0];
    const acceptsBrotli = /(?:^|,|\s)br(?:,|\s|$)/i.test(request.headers['accept-encoding'] ?? '');

    if (pathname !== '/assets/icons.svg' || !acceptsBrotli || !existsSync(iconsBrotliPath)) {
      next();
      return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Content-Encoding', 'br');
    response.setHeader('Vary', 'Accept-Encoding');
    createReadStream(iconsBrotliPath).pipe(response);
  };

  return {
    name: 'serve-brotli-icon-sprite',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

export default defineConfig({
  // Relative by default so the build works from any path (e.g. opened straight
  // off disk). GitHub Pages project sites serve from a `/<repo>/` subpath, so
  // the deploy workflow overrides this via BASE_PATH to an absolute path —
  // relative paths break there once the URL has extra segments (e.g. a client
  // route) because `./assets/...` would resolve relative to that segment
  // instead of the site root.
  base: process.env.BASE_PATH ?? './',
  plugins: [serveBrotliIcon(), svelte()],
  build: {
    rollupOptions: {
      input: resolve(projectDirectory, 'index.html')
    }
  }
});
