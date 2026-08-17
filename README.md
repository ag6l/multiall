# MultiALL

Buscador de página única (Svelte + Vite, sin SvelteKit): una sola barra que envía la consulta al destino que elijas — buscadores web, comunidades o servicios de IA.

## Desarrollo

Requiere Node.js 18 o posterior.

```bash
pnpm install
pnpm run dev
```

## Comprobaciones

```bash
pnpm run test     # checks de bang/tokenizers y calculadora
pnpm run check    # svelte-check
pnpm run build
pnpm run preview
```

## Organización

- `index.html`: único punto de entrada; aplica tema e idioma antes del primer renderizado para evitar parpadeo.
- `src/data/services.js`: catálogo único de servicios (nombre, bang, categoría, scope, URL de búsqueda, icono).
- `src/lib/bang/`: modelo de bangs — cómo el texto del editor se traduce a bang + opciones + consulta.
- `src/lib/tokenizers/`: resaltado por destino (Markdown para IA, operadores web, notación Wolfram).
- `src/lib/search.js`: saludo por hora, construcción de URLs y navegación.
- `src/components/search/SearchBar.svelte`: editor `contenteditable` con chips de bang, historial y comandos.
- `src/App.svelte`: composición y estado.

## Barra de búsqueda

El valor lógico del campo es siempre el texto plano completo (`!gt[es:en] hola`); lo que se ve son decoraciones derivadas de ese texto. Por eso copiar, cortar o borrar una selección que incluya el chip del bang devuelve su texto de origen.

- `Enter` envía; `Shift + Enter` agrega una línea.
- `!` inicia un bang y `Tab` recorre las coincidencias. Ejemplos: `!g clima`, `!yt música`, `!w Svelte`, `!gem pregunta`.
- `!gt[es:en] texto` traduce entre los idiomas indicados.
- `:` abre los comandos disponibles dentro de la misma barra (`:cal`, `:weather`, `:history`), con `↑↓`/`Tab` para elegir y `Enter` para ejecutar.
- `i` enfoca la barra desde cualquier parte de la página.
- Se guardan las últimas 12 consultas en `localStorage`; `:history` las muestra todas en un panel con opciones para reutilizar, quitar o borrar el historial.
- El botón `＋` adjunta archivos (ver más abajo).

Los marcadores de Markdown (`**`, `` ` ``, `~~`, `[…](…)`) se atenúan para que el contenido se lea con su estilo aplicado, y recuperan su intensidad completa cuando el cursor entra en el token, que es justo cuando hace falta verlos para editarlos o borrarlos. Los caracteres nunca se eliminan: el cálculo de posición del cursor depende de que cada carácter del valor exista en el DOM.

## Clima

No se pide la ubicación al cargar la página. Al abrir la aplicación el clima solo se resuelve con una ubicación guardada en Configuración o con la caché reciente; el permiso de geolocalización se solicita únicamente cuando consultas el clima (al pulsar el indicador del encabezado, `:weather` o **Reintentar**).

## Preferencias

**Configuración** guarda nombre, idioma (español/inglés), tema, ubicación del clima, buscador predeterminado e intensidad del fondo. Todo se almacena en `localStorage`; la imagen de fondo va en IndexedDB para admitir archivos grandes sin enviarlos a ningún servidor. El buscador predeterminado es el que se usa al presionar `Enter` sin un bang activo.

## Recursos locales

No se hacen solicitudes a servidores de fuentes ni de iconos. DM Sans, Space Grotesk, Symbols Nerd Font y Noto Color Emoji se sirven desde el proyecto; los iconos de servicios viven en un único sprite, `public/assets/icons.svg`.

El sprite se regenera con `pnpm run icons`, que toma las marcas de [simple-icons](https://github.com/simple-icons/simple-icons) (CC0-1.0) según el mapa de `scripts/generate-icons.mjs` y actualiza también la copia Brotli. Es idempotente: los símbolos ya presentes no se tocan. Los servicios sin un icono fiable disponible (Yandex, Amazon, Lycos, Marginalia, DevDocs, Wiktionary) muestran sus iniciales en lugar de tomar prestada la marca de otro.

`public/assets/icons.svg.br` es una copia Brotli del sprite. `vite.config.js` la entrega bajo la URL canónica `icons.svg` cuando el navegador admite Brotli, durante `dev` y `preview`. En otro servidor hay que habilitar el equivalente para archivos precomprimidos (por ejemplo `brotli_static on;` en Nginx) manteniendo `icons.svg` como fallback. No enlaces `.br` directamente desde `<use>`.

## Abrir y preguntar con userscript

Algunos servicios de IA no publican un formato URL para enviar prompts, así que solo abren su página. Para enviarlos automáticamente instala Tampermonkey o Violentmonkey, usa **Instalar userscript** y activa **Abrir y preguntar automáticamente**.

El prompt viaja codificado en el fragmento de la URL, que el navegador no envía al servidor, y el userscript lo borra de la dirección en cuanto lo lee. Requiere sesión iniciada en el servicio. Los selectores de los sitios cambian con frecuencia; el script avisa si no encuentra el editor o no logra enviar el mensaje.

### Adjuntos

El botón `＋` de la barra acepta varios archivos. Al enviar a una IA con la automatización activa, los archivos se codifican junto al prompt en el fragmento (`#aiforall2=`, un sobre JSON en base64url) y el userscript 2.0 los sube en el destino: primero asigna los archivos al `input[type=file]` oculto del sitio y dispara `change`, y si no encuentra ninguno sintetiza un evento `paste` con los archivos, que todos estos editores aceptan. Los prompts sin archivos siguen usando el marcador `#aiforall=` original, por lo que el userscript 1.5 continúa funcionando.

Dos límites que conviene conocer:

- El fragmento no es un transporte para binarios grandes: el total va limitado a 1,2 MB y la barra avisa si se supera en lugar de descartar los archivos en silencio.
- Si el sitio expone un `input` de un solo archivo, solo se adjunta el primero y el script lo notifica. Como respaldo cuando el userscript no está instalado, la primera imagen se copia al portapapeles para pegarla a mano.
