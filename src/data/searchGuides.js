import { homeOf } from '../lib/search.js';

const webSyntax = {
  es: [
    ['site:dominio', 'Limitar a un sitio'],
    ['intitle:texto', 'Buscar en el título'],
    ['inurl:ruta', 'Buscar en la URL'],
    ['filetype:pdf', 'Filtrar por archivo'],
    ['"frase exacta"', 'Coincidencia exacta'],
    ['+término', 'Incluir término'],
    ['-término', 'Excluir término']
  ],
  en: [
    ['site:domain', 'Limit to a site'],
    ['intitle:text', 'Search the title'],
    ['inurl:path', 'Search the URL'],
    ['filetype:pdf', 'Filter by file'],
    ['"exact phrase"', 'Exact match'],
    ['+term', 'Include term'],
    ['-term', 'Exclude term']
  ]
};

const translatorSyntax = {
  es: [
    ['[es:en]', 'Origen y destino'],
    ['[auto:es]', 'Detectar el origen'],
    ['selectores', 'Elegir idiomas en el recuadro']
  ],
  en: [
    ['[es:en]', 'Source and target'],
    ['[auto:es]', 'Detect the source'],
    ['selectors', 'Choose languages in the box']
  ]
};

const markdownSyntax = {
  es: [
    ['**negrita**', 'Énfasis fuerte'], ['`código`', 'Código en línea'],
    ['# título', 'Encabezado'], ['> cita', 'Cita'], ['[texto](url)', 'Enlace'], ['- elemento', 'Lista']
  ],
  en: [
    ['**bold**', 'Strong emphasis'], ['`code`', 'Inline code'],
    ['# heading', 'Heading'], ['> quote', 'Quote'], ['[text](url)', 'Link'], ['- item', 'List']
  ]
};

/**
 * Syntax each destination understands natively. Keys are service names; when a
 * service is absent the generic web / markdown syntax is used instead.
 */
const serviceSyntax = {
  WolframAlpha: {
    es: [
      ['Integrate[x^2, x]', 'Integral simbólica'],
      ['D[Sin[x], x]', 'Derivada'],
      ['Solve[x^2 == 4, x]', 'Resolver ecuación'],
      ['Sum[1/n^2, {n,1,Infinity}]', 'Suma con límites'],
      ['Limit[Sin[x]/x, x -> 0]', 'Límite'],
      ['Plot[x^2, {x,-3,3}]', 'Graficar'],
      ['N[Pi, 50]', 'Valor numérico'],
      ['3 km in miles', 'Conversión de unidades']
    ],
    en: [
      ['Integrate[x^2, x]', 'Symbolic integral'],
      ['D[Sin[x], x]', 'Derivative'],
      ['Solve[x^2 == 4, x]', 'Solve an equation'],
      ['Sum[1/n^2, {n,1,Infinity}]', 'Sum with bounds'],
      ['Limit[Sin[x]/x, x -> 0]', 'Limit'],
      ['Plot[x^2, {x,-3,3}]', 'Plot'],
      ['N[Pi, 50]', 'Numeric value'],
      ['3 km in miles', 'Unit conversion']
    ]
  },
  GitHub: {
    es: [
      ['repo:usuario/proyecto', 'Limitar a un repositorio'],
      ['org:nombre', 'Buscar en una organización'],
      ['language:js', 'Filtrar por lenguaje'],
      ['path:src/', 'Buscar en una ruta'],
      ['stars:>500', 'Filtrar por estrellas'],
      ['is:issue is:open', 'Incidencias abiertas']
    ],
    en: [
      ['repo:user/project', 'Limit to a repository'],
      ['org:name', 'Search an organization'],
      ['language:js', 'Filter by language'],
      ['path:src/', 'Search inside a path'],
      ['stars:>500', 'Filter by stars'],
      ['is:issue is:open', 'Open issues']
    ]
  },
  GitLab: {
    es: [
      ['group:nombre', 'Buscar en un grupo'],
      ['project:ruta', 'Limitar a un proyecto'],
      ['language:python', 'Filtrar por lenguaje'],
      ['extension:yml', 'Filtrar por extensión']
    ],
    en: [
      ['group:name', 'Search a group'],
      ['project:path', 'Limit to a project'],
      ['language:python', 'Filter by language'],
      ['extension:yml', 'Filter by extension']
    ]
  },
  'Stack Overflow': {
    es: [
      ['[etiqueta]', 'Filtrar por etiqueta'],
      ['user:12345', 'Preguntas de un usuario'],
      ['score:5', 'Puntuación mínima'],
      ['is:question', 'Solo preguntas'],
      ['answers:0', 'Sin respuestas'],
      ['"frase exacta"', 'Coincidencia exacta']
    ],
    en: [
      ['[tag]', 'Filter by tag'],
      ['user:12345', 'Questions by a user'],
      ['score:5', 'Minimum score'],
      ['is:question', 'Questions only'],
      ['answers:0', 'Unanswered'],
      ['"exact phrase"', 'Exact match']
    ]
  },
  'Stack Exchange': {
    es: [
      ['[etiqueta]', 'Filtrar por etiqueta'],
      ['is:answer', 'Solo respuestas'],
      ['score:10', 'Puntuación mínima'],
      ['inquestion:123', 'Dentro de una pregunta']
    ],
    en: [
      ['[tag]', 'Filter by tag'],
      ['is:answer', 'Answers only'],
      ['score:10', 'Minimum score'],
      ['inquestion:123', 'Within a question']
    ]
  },
  Reddit: {
    es: [
      ['subreddit:nombre', 'Buscar en una comunidad'],
      ['author:usuario', 'Publicaciones de un usuario'],
      ['title:texto', 'Buscar en el título'],
      ['flair:etiqueta', 'Filtrar por flair'],
      ['self:yes', 'Solo publicaciones de texto'],
      ['nsfw:no', 'Excluir contenido adulto']
    ],
    en: [
      ['subreddit:name', 'Search a community'],
      ['author:user', 'Posts by a user'],
      ['title:text', 'Search the title'],
      ['flair:label', 'Filter by flair'],
      ['self:yes', 'Text posts only'],
      ['nsfw:no', 'Exclude adult content']
    ]
  },
  Wikipedia: {
    es: [
      ['intitle:texto', 'Buscar en el título'],
      ['incategory:nombre', 'Dentro de una categoría'],
      ['insource:texto', 'Buscar en el wikitexto'],
      ['prefix:letra', 'Títulos que empiezan por'],
      ['hastemplate:nombre', 'Que usan una plantilla']
    ],
    en: [
      ['intitle:text', 'Search the title'],
      ['incategory:name', 'Within a category'],
      ['insource:text', 'Search the wikitext'],
      ['prefix:letter', 'Titles starting with'],
      ['hastemplate:name', 'Using a template']
    ]
  },
  Scholar: {
    es: [
      ['author:"apellido"', 'Filtrar por autor'],
      ['source:"revista"', 'Filtrar por publicación'],
      ['intitle:texto', 'Buscar en el título'],
      ['"frase exacta"', 'Coincidencia exacta'],
      ['-término', 'Excluir término']
    ],
    en: [
      ['author:"surname"', 'Filter by author'],
      ['source:"journal"', 'Filter by publication'],
      ['intitle:text', 'Search the title'],
      ['"exact phrase"', 'Exact match'],
      ['-term', 'Exclude term']
    ]
  },
  YouTube: {
    es: [
      ['"frase exacta"', 'Coincidencia exacta'],
      ['-término', 'Excluir término'],
      ['canal nombre', 'Buscar un canal'],
      ['filtros en la página', 'Duración, fecha y calidad']
    ],
    en: [
      ['"exact phrase"', 'Exact match'],
      ['-term', 'Exclude term'],
      ['channel name', 'Find a channel'],
      ['on-page filters', 'Duration, date, quality']
    ]
  },
  Twitter: {
    es: [
      ['from:usuario', 'Publicaciones de una cuenta'],
      ['to:usuario', 'Respuestas a una cuenta'],
      ['#etiqueta', 'Buscar un hashtag'],
      ['since:2024-01-01', 'Desde una fecha'],
      ['filter:media', 'Solo con multimedia'],
      ['min_faves:100', 'Mínimo de me gusta']
    ],
    en: [
      ['from:user', 'Posts from an account'],
      ['to:user', 'Replies to an account'],
      ['#tag', 'Search a hashtag'],
      ['since:2024-01-01', 'From a date'],
      ['filter:media', 'With media only'],
      ['min_faves:100', 'Minimum likes']
    ]
  },
  'Hacker News': {
    es: [
      ['author:usuario', 'Envíos de un usuario'],
      ['story:', 'Solo historias'],
      ['comment:', 'Solo comentarios'],
      ['"frase exacta"', 'Coincidencia exacta']
    ],
    en: [
      ['author:user', 'Submissions by a user'],
      ['story:', 'Stories only'],
      ['comment:', 'Comments only'],
      ['"exact phrase"', 'Exact match']
    ]
  },
  Mastodon: {
    es: [
      ['#etiqueta', 'Buscar un hashtag'],
      ['@usuario@servidor', 'Buscar una cuenta'],
      ['"frase exacta"', 'Coincidencia exacta']
    ],
    en: [
      ['#tag', 'Search a hashtag'],
      ['@user@server', 'Find an account'],
      ['"exact phrase"', 'Exact match']
    ]
  },
  Pixiv: {
    es: [
      ['etiqueta', 'La búsqueda usa etiquetas'],
      ['etiqueta1 etiqueta2', 'Combinar etiquetas'],
      ['users入り', 'Popularidad por marcadores']
    ],
    en: [
      ['tag', 'Search works by tag'],
      ['tag1 tag2', 'Combine tags'],
      ['users入り', 'Popularity by bookmarks']
    ]
  },
  Bing: {
    es: [
      ['site:dominio', 'Limitar a un sitio'],
      ['intitle:texto', 'Buscar en el título'],
      ['filetype:pdf', 'Filtrar por archivo'],
      ['ip:1.2.3.4', 'Sitios en una IP'],
      ['contains:mp3', 'Páginas con un tipo de enlace']
    ],
    en: [
      ['site:domain', 'Limit to a site'],
      ['intitle:text', 'Search the title'],
      ['filetype:pdf', 'Filter by file'],
      ['ip:1.2.3.4', 'Sites on an IP'],
      ['contains:mp3', 'Pages linking a file type']
    ]
  },
  Brave: {
    es: [
      ['site:dominio', 'Limitar a un sitio'],
      ['filetype:pdf', 'Filtrar por archivo'],
      ['"frase exacta"', 'Coincidencia exacta'],
      ['-término', 'Excluir término']
    ],
    en: [
      ['site:domain', 'Limit to a site'],
      ['filetype:pdf', 'Filter by file'],
      ['"exact phrase"', 'Exact match'],
      ['-term', 'Exclude term']
    ]
  },
  Kagi: {
    es: [
      ['site:dominio', 'Limitar a un sitio'],
      ['filetype:pdf', 'Filtrar por archivo'],
      ['!bang', 'Bangs propios de Kagi'],
      ['-término', 'Excluir término']
    ],
    en: [
      ['site:domain', 'Limit to a site'],
      ['filetype:pdf', 'Filter by file'],
      ['!bang', "Kagi's own bangs"],
      ['-term', 'Exclude term']
    ]
  },
  Startpage: {
    es: [
      ['site:dominio', 'Limitar a un sitio'],
      ['filetype:pdf', 'Filtrar por archivo'],
      ['"frase exacta"', 'Coincidencia exacta']
    ],
    en: [
      ['site:domain', 'Limit to a site'],
      ['filetype:pdf', 'Filter by file'],
      ['"exact phrase"', 'Exact match']
    ]
  },
  RAE: {
    es: [
      ['palabra', 'Consulta directa del lema'],
      ['sin tildes', 'El diccionario las tolera'],
      ['verbo', 'Incluye la conjugación']
    ],
    en: [
      ['word', 'Looks up the entry directly'],
      ['without accents', 'The dictionary tolerates them'],
      ['verb', 'Includes conjugation']
    ]
  },
  'Sinónimos': {
    es: [['palabra', 'Abre el diccionario de sinónimos'], ['una palabra', 'Funciona mejor con lemas simples']],
    en: [['word', 'Opens the thesaurus entry'], ['single word', 'Works best with simple lemmas']]
  }
};

const serviceFacts = {
  Google: {
    es: ['Google fue fundada en 1998 por Larry Page y Sergey Brin.', 'Organiza resultados web y admite operadores de búsqueda avanzados.'],
    en: ['Google was founded in 1998 by Larry Page and Sergey Brin.', 'It organizes web results and supports advanced search operators.']
  },
  DuckDuckGo: {
    es: ['DuckDuckGo fue lanzado en 2008 por Gabriel Weinberg.', 'Está centrado en la privacidad y no guarda un historial personal de búsquedas.'],
    en: ['DuckDuckGo was launched in 2008 by Gabriel Weinberg.', 'It focuses on privacy and does not retain a personal search history.']
  },
  Kagi: {
    es: ['Kagi fue fundada en 2018 por Vladimir Prelovac en Palo Alto.', 'Es un buscador de pago, sin anuncios y financiado por sus usuarios.'],
    en: ['Kagi was founded in 2018 by Vladimir Prelovac in Palo Alto.', 'It is a paid, ad-free search engine funded by its users.']
  },
  Bing: {
    es: ['Microsoft lanzó Bing en 2009.', 'Combina búsqueda web, imágenes, noticias y funciones asistidas por IA.'],
    en: ['Microsoft launched Bing in 2009.', 'It combines web, image, and news search with AI-assisted features.']
  },
  Yahoo: {
    es: ['Yahoo fue fundada en 1994 por Jerry Yang y David Filo.', 'Su buscador forma parte de un portal de noticias, correo y finanzas.'],
    en: ['Yahoo was founded in 1994 by Jerry Yang and David Filo.', 'Its search engine is part of a news, mail, and finance portal.']
  },
  Ecosia: {
    es: ['Ecosia fue fundada en 2009 por Christian Kroll.', 'Destina sus beneficios a iniciativas climáticas y proyectos de plantación de árboles.'],
    en: ['Ecosia was founded in 2009 by Christian Kroll.', 'It directs its profits toward climate action and tree-planting projects.']
  },
  Qwant: {
    es: ['Qwant fue fundada en Francia en 2011 y se lanzó en 2013.', 'Se presenta como un buscador europeo orientado a la privacidad.'],
    en: ['Qwant was founded in France in 2011 and launched in 2013.', 'It presents itself as a privacy-oriented European search engine.']
  },
  Mojeek: {
    es: ['Mojeek comenzó en 2004 en el Reino Unido.', 'Mantiene su propio índice web y prioriza búsquedas sin seguimiento.'],
    en: ['Mojeek began in 2004 in the United Kingdom.', 'It maintains its own web index and prioritizes tracking-free search.']
  },
  Startpage: {
    es: ['Startpage lanzó su buscador privado en 2006 y tiene sede en los Países Bajos.', 'Ofrece búsqueda web mediante una capa de protección de datos.'],
    en: ['Startpage launched its private search engine in 2006 and is based in the Netherlands.', 'It provides web search through a personal-data protection layer.']
  },
  Yep: {
    es: ['Yep fue lanzado por Ahrefs en 2022.', 'Usa el índice y el rastreador web desarrollados por Ahrefs.'],
    en: ['Yep was launched by Ahrefs in 2022.', 'It uses the web index and crawler developed by Ahrefs.']
  },
  Brave: {
    es: ['Brave Search abrió su beta pública en 2021.', 'Mantiene un índice web propio y ofrece búsqueda con enfoque en privacidad.'],
    en: ['Brave Search entered public beta in 2021.', 'It maintains its own web index and offers privacy-focused search.']
  },
  Wikipedia: {
    es: ['Wikipedia se lanzó en 2001 como una enciclopedia colaborativa.', 'Su contenido es escrito y revisado por voluntarios de todo el mundo.'],
    en: ['Wikipedia launched in 2001 as a collaborative encyclopedia.', 'Its content is written and reviewed by volunteers worldwide.']
  },
  'Google Traductor': {
    es: ['Google Traductor se lanzó en 2006.', 'Permite elegir idiomas de origen y destino mediante !gt[origen:destino].'],
    en: ['Google Translate launched in 2006.', 'Source and target languages can be selected with !gt[source:target].']
  },
  Scholar: {
    es: ['Google Scholar se lanzó en 2004.', 'Busca literatura académica, citas, libros, tesis y publicaciones.'],
    en: ['Google Scholar launched in 2004.', 'It searches scholarly literature, citations, books, theses, and publications.']
  },
  GitHub: {
    es: ['GitHub fue fundada en 2008.', 'Aloja repositorios Git, código, incidencias y proyectos de software.'],
    en: ['GitHub was founded in 2008.', 'It hosts Git repositories, code, issues, and software projects.']
  },
  GitLab: {
    es: ['GitLab comenzó como proyecto de código abierto en 2011.', 'Integra repositorios Git con planificación, CI/CD y operaciones.'],
    en: ['GitLab began as an open-source project in 2011.', 'It combines Git repositories with planning, CI/CD, and operations.']
  },
  'Stack Overflow': {
    es: ['Stack Overflow se lanzó en 2008.', 'Es una comunidad de preguntas y respuestas para programación.'],
    en: ['Stack Overflow launched in 2008.', 'It is a programming questions-and-answers community.']
  },
  Reddit: {
    es: ['Reddit fue fundada en 2005.', 'Organiza enlaces y conversaciones en comunidades temáticas.'],
    en: ['Reddit was founded in 2005.', 'It organizes links and conversations into topic-based communities.']
  },
  YouTube: {
    es: ['YouTube fue fundada en 2005.', 'Permite buscar videos, canales, transmisiones y listas de reproducción.'],
    en: ['YouTube was founded in 2005.', 'It searches videos, channels, live streams, and playlists.']
  },
  WolframAlpha: {
    es: ['Wolfram|Alpha se lanzó en 2009.', 'Calcula respuestas a partir de datos estructurados en lugar de listar páginas.'],
    en: ['Wolfram|Alpha launched in 2009.', 'It computes answers from structured data rather than listing webpages.']
  },
  RAE: {
    es: ['La Real Academia Española fue fundada en 1713.', 'Consulta definiciones y usos normativos del Diccionario de la lengua española.'],
    en: ['The Royal Spanish Academy was founded in 1713.', 'It provides definitions and standard usage from its Spanish dictionary.']
  },
  'Sinónimos': {
    es: ['WordReference funciona en la web desde 1999.', 'Esta búsqueda abre directamente su diccionario de sinónimos en español.'],
    en: ['WordReference has operated on the web since 1999.', 'This search opens its Spanish thesaurus directly.']
  },
  ChatGPT: {
    es: ['OpenAI lanzó ChatGPT en 2022.', 'Acepta prompts con Markdown y conserva bloques de código y listas.'],
    en: ['OpenAI launched ChatGPT in 2022.', 'It accepts Markdown prompts and preserves code blocks and lists.']
  },
  Claude: {
    es: ['Anthropic lanzó Claude en 2023.', 'Está orientado a conversación, análisis, escritura y programación.'],
    en: ['Anthropic launched Claude in 2023.', 'It supports conversation, analysis, writing, and programming.']
  },
  Gemini: {
    es: ['Google presentó Gemini en 2023.', 'Es un asistente multimodal para texto, código e investigación.'],
    en: ['Google introduced Gemini in 2023.', 'It is a multimodal assistant for text, code, and research.']
  },
  Grok: {
    es: ['xAI lanzó Grok en 2023.', 'Es un asistente conversacional con herramientas de búsqueda y razonamiento.'],
    en: ['xAI launched Grok in 2023.', 'It is a conversational assistant with search and reasoning tools.']
  },
  DeepSeek: {
    es: ['DeepSeek fue fundada en 2023.', 'Desarrolla modelos orientados a razonamiento, código y conversación.'],
    en: ['DeepSeek was founded in 2023.', 'It develops models for reasoning, coding, and conversation.']
  },
  'Le Chat': {
    es: ['Mistral AI fue fundada en 2023 y desarrolla Le Chat.', 'El asistente admite conversación, documentos y tareas de código.'],
    en: ['Mistral AI was founded in 2023 and develops Le Chat.', 'The assistant supports conversation, documents, and coding tasks.']
  },
  Perplexity: {
    es: ['Perplexity fue fundada en 2022.', 'Combina búsqueda web con respuestas generadas y enlaces a fuentes.'],
    en: ['Perplexity was founded in 2022.', 'It combines web search with generated answers and source links.']
  },
  Swisscows: {
    es: ['Swisscows opera desde Suiza desde 2014.', 'Ofrece búsqueda anónima y filtra contenido para familias.'],
    en: ['Swisscows has operated from Switzerland since 2014.', 'It offers anonymous search with family-friendly filtering.']
  },
  MetaCrawler: {
    es: ['MetaCrawler nació en 1994 en la Universidad de Washington.', 'Es un metabuscador: combina resultados de varios motores.'],
    en: ['MetaCrawler started in 1994 at the University of Washington.', 'It is a metasearch engine combining results from several sources.']
  },
  AOL: {
    es: ['AOL fue fundada en 1985 y popularizó el acceso doméstico a internet.', 'Su buscador se apoya hoy en resultados de terceros.'],
    en: ['AOL was founded in 1985 and popularized home internet access.', 'Its search today relies on third-party results.']
  },
  Facebook: {
    es: ['Facebook fue fundada en 2004 por Mark Zuckerberg.', 'La búsqueda cubre publicaciones, personas, páginas y grupos.'],
    en: ['Facebook was founded in 2004 by Mark Zuckerberg.', 'Search covers posts, people, pages, and groups.']
  },
  Twitter: {
    es: ['Twitter se lanzó en 2006 y pasó a llamarse X en 2023.', 'Admite operadores como from:, since: y filter: para acotar publicaciones.'],
    en: ['Twitter launched in 2006 and was renamed X in 2023.', 'It supports operators such as from:, since:, and filter: to narrow posts.']
  },
  Instagram: {
    es: ['Instagram se lanzó en 2010 y fue adquirida por Facebook en 2012.', 'La búsqueda se organiza por cuentas, etiquetas y lugares.'],
    en: ['Instagram launched in 2010 and was acquired by Facebook in 2012.', 'Search is organized by accounts, tags, and places.']
  },
  Pinterest: {
    es: ['Pinterest se lanzó en 2010.', 'Funciona como un tablero visual de ideas y referencias.'],
    en: ['Pinterest launched in 2010.', 'It works as a visual board of ideas and references.']
  },
  Tumblr: {
    es: ['Tumblr fue fundada en 2007 por David Karp.', 'Mezcla blogging corto con seguimiento por etiquetas.'],
    en: ['Tumblr was founded in 2007 by David Karp.', 'It blends short-form blogging with tag-based discovery.']
  },
  DeviantArt: {
    es: ['DeviantArt se lanzó en 2000.', 'Es una de las comunidades de arte digital más antiguas en activo.'],
    en: ['DeviantArt launched in 2000.', 'It is one of the oldest active digital-art communities.']
  },
  Imgur: {
    es: ['Imgur fue creada en 2009 por Alan Schaaf.', 'Nació como alojamiento de imágenes para Reddit y creció como comunidad propia.'],
    en: ['Imgur was created in 2009 by Alan Schaaf.', 'It began as image hosting for Reddit and grew its own community.']
  },
  Flickr: {
    es: ['Flickr se lanzó en 2004.', 'Conserva un archivo fotográfico amplio con licencias Creative Commons.'],
    en: ['Flickr launched in 2004.', 'It keeps a broad photo archive with Creative Commons licensing.']
  },
  PNGegg: {
    es: ['PNGegg reúne imágenes con fondo transparente.', 'Útil para buscar recortes en PNG listos para composición.'],
    en: ['PNGegg collects images with transparent backgrounds.', 'Useful for finding ready-to-compose PNG cutouts.']
  },
  Twitch: {
    es: ['Twitch se lanzó en 2011 y fue adquirida por Amazon en 2014.', 'La búsqueda cubre canales, categorías y directos.'],
    en: ['Twitch launched in 2011 and was acquired by Amazon in 2014.', 'Search covers channels, categories, and live streams.']
  },
  Vimeo: {
    es: ['Vimeo fue fundada en 2004.', 'Está orientada a video de autor y trabajo audiovisual profesional.'],
    en: ['Vimeo was founded in 2004.', 'It focuses on creator-driven and professional video work.']
  },
  'Nico Nico': {
    es: ['Niconico se lanzó en Japón en 2006.', 'Es conocida por superponer comentarios sincronizados sobre el video.'],
    en: ['Niconico launched in Japan in 2006.', 'It is known for overlaying time-synced comments on video.']
  },
  Pixiv: {
    es: ['Pixiv se lanzó en Japón en 2007.', 'La búsqueda funciona por etiquetas, a menudo en japonés.'],
    en: ['Pixiv launched in Japan in 2007.', 'Search works through tags, often in Japanese.']
  },
  Zerochan: {
    es: ['Zerochan es un archivo de ilustración anime en alta resolución.', 'Organiza el material por series y personajes.'],
    en: ['Zerochan is a high-resolution anime artwork archive.', 'It organizes material by series and characters.']
  },
  AnimeFLV: {
    es: ['AnimeFLV es un catálogo de anime en español.', 'La búsqueda localiza series por título.'],
    en: ['AnimeFLV is a Spanish-language anime catalog.', 'Search locates series by title.']
  },
  Quora: {
    es: ['Quora fue fundada en 2009 por antiguos empleados de Facebook.', 'Reúne preguntas abiertas y respuestas de la comunidad.'],
    en: ['Quora was founded in 2009 by former Facebook employees.', 'It gathers open questions and community answers.']
  },
  Medium: {
    es: ['Medium fue fundada en 2012 por Ev Williams.', 'Publica artículos de autor sobre tecnología, diseño y negocio.'],
    en: ['Medium was founded in 2012 by Ev Williams.', 'It publishes author-driven articles on tech, design, and business.']
  },
  Mastodon: {
    es: ['Mastodon se lanzó en 2016 como red descentralizada.', 'Cada servidor es independiente y federa con el resto.'],
    en: ['Mastodon launched in 2016 as a decentralized network.', 'Each server is independent and federates with the rest.']
  },
  'Hacker News': {
    es: ['Hacker News fue creada por Y Combinator en 2007.', 'Esta búsqueda usa el índice de Algolia sobre historias y comentarios.'],
    en: ['Hacker News was created by Y Combinator in 2007.', "This search uses Algolia's index over stories and comments."]
  },
  'Stack Exchange': {
    es: ['Stack Exchange amplió el modelo de Stack Overflow desde 2009.', 'Agrupa cientos de comunidades temáticas de preguntas y respuestas.'],
    en: ['Stack Exchange expanded the Stack Overflow model from 2009.', 'It groups hundreds of topic-specific Q&A communities.']
  },
  WhatsApp: {
    es: ['WhatsApp fue fundada en 2009 y adquirida por Facebook en 2014.', 'Este acceso abre WhatsApp Web en el navegador.'],
    en: ['WhatsApp was founded in 2009 and acquired by Facebook in 2014.', 'This shortcut opens WhatsApp Web in the browser.']
  },
  Telegram: {
    es: ['Telegram fue lanzada en 2013 por Pavel y Nikolai Durov.', 'Este acceso abre Telegram Web en el navegador.'],
    en: ['Telegram launched in 2013 by Pavel and Nikolai Durov.', 'This shortcut opens Telegram Web in the browser.']
  },
  'Microsoft Copilot': {
    es: ['Microsoft presentó Copilot en 2023.', 'Integra asistencia conversacional con búsqueda y ofimática.'],
    en: ['Microsoft introduced Copilot in 2023.', 'It integrates conversational assistance with search and productivity apps.']
  },
  Poe: {
    es: ['Poe fue lanzada por Quora en 2022.', 'Reúne varios modelos de distintos proveedores en una sola interfaz.'],
    en: ['Poe was launched by Quora in 2022.', 'It gathers models from several providers in one interface.']
  },
  HuggingChat: {
    es: ['HuggingChat es el asistente abierto de Hugging Face, lanzado en 2023.', 'Ejecuta modelos de código abierto de la comunidad.'],
    en: ['HuggingChat is Hugging Face\'s open assistant, launched in 2023.', 'It runs open-source community models.']
  },
  'Kagi Assistant': {
    es: ['Kagi Assistant acompaña al buscador de pago de Kagi.', 'Combina modelos de lenguaje con resultados web verificables.'],
    en: ['Kagi Assistant accompanies Kagi\'s paid search engine.', 'It pairs language models with verifiable web results.']
  },
  Yandex: {
    es: ['Yandex fue fundada en Rusia en 1997.', 'Es el buscador web más usado en el mercado ruso.'],
    en: ['Yandex was founded in Russia in 1997.', 'It is the most used web search engine in the Russian market.']
  },
  Baidu: {
    es: ['Baidu fue fundada en China en 2000.', 'Es el buscador dominante en el mercado chino.'],
    en: ['Baidu was founded in China in 2000.', 'It is the dominant search engine in the Chinese market.']
  },
  Naver: {
    es: ['Naver se lanzó en Corea del Sur en 1999.', 'Combina búsqueda web con noticias, blogs y contenido local.'],
    en: ['Naver launched in South Korea in 1999.', 'It combines web search with news, blogs, and local content.']
  },
  SearXNG: {
    es: ['SearXNG es un metabuscador de código abierto derivado de searx.', 'Combina resultados de varios motores sin rastrear al usuario.'],
    en: ['SearXNG is an open-source metasearch engine forked from searx.', 'It combines results from many engines without tracking the user.']
  },
  Marginalia: {
    es: ['Marginalia Search es un motor independiente lanzado en 2021.', 'Prioriza páginas pequeñas y de texto frente a los grandes sitios comerciales.'],
    en: ['Marginalia Search is an independent engine launched in 2021.', 'It favors small, text-heavy pages over large commercial sites.']
  },
  Lycos: {
    es: ['Lycos fue uno de los primeros buscadores web, lanzado en 1994.', 'Hoy combina resultados de otros proveedores bajo su propia marca.'],
    en: ['Lycos was one of the earliest web search engines, launched in 1994.', "It now blends other providers' results under its own brand."]
  },
  'Google Images': {
    es: ['Google Images se lanzó en 2001.', 'Busca imágenes en la web filtrando por tamaño, color y licencia.'],
    en: ['Google Images launched in 2001.', 'It searches images across the web with filters for size, color, and license.']
  },
  Unsplash: {
    es: ['Unsplash se lanzó en 2013.', 'Ofrece fotografías de alta calidad de uso libre para proyectos.'],
    en: ['Unsplash launched in 2013.', 'It offers high-quality photos free to use in projects.']
  },
  Pexels: {
    es: ['Pexels se lanzó en 2014.', 'Reúne fotos y videos de stock gratuitos para cualquier uso.'],
    en: ['Pexels launched in 2014.', 'It provides free stock photos and videos for any use.']
  },
  'Google Maps': {
    es: ['Google Maps se lanzó en 2005.', 'Ofrece mapas, rutas y datos de lugares en todo el mundo.'],
    en: ['Google Maps launched in 2005.', 'It provides maps, directions, and place data worldwide.']
  },
  OpenStreetMap: {
    es: ['OpenStreetMap se fundó en 2004 como mapa colaborativo.', 'Su cartografía es editada libremente por voluntarios.'],
    en: ['OpenStreetMap was founded in 2004 as a collaborative map.', 'Its cartography is freely edited by volunteers.']
  },
  Wiktionary: {
    es: ['Wiktionary se lanzó en 2002 como diccionario colaborativo.', 'Cubre definiciones, etimología y traducciones en muchos idiomas.'],
    en: ['Wiktionary launched in 2002 as a collaborative dictionary.', 'It covers definitions, etymology, and translations across many languages.']
  },
  'Internet Archive': {
    es: ['Internet Archive fue fundado en 1996 por Brewster Kahle.', 'Conserva sitios web, libros, audio y software antiguos.'],
    en: ['Internet Archive was founded in 1996 by Brewster Kahle.', 'It preserves old websites, books, audio, and software.']
  },
  arXiv: {
    es: ['arXiv se lanzó en 1991 en la Universidad de Cornell.', 'Distribuye preprints de física, matemáticas, informática y otras ciencias.'],
    en: ['arXiv launched in 1991 at Cornell University.', 'It distributes preprints in physics, math, computer science, and more.']
  },
  PubMed: {
    es: ['PubMed lo mantiene la Biblioteca Nacional de Medicina de EE. UU. desde 1996.', 'Indexa artículos biomédicos y de ciencias de la vida.'],
    en: ['PubMed has been maintained by the US National Library of Medicine since 1996.', 'It indexes biomedical and life-sciences articles.']
  },
  'Semantic Scholar': {
    es: ['Semantic Scholar lo lanzó el Allen Institute for AI en 2015.', 'Usa IA para resumir y relacionar literatura académica.'],
    en: ['Semantic Scholar was launched by the Allen Institute for AI in 2015.', 'It uses AI to summarize and connect academic literature.']
  },
  MDN: {
    es: ['MDN Web Docs lo mantiene Mozilla desde 2005.', 'Es la referencia principal de HTML, CSS y JavaScript.'],
    en: ['MDN Web Docs has been maintained by Mozilla since 2005.', 'It is the primary reference for HTML, CSS, and JavaScript.']
  },
  DevDocs: {
    es: ['DevDocs reúne documentación de muchos lenguajes en un solo lugar.', 'Permite buscar API y referencias sin cambiar de pestaña.'],
    en: ['DevDocs gathers documentation for many languages in one place.', 'It lets you search APIs and references without switching tabs.']
  },
  npm: {
    es: ['npm se lanzó en 2010 como gestor de paquetes de Node.js.', 'Es el registro de paquetes JavaScript más grande.'],
    en: ['npm launched in 2010 as the Node.js package manager.', 'It is the largest JavaScript package registry.']
  },
  PyPI: {
    es: ['PyPI es el índice oficial de paquetes de Python desde 2003.', 'Aloja bibliotecas que se instalan con pip.'],
    en: ['PyPI has been the official Python package index since 2003.', 'It hosts libraries installed with pip.']
  },
  'crates.io': {
    es: ['crates.io es el registro oficial de paquetes de Rust.', 'Aloja las cajas (crates) que se instalan con Cargo.'],
    en: ['crates.io is the official Rust package registry.', 'It hosts the crates installed with Cargo.']
  },
  'Docker Hub': {
    es: ['Docker Hub se lanzó junto a Docker en 2013.', 'Es el registro público más usado de imágenes de contenedores.'],
    en: ['Docker Hub launched alongside Docker in 2013.', 'It is the most used public registry for container images.']
  },
  'Arch Wiki': {
    es: ['La Arch Wiki documenta Arch Linux desde 2006.', 'Es referencia habitual incluso para usuarios de otras distribuciones.'],
    en: ['The Arch Wiki has documented Arch Linux since 2006.', 'It is a common reference even for users of other distributions.']
  },
  AUR: {
    es: ['El AUR (Arch User Repository) reúne paquetes creados por la comunidad.', 'Se instalan mediante scripts PKGBUILD compilados localmente.'],
    en: ['The AUR (Arch User Repository) gathers community-built packages.', 'They are installed via PKGBUILD scripts compiled locally.']
  },
  'Hugging Face': {
    es: ['Hugging Face se fundó en 2016.', 'Aloja modelos, datasets y demos de aprendizaje automático.'],
    en: ['Hugging Face was founded in 2016.', 'It hosts machine-learning models, datasets, and demos.']
  },
  IMDb: {
    es: ['IMDb se creó en 1990 y fue adquirida por Amazon en 1998.', 'Es la base de datos de cine y televisión más consultada.'],
    en: ['IMDb was created in 1990 and acquired by Amazon in 1998.', 'It is the most consulted film and TV database.']
  },
  Letterboxd: {
    es: ['Letterboxd se lanzó en 2011.', 'Es una red social para registrar y reseñar películas vistas.'],
    en: ['Letterboxd launched in 2011.', 'It is a social network for logging and reviewing films watched.']
  },
  MyAnimeList: {
    es: ['MyAnimeList se fundó en 2004.', 'Es una de las bases de datos y comunidades de anime más grandes.'],
    en: ['MyAnimeList was founded in 2004.', 'It is one of the largest anime databases and communities.']
  },
  AniList: {
    es: ['AniList se lanzó en 2013 como alternativa a otros catálogos de anime.', 'Combina base de datos, listas de seguimiento y comunidad.'],
    en: ['AniList launched in 2013 as an alternative anime cataloging site.', 'It combines a database, tracking lists, and community.']
  },
  Spotify: {
    es: ['Spotify se lanzó en Suecia en 2008.', 'Es un servicio de streaming de música y podcasts por suscripción.'],
    en: ['Spotify launched in Sweden in 2008.', 'It is a subscription-based music and podcast streaming service.']
  },
  SoundCloud: {
    es: ['SoundCloud se fundó en 2007 en Berlín.', 'Permite a artistas independientes publicar música directamente.'],
    en: ['SoundCloud was founded in 2007 in Berlin.', 'It lets independent artists publish music directly.']
  },
  Bandcamp: {
    es: ['Bandcamp se lanzó en 2008.', 'Vende música directamente de artistas independientes y sellos pequeños.'],
    en: ['Bandcamp launched in 2008.', 'It sells music directly from independent artists and small labels.']
  },
  Genius: {
    es: ['Genius se fundó en 2009 como anotador de letras.', 'Reúne letras de canciones junto a explicaciones de la comunidad.'],
    en: ['Genius was founded in 2009 as a lyrics annotation site.', 'It pairs song lyrics with community explanations.']
  },
  Goodreads: {
    es: ['Goodreads se lanzó en 2007 y fue adquirida por Amazon en 2013.', 'Es una red social para reseñar libros y llevar listas de lectura.'],
    en: ['Goodreads launched in 2007 and was acquired by Amazon in 2013.', 'It is a social network for reviewing books and tracking reading lists.']
  },
  Amazon: {
    es: ['Amazon fue fundada en 1994 por Jeff Bezos.', 'Es el mayor minorista en línea del mundo.'],
    en: ['Amazon was founded in 1994 by Jeff Bezos.', 'It is the largest online retailer in the world.']
  },
  eBay: {
    es: ['eBay fue fundada en 1995.', 'Popularizó las subastas y ventas entre particulares en línea.'],
    en: ['eBay was founded in 1995.', 'It popularized online auctions and person-to-person sales.']
  },
  AliExpress: {
    es: ['AliExpress lo lanzó Alibaba en 2010.', 'Conecta compradores internacionales con fabricantes chinos.'],
    en: ['AliExpress was launched by Alibaba in 2010.', 'It connects international buyers with Chinese manufacturers.']
  },
  Etsy: {
    es: ['Etsy se fundó en 2005.', 'Es un mercado para artículos hechos a mano, vintage y de diseño.'],
    en: ['Etsy was founded in 2005.', 'It is a marketplace for handmade, vintage, and craft goods.']
  },
  'Google News': {
    es: ['Google News se lanzó en 2002.', 'Agrupa noticias de miles de medios por tema y relevancia.'],
    en: ['Google News launched in 2002.', 'It aggregates news from thousands of outlets by topic and relevance.']
  },
  Wikidata: {
    es: ['Wikidata se lanzó en 2012 como base de conocimiento estructurada.', 'Almacena datos que alimentan a Wikipedia y otros proyectos Wikimedia.'],
    en: ['Wikidata launched in 2012 as a structured knowledge base.', 'It stores data that feeds Wikipedia and other Wikimedia projects.']
  },
  'Wikimedia Commons': {
    es: ['Wikimedia Commons se lanzó en 2004.', 'Aloja medios de libre uso: imágenes, audio y video.'],
    en: ['Wikimedia Commons launched in 2004.', 'It hosts freely usable media: images, audio, and video.']
  },
  Wikibooks: {
    es: ['Wikibooks se lanzó en 2003.', 'Reúne libros de texto y manuales editados de forma colaborativa.'],
    en: ['Wikibooks launched in 2003.', 'It gathers collaboratively edited textbooks and manuals.']
  },
  Openverse: {
    es: ['Openverse lo mantiene WordPress desde 2021.', 'Busca imágenes y audio con licencias abiertas o de dominio público.'],
    en: ['Openverse has been maintained by WordPress since 2021.', 'It searches openly licensed or public-domain images and audio.']
  },
  ResearchGate: {
    es: ['ResearchGate se fundó en 2008.', 'Es una red social para investigadores que compartan artículos.'],
    en: ['ResearchGate was founded in 2008.', 'It is a social network for researchers to share papers.']
  },
  'IEEE Xplore': {
    es: ['IEEE Xplore lo mantiene el IEEE desde 2000.', 'Indexa artículos, normas y actas de conferencias de ingeniería.'],
    en: ['IEEE Xplore has been maintained by the IEEE since 2000.', 'It indexes engineering papers, standards, and conference proceedings.']
  },
  Zenodo: {
    es: ['Zenodo lo opera el CERN desde 2013.', 'Aloja datos e investigación abierta de cualquier disciplina.'],
    en: ['Zenodo has been operated by CERN since 2013.', 'It hosts open research data and outputs from any discipline.']
  },
  'Papers with Code': {
    es: ['Papers with Code se lanzó en 2018.', 'Vincula artículos de aprendizaje automático con su código e implementación.'],
    en: ['Papers with Code launched in 2018.', 'It links machine-learning papers to their code and implementation.']
  },
  Kaggle: {
    es: ['Kaggle se fundó en 2010 y fue adquirida por Google en 2017.', 'Ofrece datasets, cuadernos y competiciones de ciencia de datos.'],
    en: ['Kaggle was founded in 2010 and acquired by Google in 2017.', 'It offers datasets, notebooks, and data-science competitions.']
  },
  Codeberg: {
    es: ['Codeberg lo opera una cooperativa sin ánimo de lucro desde 2019.', 'Aloja repositorios Git basados en software libre.'],
    en: ['Codeberg has been run by a non-profit cooperative since 2019.', 'It hosts Git repositories built on free software.']
  },
  Bitbucket: {
    es: ['Bitbucket fue lanzada en 2008 y adquirida por Atlassian en 2010.', 'Aloja repositorios Git integrados con Jira y otras herramientas.'],
    en: ['Bitbucket launched in 2008 and was acquired by Atlassian in 2010.', 'It hosts Git repositories integrated with Jira and other tools.']
  },
  SourceForge: {
    es: ['SourceForge se lanzó en 1999.', 'Fue uno de los primeros grandes repositorios de software libre.'],
    en: ['SourceForge launched in 1999.', 'It was one of the earliest major open-source software repositories.']
  },
  Packagist: {
    es: ['Packagist es el registro principal de paquetes de Composer para PHP.', 'Se lanzó en 2012 junto al ecosistema de Composer.'],
    en: ['Packagist is the main package registry for PHP Composer.', 'It launched in 2012 alongside the Composer ecosystem.']
  },
  RubyGems: {
    es: ['RubyGems es el gestor de paquetes oficial de Ruby desde 2004.', 'Aloja las bibliotecas (gemas) que se instalan con el comando gem.'],
    en: ['RubyGems has been the official Ruby package manager since 2004.', 'It hosts the gems installed with the gem command.']
  },
  NuGet: {
    es: ['NuGet es el gestor de paquetes oficial de .NET desde 2010.', 'Distribuye bibliotecas que se instalan desde Visual Studio o la CLI.'],
    en: ['NuGet has been the official .NET package manager since 2010.', 'It distributes libraries installed via Visual Studio or the CLI.']
  },
  'Maven Central': {
    es: ['Maven Central es el repositorio principal de paquetes Java.', 'Distribuye las dependencias que usan Maven y Gradle.'],
    en: ['Maven Central is the main repository for Java packages.', 'It distributes the dependencies used by Maven and Gradle.']
  },
  'Go Packages': {
    es: ['pkg.go.dev indexa módulos públicos de Go desde 2019.', 'Muestra documentación generada automáticamente de cada paquete.'],
    en: ['pkg.go.dev has indexed public Go modules since 2019.', 'It shows auto-generated documentation for each package.']
  },
  Homebrew: {
    es: ['Homebrew se lanzó en 2009 para macOS y luego Linux.', 'Es el gestor de paquetes de línea de comandos más popular en macOS.'],
    en: ['Homebrew launched in 2009 for macOS and later Linux.', 'It is the most popular command-line package manager on macOS.']
  },
  Flathub: {
    es: ['Flathub es la tienda principal de aplicaciones Flatpak desde 2018.', 'Distribuye apps de Linux en un formato aislado por sandbox.'],
    en: ['Flathub has been the main Flatpak app store since 2018.', 'It distributes Linux apps in a sandboxed format.']
  },
  Snapcraft: {
    es: ['Snapcraft es la tienda de paquetes snap desarrollada por Canonical.', 'Distribuye aplicaciones empaquetadas con sus dependencias incluidas.'],
    en: ['Snapcraft is the snap package store built by Canonical.', 'It distributes applications bundled with their dependencies.']
  },
  'Nix Packages': {
    es: ['El buscador de paquetes Nix indexa el repositorio de Nixpkgs.', 'Nix permite instalaciones reproducibles y reversibles.'],
    en: ['The Nix package search indexes the Nixpkgs repository.', 'Nix enables reproducible, reversible installations.']
  },
  'Debian Packages': {
    es: ['El buscador de paquetes de Debian indexa su archivo oficial.', 'Debian es una de las distribuciones Linux más antiguas, desde 1993.'],
    en: ["Debian's package search indexes its official archive.", 'Debian is one of the oldest Linux distributions, dating to 1993.']
  },
  'Ubuntu Packages': {
    es: ['El buscador de paquetes de Ubuntu indexa sus repositorios oficiales.', 'Ubuntu se basa en Debian y se lanzó en 2004.'],
    en: ["Ubuntu's package search indexes its official repositories.", 'Ubuntu is based on Debian and launched in 2004.']
  },
  CodeSandbox: {
    es: ['CodeSandbox se lanzó en 2017.', 'Es un entorno de desarrollo web instantáneo en el navegador.'],
    en: ['CodeSandbox launched in 2017.', 'It is an instant, browser-based web development environment.']
  },
  'Product Hunt': {
    es: ['Product Hunt se fundó en 2013.', 'Es una comunidad donde se descubren y votan productos nuevos cada día.'],
    en: ['Product Hunt was founded in 2013.', 'It is a community for discovering and voting on new products daily.']
  },
  'DEV Community': {
    es: ['DEV se lanzó en 2016 como red social para programadores.', 'Publica artículos técnicos abiertos escritos por la comunidad.'],
    en: ['DEV launched in 2016 as a social network for programmers.', 'It publishes open technical articles written by the community.']
  },
  Hashnode: {
    es: ['Hashnode se fundó en 2018 como plataforma de blogging para desarrolladores.', 'Permite publicar en un dominio propio sin gestionar infraestructura.'],
    en: ['Hashnode was founded in 2018 as a blogging platform for developers.', 'It lets you publish on your own domain without managing infrastructure.']
  },
  Substack: {
    es: ['Substack se lanzó en 2017.', 'Permite publicar boletines por correo con modelo de suscripción.'],
    en: ['Substack launched in 2017.', 'It lets writers publish email newsletters with a subscription model.']
  },
  Threads: {
    es: ['Threads lo lanzó Meta en 2023 como red de texto vinculada a Instagram.', 'Compite directamente con el formato de publicaciones cortas de X.'],
    en: ['Threads was launched by Meta in 2023 as a text network tied to Instagram.', "It competes directly with X's short-post format."]
  },
  Bluesky: {
    es: ['Bluesky se abrió al público en 2023.', 'Usa el protocolo AT, descentralizado, en lugar de un servidor único.'],
    en: ['Bluesky opened to the public in 2023.', 'It runs on the decentralized AT Protocol rather than a single server.']
  },
  Lemmy: {
    es: ['Lemmy se lanzó en 2019 como alternativa federada a Reddit.', 'Cada instancia es independiente y se conecta con las demás.'],
    en: ['Lemmy launched in 2019 as a federated alternative to Reddit.', 'Each instance is independent and connects with the others.']
  },
  Steam: {
    es: ['Steam lo lanzó Valve en 2003.', 'Es la plataforma de distribución de videojuegos para PC más grande.'],
    en: ['Steam was launched by Valve in 2003.', 'It is the largest PC game distribution platform.']
  },
  GOG: {
    es: ['GOG (Good Old Games) se lanzó en 2008.', 'Vende videojuegos sin gestión de derechos digitales (DRM).'],
    en: ['GOG (Good Old Games) launched in 2008.', 'It sells video games without digital rights management (DRM).']
  },
  'itch.io': {
    es: ['itch.io se lanzó en 2013.', 'Es un mercado abierto para juegos independientes y experimentales.'],
    en: ['itch.io launched in 2013.', 'It is an open marketplace for independent and experimental games.']
  },
  PCGamingWiki: {
    es: ['PCGamingWiki documenta el rendimiento y ajustes técnicos de juegos en PC.', 'La mantiene una comunidad de jugadores desde 2011.'],
    en: ['PCGamingWiki documents PC game performance and technical fixes.', 'It has been maintained by a community of players since 2011.']
  },
  Kick: {
    es: ['Kick se lanzó en 2022 como alternativa a Twitch.', 'Ofrece streaming en directo con reparto de ingresos distinto al de sus competidores.'],
    en: ['Kick launched in 2022 as an alternative to Twitch.', 'It offers live streaming with a different revenue split than its competitors.']
  },
  Odysee: {
    es: ['Odysee se lanzó en 2020 sobre la red LBRY.', 'Es una plataforma de video que usa tecnología blockchain para el almacenamiento.'],
    en: ['Odysee launched in 2020 on top of the LBRY network.', 'It is a video platform using blockchain technology for storage.']
  },
  PeerTube: {
    es: ['PeerTube lo desarrolla Framasoft desde 2018.', 'Es software libre para alojar video federado entre instancias.'],
    en: ['PeerTube has been developed by Framasoft since 2018.', 'It is free software for hosting video federated across instances.']
  },
  Dailymotion: {
    es: ['Dailymotion se fundó en Francia en 2005.', 'Es una plataforma de video con fuerte presencia europea.'],
    en: ['Dailymotion was founded in France in 2005.', 'It is a video platform with a strong European presence.']
  },
  Bilibili: {
    es: ['Bilibili se lanzó en China en 2009.', 'Combina video, anime y comentarios superpuestos en tiempo real.'],
    en: ['Bilibili launched in China in 2009.', 'It combines video, anime, and real-time overlaid comments.']
  },
  'Rotten Tomatoes': {
    es: ['Rotten Tomatoes se fundó en 1998.', 'Agrega reseñas de críticos y audiencia para dar una puntuación de consenso.'],
    en: ['Rotten Tomatoes was founded in 1998.', 'It aggregates critic and audience reviews into a consensus score.']
  },
  Metacritic: {
    es: ['Metacritic se lanzó en 2001.', 'Resume reseñas de cine, música y videojuegos en una puntuación ponderada.'],
    en: ['Metacritic launched in 2001.', 'It summarizes film, music, and game reviews into a weighted score.']
  },
  TMDB: {
    es: ['TMDB (The Movie Database) se lanzó en 2008.', 'Es una base de datos colaborativa de cine y televisión.'],
    en: ['TMDB (The Movie Database) launched in 2008.', 'It is a collaborative film and TV database.']
  },
  'Last.fm': {
    es: ['Last.fm se lanzó en 2002.', 'Registra el historial de escucha y recomienda música según los hábitos del usuario.'],
    en: ['Last.fm launched in 2002.', "It tracks listening history and recommends music based on the user's habits."]
  },
  Discogs: {
    es: ['Discogs se fundó en 2000.', 'Es una base de datos y mercado de discos físicos gestionada por la comunidad.'],
    en: ['Discogs was founded in 2000.', 'It is a community-run database and marketplace for physical records.']
  },
  MusicBrainz: {
    es: ['MusicBrainz se lanzó en 2000 como enciclopedia musical abierta.', 'Sus datos alimentan a muchas apps de reconocimiento e identificación musical.'],
    en: ['MusicBrainz launched in 2000 as an open music encyclopedia.', 'Its data feeds many music recognition and identification apps.']
  },
  Deezer: {
    es: ['Deezer se lanzó en Francia en 2007.', 'Es un servicio de streaming de música por suscripción.'],
    en: ['Deezer launched in France in 2007.', 'It is a subscription-based music streaming service.']
  },
  Tidal: {
    es: ['Tidal se lanzó en 2014.', 'Se centra en audio de alta fidelidad y pagos a artistas.'],
    en: ['Tidal launched in 2014.', 'It focuses on high-fidelity audio and artist payouts.']
  },
  'Apple Music': {
    es: ['Apple Music se lanzó en 2015.', 'Es el servicio de streaming musical por suscripción de Apple.'],
    en: ["Apple Music launched in 2015.", "It is Apple's subscription music streaming service."]
  },
  'YouTube Music': {
    es: ['YouTube Music se lanzó en 2018.', 'Combina el catálogo de YouTube con un servicio de streaming musical dedicado.'],
    en: ["YouTube Music launched in 2018.", "It combines YouTube's catalog with a dedicated music streaming service."]
  },
  Yelp: {
    es: ['Yelp se fundó en 2004.', 'Reúne reseñas locales de restaurantes y negocios.'],
    en: ['Yelp was founded in 2004.', 'It gathers local reviews of restaurants and businesses.']
  },
  TripAdvisor: {
    es: ['TripAdvisor se lanzó en 2000.', 'Reúne reseñas de viajeros sobre hoteles, restaurantes y atracciones.'],
    en: ['TripAdvisor launched in 2000.', 'It gathers traveler reviews of hotels, restaurants, and attractions.']
  },
  Airbnb: {
    es: ['Airbnb se fundó en 2008.', 'Conecta anfitriones y viajeros para alojamientos y experiencias.'],
    en: ['Airbnb was founded in 2008.', 'It connects hosts and travelers for lodging and experiences.']
  },
  Indeed: {
    es: ['Indeed se fundó en 2004.', 'Es uno de los mayores buscadores de empleo del mundo.'],
    en: ['Indeed was founded in 2004.', 'It is one of the largest job search engines in the world.']
  },
  Glassdoor: {
    es: ['Glassdoor se lanzó en 2007.', 'Reúne reseñas de empleados sobre empresas, sueldos y entrevistas.'],
    en: ['Glassdoor launched in 2007.', 'It gathers employee reviews about companies, pay, and interviews.']
  },
  Coursera: {
    es: ['Coursera se fundó en 2012 por profesores de Stanford.', 'Ofrece cursos en línea de universidades y empresas.'],
    en: ['Coursera was founded in 2012 by Stanford professors.', 'It offers online courses from universities and companies.']
  },
  edX: {
    es: ['edX se fundó en 2012 por Harvard y el MIT.', 'Ofrece cursos universitarios en línea, muchos de forma gratuita.'],
    en: ['edX was founded in 2012 by Harvard and MIT.', 'It offers online university courses, many available for free.']
  },
  Udemy: {
    es: ['Udemy se lanzó en 2010.', 'Es un mercado de cursos en línea creados por instructores independientes.'],
    en: ['Udemy launched in 2010.', 'It is a marketplace of online courses created by independent instructors.']
  },
  'Khan Academy': {
    es: ['Khan Academy se fundó en 2008 por Salman Khan.', 'Ofrece lecciones gratuitas de matemáticas, ciencia y más.'],
    en: ['Khan Academy was founded in 2008 by Salman Khan.', 'It offers free lessons in math, science, and more.']
  },
  Quizlet: {
    es: ['Quizlet se lanzó en 2005.', 'Permite crear tarjetas de estudio y practicar con juegos de repaso.'],
    en: ['Quizlet launched in 2005.', 'It lets you build flashcards and practice with study games.']
  },
  'Archive of Our Own': {
    es: ['Archive of Our Own (AO3) se lanzó en 2009.', 'Es un archivo sin fines de lucro de ficción escrita por fans.'],
    en: ['Archive of Our Own (AO3) launched in 2009.', 'It is a non-profit archive of fan-written fiction.']
  },
  DBLP: {
    es: ['DBLP indexa publicaciones de informática desde 1993.', 'Lo mantiene la Universidad de Trier en Alemania.'],
    en: ['DBLP has indexed computer science publications since 1993.', 'It is maintained by the University of Trier in Germany.']
  },
  ORCID: {
    es: ['ORCID se lanzó en 2012 como identificador único para investigadores.', 'Vincula publicaciones y financiamiento a un perfil académico persistente.'],
    en: ['ORCID launched in 2012 as a unique identifier for researchers.', 'It links publications and funding to a persistent academic profile.']
  },
  'Read the Docs': {
    es: ['Read the Docs se lanzó en 2010.', 'Aloja documentación técnica generada a partir de repositorios de código.'],
    en: ['Read the Docs launched in 2010.', 'It hosts technical documentation generated from code repositories.']
  },
  freeCodeCamp: {
    es: ['freeCodeCamp se fundó en 2014.', 'Ofrece cursos gratuitos de programación con certificaciones propias.'],
    en: ['freeCodeCamp was founded in 2014.', 'It offers free coding curricula with its own certifications.']
  },
  LeetCode: {
    es: ['LeetCode se lanzó en 2015.', 'Es la plataforma más usada para practicar problemas de entrevistas técnicas.'],
    en: ['LeetCode launched in 2015.', 'It is the most used platform for practicing technical interview problems.']
  },
  HackerRank: {
    es: ['HackerRank se fundó en 2009.', 'Combina retos de programación con evaluación técnica para empresas.'],
    en: ['HackerRank was founded in 2009.', 'It combines coding challenges with technical assessment for employers.']
  },
  Codewars: {
    es: ['Codewars se lanzó en 2014.', 'Propone retos de programación (katas) con un sistema de rangos.'],
    en: ['Codewars launched in 2014.', 'It offers coding challenges (katas) with a ranking system.']
  },
  Exercism: {
    es: ['Exercism se lanzó en 2013 como proyecto de código abierto.', 'Ofrece ejercicios de programación con mentoría gratuita.'],
    en: ['Exercism launched in 2013 as an open-source project.', 'It offers coding exercises with free mentoring.']
  },
  Codeforces: {
    es: ['Codeforces se lanzó en Rusia en 2009.', 'Organiza concursos de programación competitiva regulares.'],
    en: ['Codeforces launched in Russia in 2009.', 'It runs regular competitive programming contests.']
  },
  'Terraform Registry': {
    es: ['El Terraform Registry distribuye proveedores y módulos oficiales y comunitarios.', 'Terraform es una herramienta de infraestructura como código de HashiCorp.'],
    en: ['The Terraform Registry distributes official and community providers and modules.', "Terraform is HashiCorp's infrastructure-as-code tool."]
  },
  'Ansible Galaxy': {
    es: ['Ansible Galaxy distribuye roles y colecciones reutilizables.', 'Ansible es una herramienta de automatización de Red Hat.'],
    en: ['Ansible Galaxy distributes reusable roles and collections.', "Ansible is Red Hat's automation tool."]
  },
  'Artifact Hub': {
    es: ['Artifact Hub centraliza paquetes Kubernetes de distintos repositorios.', 'Incluye Helm charts, operadores y plugins.'],
    en: ['Artifact Hub centralizes Kubernetes packages from many repositories.', 'It includes Helm charts, operators, and plugins.']
  },
  'Kubernetes Docs': {
    es: ['Kubernetes se lanzó en 2014 y lo mantiene la CNCF.', 'Es el orquestador de contenedores más usado en producción.'],
    en: ['Kubernetes launched in 2014 and is maintained by the CNCF.', 'It is the most used container orchestrator in production.']
  },
  Anaconda: {
    es: ['Anaconda distribuye paquetes de Python y R para ciencia de datos.', 'Su gestor conda resuelve dependencias binarias complejas.'],
    en: ['Anaconda distributes Python and R packages for data science.', 'Its conda manager resolves complex binary dependencies.']
  },
  CRAN: {
    es: ['CRAN es el repositorio oficial de paquetes de R desde 1997.', 'Distribuye miles de extensiones estadísticas y gráficas.'],
    en: ['CRAN has been the official R package repository since 1997.', 'It distributes thousands of statistical and graphical extensions.']
  },
  Hackage: {
    es: ['Hackage es el repositorio central de paquetes de Haskell.', 'Se usa junto al gestor cabal para instalar dependencias.'],
    en: ['Hackage is the central Haskell package repository.', 'It works with the cabal tool to install dependencies.']
  },
  LuaRocks: {
    es: ['LuaRocks es el gestor de paquetes estándar del lenguaje Lua.', 'Distribuye módulos y bibliotecas para proyectos en Lua.'],
    en: ['LuaRocks is the standard package manager for the Lua language.', 'It distributes modules and libraries for Lua projects.']
  },
  MetaCPAN: {
    es: ['MetaCPAN indexa el archivo CPAN de módulos de Perl.', 'CPAN existe desde 1995 como repositorio central del lenguaje.'],
    en: ["MetaCPAN indexes the CPAN archive of Perl modules.", 'CPAN has existed since 1995 as the language\'s central repository.']
  },
  'Swift Packages': {
    es: ['El índice de paquetes Swift cataloga bibliotecas para Swift Package Manager.', 'Facilita encontrar dependencias para proyectos en iOS y macOS.'],
    en: ['The Swift Package Index catalogs libraries for Swift Package Manager.', 'It makes it easier to find dependencies for iOS and macOS projects.']
  },
  CocoaPods: {
    es: ['CocoaPods se lanzó en 2011 como gestor de dependencias para iOS.', 'Es uno de los gestores más usados en el ecosistema Apple.'],
    en: ['CocoaPods launched in 2011 as a dependency manager for iOS.', "It is one of the most used managers in Apple's ecosystem."]
  },
  'Gradle Plugins': {
    es: ['El Gradle Plugin Portal distribuye extensiones para el sistema de build Gradle.', 'Gradle es ampliamente usado en proyectos Java y Android.'],
    en: ['The Gradle Plugin Portal distributes extensions for the Gradle build system.', 'Gradle is widely used in Java and Android projects.']
  },
  'JetBrains Marketplace': {
    es: ['El JetBrains Marketplace distribuye plugins para IDEs como IntelliJ.', 'JetBrains desarrolla entornos de desarrollo desde 2000.'],
    en: ['The JetBrains Marketplace distributes plugins for IDEs like IntelliJ.', 'JetBrains has built development environments since 2000.']
  },
  'Chrome Web Store': {
    es: ['Chrome Web Store distribuye extensiones y temas desde 2010.', 'Es el catálogo oficial de complementos para Chrome.'],
    en: ['The Chrome Web Store has distributed extensions and themes since 2010.', "It is Chrome's official add-on catalog."]
  },
  'Firefox Add-ons': {
    es: ['Firefox Add-ons distribuye extensiones y temas para Firefox.', 'Lo mantiene Mozilla desde los primeros años del navegador.'],
    en: ['Firefox Add-ons distributes extensions and themes for Firefox.', 'It has been maintained by Mozilla since the early years of the browser.']
  },
  'WordPress Plugins': {
    es: ['El directorio de plugins de WordPress reúne extensiones gratuitas.', 'WordPress impulsa una gran parte de los sitios web del mundo.'],
    en: ["WordPress's plugin directory gathers free extensions.", "WordPress powers a large share of the world's websites."]
  },
  Postman: {
    es: ['Postman se lanzó en 2012 como herramienta para probar APIs.', 'Permite construir, probar y documentar peticiones HTTP.'],
    en: ['Postman launched in 2012 as an API testing tool.', 'It lets you build, test, and document HTTP requests.']
  },
  Observable: {
    es: ['Observable se lanzó en 2017.', 'Es un entorno de notebooks para visualización de datos en JavaScript.'],
    en: ['Observable launched in 2017.', 'It is a notebook environment for data visualization in JavaScript.']
  },
  Glitch: {
    es: ['Glitch se lanzó en 2017.', 'Permite crear y alojar apps web pequeñas directamente en el navegador.'],
    en: ['Glitch launched in 2017.', 'It lets you build and host small web apps directly in the browser.']
  },
  'Figma Community': {
    es: ['Figma Community comparte archivos, plugins y plantillas de diseño.', 'Figma se lanzó en 2016 como herramienta de diseño colaborativo.'],
    en: ['Figma Community shares design files, plugins, and templates.', 'Figma launched in 2016 as a collaborative design tool.']
  },
  Dribbble: {
    es: ['Dribbble se lanzó en 2009.', 'Es una comunidad para mostrar trabajos de diseño gráfico y UI.'],
    en: ['Dribbble launched in 2009.', 'It is a community for showcasing graphic and UI design work.']
  },
  Behance: {
    es: ['Behance se fundó en 2005 y fue adquirida por Adobe en 2012.', 'Es una plataforma para mostrar portafolios creativos.'],
    en: ['Behance was founded in 2005 and acquired by Adobe in 2012.', 'It is a platform for showcasing creative portfolios.']
  },
  ArtStation: {
    es: ['ArtStation se lanzó en 2014.', 'Es una plataforma de portafolios para arte digital y videojuegos.'],
    en: ['ArtStation launched in 2014.', 'It is a portfolio platform for digital art and game development.']
  },
  'Google Fonts': {
    es: ['Google Fonts se lanzó en 2010.', 'Distribuye tipografías de uso libre para la web.'],
    en: ['Google Fonts launched in 2010.', 'It distributes freely licensed typefaces for the web.']
  },
  'Font Awesome': {
    es: ['Font Awesome se lanzó en 2012.', 'Es una biblioteca de iconos vectoriales muy usada en la web.'],
    en: ['Font Awesome launched in 2012.', 'It is a widely used vector icon library for the web.']
  },
  Iconify: {
    es: ['Iconify reúne más de cien conjuntos de iconos en un formato unificado.', 'Permite usar cualquier set sin cargar todo el paquete.'],
    en: ['Iconify gathers over a hundred icon sets in a unified format.', 'It lets you use any set without loading the whole package.']
  },
  'Simple Icons': {
    es: ['Simple Icons reúne iconos SVG de marcas conocidas.', 'Se distribuye bajo licencia CC0, de dominio público.'],
    en: ['Simple Icons gathers SVG icons for well-known brands.', 'It is distributed under the CC0 public-domain license.']
  },
  'Noun Project': {
    es: ['Noun Project se lanzó en 2010.', 'Es una biblioteca de iconos y fotos con miles de colaboradores.'],
    en: ['Noun Project launched in 2010.', 'It is an icon and photo library with thousands of contributors.']
  },
  Pixabay: {
    es: ['Pixabay se fundó en 2010 en Alemania.', 'Ofrece imágenes, videos y música libres de derechos.'],
    en: ['Pixabay was founded in 2010 in Germany.', 'It offers royalty-free images, videos, and music.']
  },
  Giphy: {
    es: ['Giphy se lanzó en 2013.', 'Es el motor de búsqueda de GIFs animados más usado.'],
    en: ['Giphy launched in 2013.', 'It is the most used search engine for animated GIFs.']
  },
  TikTok: {
    es: ['TikTok se lanzó internacionalmente en 2017 por ByteDance.', 'Es una red de video corto muy popular entre audiencias jóvenes.'],
    en: ['TikTok launched internationally in 2017 by ByteDance.', 'It is a short-video network especially popular with younger audiences.']
  },
  Rumble: {
    es: ['Rumble se fundó en 2013.', 'Es una plataforma de video que se presenta como alternativa a YouTube.'],
    en: ['Rumble was founded in 2013.', 'It is a video platform positioned as an alternative to YouTube.']
  },
  VK: {
    es: ['VK se lanzó en Rusia en 2006.', 'Es la red social más usada en el espacio ruso.'],
    en: ['VK launched in Russia in 2006.', 'It is the most used social network in the Russian-speaking world.']
  },
  Zhihu: {
    es: ['Zhihu se lanzó en China en 2011.', 'Es una comunidad de preguntas y respuestas comparable a Quora.'],
    en: ['Zhihu launched in China in 2011.', 'It is a question-and-answer community comparable to Quora.']
  },
  Lobsters: {
    es: ['Lobsters se lanzó en 2012 como comunidad de tecnología por invitación.', 'Es más pequeña y curada que Hacker News.'],
    en: ['Lobsters launched in 2012 as an invite-based tech community.', 'It is smaller and more curated than Hacker News.']
  },
  Newegg: {
    es: ['Newegg se fundó en 2001.', 'Se especializa en componentes de computadora y electrónica.'],
    en: ['Newegg was founded in 2001.', 'It specializes in computer components and electronics.']
  },
  Alibaba: {
    es: ['Alibaba fue fundada en 1999 por Jack Ma.', 'Es una plataforma de comercio mayorista entre empresas.'],
    en: ['Alibaba was founded in 1999 by Jack Ma.', 'It is a business-to-business wholesale trading platform.']
  },
  'Booking.com': {
    es: ['Booking.com se fundó en 1996 en los Países Bajos.', 'Es una de las mayores plataformas de reserva de alojamiento.'],
    en: ['Booking.com was founded in 1996 in the Netherlands.', 'It is one of the largest accommodation booking platforms.']
  },
  AllTrails: {
    es: ['AllTrails se lanzó en 2010.', 'Reúne rutas de senderismo con mapas y reseñas de la comunidad.'],
    en: ['AllTrails launched in 2010.', 'It gathers hiking trails with maps and community reviews.']
  },
  Untappd: {
    es: ['Untappd se lanzó en 2010.', 'Es una red social para registrar y calificar cervezas.'],
    en: ['Untappd launched in 2010.', 'It is a social network for logging and rating beers.']
  },
  DeepL: {
    es: ['DeepL se lanzó en Alemania en 2017.', 'Es un traductor automático conocido por su precisión.'],
    en: ['DeepL launched in Germany in 2017.', 'It is a machine translator known for its accuracy.']
  },
  TradingView: {
    es: ['TradingView se lanzó en 2011.', 'Ofrece gráficos y análisis técnico de mercados financieros.'],
    en: ['TradingView launched in 2011.', 'It provides charting and technical analysis for financial markets.']
  },
  Wikivoyage: {
    es: ['Wikivoyage se lanzó en 2012.', 'Es una guía de viajes colaborativa y de contenido libre.'],
    en: ['Wikivoyage launched in 2012.', 'It is a collaborative, freely licensed travel guide.']
  },
  Wikisource: {
    es: ['Wikisource se lanzó en 2003.', 'Reúne textos originales de dominio público transcritos por voluntarios.'],
    en: ['Wikisource launched in 2003.', 'It gathers public-domain source texts transcribed by volunteers.']
  },
  Wikiversity: {
    es: ['Wikiversity se lanzó en 2006.', 'Ofrece materiales de aprendizaje y proyectos educativos abiertos.'],
    en: ['Wikiversity launched in 2006.', 'It offers open learning materials and educational projects.']
  },
  Fandom: {
    es: ['Fandom (antes Wikia) se fundó en 2004.', 'Aloja miles de wikis creadas por comunidades de fans.'],
    en: ['Fandom (formerly Wikia) was founded in 2004.', 'It hosts thousands of wikis built by fan communities.']
  },
  NASA: {
    es: ['La NASA se fundó en 1958.', 'Su sitio comparte investigación, misiones e imágenes del espacio.'],
    en: ['NASA was founded in 1958.', 'Its site shares research, missions, and imagery from space.']
  },
  Gitea: {
    es: ['Gitea es un software de código abierto para alojar Git.', 'gitea.com ofrece alojamiento gestionado del mismo proyecto.'],
    en: ['Gitea is open-source software for self-hosting Git.', 'gitea.com offers managed hosting of the same project.']
  },
  Launchpad: {
    es: ['Launchpad lo lanzó Canonical en 2004.', 'Aloja el desarrollo y los paquetes de Ubuntu, entre otros proyectos.'],
    en: ['Launchpad was launched by Canonical in 2004.', "It hosts Ubuntu's development and packages, among other projects."]
  },
  Yarn: {
    es: ['Yarn lo lanzó Facebook en 2016 como alternativa a npm.', 'Gestiona dependencias de JavaScript con instalaciones más rápidas.'],
    en: ['Yarn was launched by Facebook in 2016 as an alternative to npm.', 'It manages JavaScript dependencies with faster installs.']
  },
  'Deno Land': {
    es: ['deno.land distribuye módulos para el runtime Deno.', 'Deno se lanzó en 2018 como alternativa segura a Node.js.'],
    en: ['deno.land distributes modules for the Deno runtime.', 'Deno launched in 2018 as a security-focused alternative to Node.js.']
  },
  JSR: {
    es: ['JSR (JavaScript Registry) se lanzó en 2024.', 'Es un registro de paquetes moderno compatible con Node, Deno y Bun.'],
    en: ['JSR (the JavaScript Registry) launched in 2024.', 'It is a modern package registry compatible with Node, Deno, and Bun.']
  },
  jsDelivr: {
    es: ['jsDelivr es una red de distribución de contenido para paquetes de código abierto.', 'Sirve directamente archivos publicados en npm y GitHub.'],
    en: ['jsDelivr is a content delivery network for open-source packages.', 'It serves files published on npm and GitHub directly.']
  },
  'Libraries.io': {
    es: ['Libraries.io rastrea paquetes de más de 30 gestores distintos.', 'Ayuda a comparar popularidad y actividad de dependencias.'],
    en: ['Libraries.io tracks packages across more than 30 different package managers.', 'It helps compare the popularity and activity of dependencies.']
  },
  'Snyk Advisor': {
    es: ['Snyk Advisor puntúa paquetes de código abierto por seguridad y mantenimiento.', 'Snyk se centra en seguridad de la cadena de suministro de software.'],
    en: ['Snyk Advisor scores open-source packages on security and maintenance.', 'Snyk focuses on software supply-chain security.']
  },
  'Grafana Dashboards': {
    es: ['Grafana Dashboards reúne paneles compartidos por la comunidad.', 'Grafana es una herramienta de visualización de métricas muy usada.'],
    en: ['Grafana Dashboards gathers panels shared by the community.', 'Grafana is a widely used metrics visualization tool.']
  },
  'Docs.rs': {
    es: ['docs.rs genera documentación automática para cada crate de Rust.', 'Se actualiza en cada publicación en crates.io.'],
    en: ['docs.rs generates automatic documentation for every Rust crate.', 'It updates with every publish to crates.io.']
  },
  'Python Docs': {
    es: ['La documentación oficial de Python cubre el lenguaje y su biblioteca estándar.', 'Python se lanzó en 1991 por Guido van Rossum.'],
    en: ["Python's official documentation covers the language and its standard library.", 'Python launched in 1991 by Guido van Rossum.']
  },
  PostgreSQL: {
    es: ['PostgreSQL se originó en 1986 en la Universidad de Berkeley.', 'Es un sistema de bases de datos relacional de código abierto.'],
    en: ['PostgreSQL originated in 1986 at UC Berkeley.', 'It is an open-source relational database system.']
  },
  DigitalOcean: {
    es: ['DigitalOcean se fundó en 2011.', 'Sus tutoriales de comunidad son una referencia habitual para administración de servidores.'],
    en: ['DigitalOcean was founded in 2011.', 'Its community tutorials are a common reference for server administration.']
  },
  Trakt: {
    es: ['Trakt se lanzó en 2011.', 'Registra automáticamente el progreso de series y películas vistas.'],
    en: ['Trakt launched in 2011.', 'It automatically tracks progress on shows and movies watched.']
  },
  Kitsu: {
    es: ['Kitsu se lanzó en 2015 como sucesor de Hummingbird.', 'Es una base de datos y comunidad de anime y manga.'],
    en: ['Kitsu launched in 2015 as the successor to Hummingbird.', 'It is an anime and manga database and community.']
  },
  Beatport: {
    es: ['Beatport se fundó en 2004.', 'Es una tienda especializada en música electrónica para DJs.'],
    en: ['Beatport was founded in 2004.', 'It is a store specializing in electronic music for DJs.']
  },
  Mixcloud: {
    es: ['Mixcloud se lanzó en 2008.', 'Está orientado a mezclas de DJ, podcasts y programas de radio.'],
    en: ['Mixcloud launched in 2008.', 'It is oriented toward DJ mixes, podcasts, and radio shows.']
  },
  Audiomack: {
    es: ['Audiomack se lanzó en 2012.', 'Es una plataforma de streaming popular en música urbana y afrobeats.'],
    en: ['Audiomack launched in 2012.', 'It is a streaming platform popular for urban and afrobeats music.']
  },
  Songkick: {
    es: ['Songkick se fundó en 2007.', 'Rastrea conciertos y giras de artistas por ciudad.'],
    en: ['Songkick was founded in 2007.', 'It tracks concerts and artist tours by city.']
  },
  'Apple Podcasts': {
    es: ['Apple Podcasts (antes iTunes) ayudó a popularizar el formato desde 2005.', 'Es uno de los directorios de podcasts más usados.'],
    en: ['Apple Podcasts (formerly iTunes) helped popularize the format since 2005.', 'It is one of the most used podcast directories.']
  },
  Audible: {
    es: ['Audible se fundó en 1995 y fue adquirida por Amazon en 2008.', 'Es un servicio de audiolibros por suscripción.'],
    en: ['Audible was founded in 1995 and acquired by Amazon in 2008.', 'It is a subscription audiobook service.']
  },
  '500px': {
    es: ['500px se lanzó en 2009.', 'Es una comunidad de fotografía orientada a trabajo de alta calidad.'],
    en: ['500px launched in 2009.', 'It is a photography community oriented toward high-quality work.']
  },
  IKEA: {
    es: ['IKEA se fundó en Suecia en 1943.', 'Vende muebles y artículos para el hogar de diseño escandinavo.'],
    en: ['IKEA was founded in Sweden in 1943.', 'It sells furniture and home goods with Scandinavian design.']
  },
  Zara: {
    es: ['Zara se fundó en España en 1975.', 'Es una cadena de moda rápida del grupo Inditex.'],
    en: ['Zara was founded in Spain in 1975.', 'It is a fast-fashion chain owned by the Inditex group.']
  },
  Nike: {
    es: ['Nike se fundó en 1964 como Blue Ribbon Sports.', 'Es una de las marcas de calzado y ropa deportiva más grandes del mundo.'],
    en: ['Nike was founded in 1964 as Blue Ribbon Sports.', 'It is one of the largest athletic footwear and apparel brands in the world.']
  },
  Adidas: {
    es: ['Adidas se fundó en Alemania en 1949.', 'Es una de las principales marcas de calzado y ropa deportiva.'],
    en: ['Adidas was founded in Germany in 1949.', 'It is one of the leading athletic footwear and apparel brands.']
  },
  Vinted: {
    es: ['Vinted se lanzó en Lituania en 2008.', 'Es un mercado de ropa de segunda mano entre particulares.'],
    en: ['Vinted launched in Lithuania in 2008.', 'It is a peer-to-peer marketplace for secondhand clothing.']
  },
  Gumtree: {
    es: ['Gumtree se lanzó en el Reino Unido en 2000.', 'Es un sitio de anuncios clasificados locales.'],
    en: ['Gumtree launched in the United Kingdom in 2000.', 'It is a local classified ads site.']
  },
  Foursquare: {
    es: ['Foursquare se lanzó en 2009.', 'Popularizó el check-in en lugares antes de enfocarse en datos de ubicación.'],
    en: ['Foursquare launched in 2009.', 'It popularized location check-ins before shifting focus to location data.']
  },
  Deliveroo: {
    es: ['Deliveroo se fundó en el Reino Unido en 2013.', 'Es un servicio de reparto de comida a domicilio.'],
    en: ['Deliveroo was founded in the United Kingdom in 2013.', 'It is a food delivery service.']
  },
  Upwork: {
    es: ['Upwork nació en 2015 de la fusión de Elance y oDesk.', 'Es una de las plataformas de trabajo freelance más grandes.'],
    en: ['Upwork was formed in 2015 from the merger of Elance and oDesk.', 'It is one of the largest freelance work platforms.']
  },
  Fiverr: {
    es: ['Fiverr se fundó en Israel en 2010.', 'Es un mercado de servicios freelance organizados por paquetes fijos.'],
    en: ['Fiverr was founded in Israel in 2010.', 'It is a freelance services marketplace organized around fixed-price packages.']
  },
  Freelancer: {
    es: ['Freelancer.com se lanzó en 2009.', 'Conecta clientes con freelancers mediante proyectos y concursos.'],
    en: ['Freelancer.com launched in 2009.', 'It connects clients with freelancers through projects and contests.']
  },
  Codecademy: {
    es: ['Codecademy se fundó en 2011.', 'Enseña programación con lecciones interactivas en el navegador.'],
    en: ['Codecademy was founded in 2011.', 'It teaches programming through interactive in-browser lessons.']
  },
  Pluralsight: {
    es: ['Pluralsight se fundó en 2004.', 'Ofrece cursos técnicos en video para desarrolladores y equipos de TI.'],
    en: ['Pluralsight was founded in 2004.', 'It offers video-based technical courses for developers and IT teams.']
  },
  Skillshare: {
    es: ['Skillshare se lanzó en 2010.', 'Ofrece clases creativas en video por suscripción.'],
    en: ['Skillshare launched in 2010.', 'It offers subscription-based video classes on creative skills.']
  },
  DataCamp: {
    es: ['DataCamp se fundó en 2013.', 'Enseña ciencia de datos y programación con ejercicios interactivos.'],
    en: ['DataCamp was founded in 2013.', 'It teaches data science and programming through interactive exercises.']
  },
  Minds: {
    es: ['Minds se lanzó en 2015.', 'Es una red social que se presenta como alternativa abierta y descentralizada.'],
    en: ['Minds launched in 2015.', 'It is a social network positioned as an open, decentralized alternative.']
  },
  Netflix: {
    es: ['Netflix se fundó en 1997 y pasó a streaming en 2007.', 'Es uno de los servicios de streaming de video más grandes del mundo.'],
    en: ['Netflix was founded in 1997 and moved into streaming in 2007.', 'It is one of the largest video streaming services in the world.']
  },
  Crunchyroll: {
    es: ['Crunchyroll se lanzó en 2006.', 'Es un servicio de streaming especializado en anime.'],
    en: ['Crunchyroll launched in 2006.', 'It is a streaming service specializing in anime.']
  },
  Plex: {
    es: ['Plex se lanzó en 2008.', 'Organiza y transmite bibliotecas de medios personales.'],
    en: ['Plex launched in 2008.', 'It organizes and streams personal media libraries.']
  },
  Rakuten: {
    es: ['Rakuten se fundó en Japón en 1997.', 'Es uno de los mercados de comercio electrónico más grandes de Asia.'],
    en: ['Rakuten was founded in Japan in 1997.', 'It is one of the largest e-commerce marketplaces in Asia.']
  },
  Taobao: {
    es: ['Taobao lo lanzó Alibaba en 2003.', 'Es uno de los mayores mercados de consumo en línea de China.'],
    en: ['Taobao was launched by Alibaba in 2003.', "It is one of China's largest consumer online marketplaces."]
  },
  Allegro: {
    es: ['Allegro se fundó en Polonia en 1999.', 'Es el mercado de comercio electrónico más grande de Polonia.'],
    en: ['Allegro was founded in Poland in 1999.', "It is Poland's largest e-commerce marketplace."]
  },
  Fnac: {
    es: ['Fnac se fundó en Francia en 1954.', 'Vende electrónica, libros y entretenimiento.'],
    en: ['Fnac was founded in France in 1954.', 'It sells electronics, books, and entertainment media.']
  },
  MediaMarkt: {
    es: ['MediaMarkt se fundó en Alemania en 1979.', 'Es una cadena de electrónica de consumo con presencia en Europa.'],
    en: ['MediaMarkt was founded in Germany in 1979.', 'It is a consumer electronics chain with a presence across Europe.']
  },
  Carrefour: {
    es: ['Carrefour se fundó en Francia en 1958.', 'Es una de las mayores cadenas de hipermercados del mundo.'],
    en: ['Carrefour was founded in France in 1958.', 'It is one of the largest hypermarket chains in the world.']
  },
  Otto: {
    es: ['Otto se fundó en Alemania en 1949.', 'Es uno de los mayores minoristas en línea de Alemania.'],
    en: ['Otto was founded in Germany in 1949.', "It is one of Germany's largest online retailers."]
  },
  SoloLatino: {
    es: ['SoloLatino es un catálogo de películas y series en español.', 'La búsqueda usa el buscador integrado del sitio.'],
    en: ['SoloLatino is a Spanish-language catalog of movies and shows.', "Search uses the site's built-in search box."]
  },
  AnimeAV1: {
    es: ['AnimeAV1 distribuye anime codificado en el formato de video AV1.', 'Busca dentro de su catálogo por título.'],
    en: ['AnimeAV1 distributes anime encoded in the AV1 video format.', 'It searches its catalog by title.']
  },
  'Mercado Libre': {
    es: ['Mercado Libre se fundó en Argentina en 1999.', 'Es el mayor mercado de comercio electrónico de América Latina.'],
    en: ['Mercado Libre was founded in Argentina in 1999.', "It is Latin America's largest e-commerce marketplace."]
  }
};

export function searchGuideFor(service, language = 'en') {
  if (!service) return null;
  const locale = language === 'es' ? 'es' : 'en';
  const hostname = (() => {
    try { return new URL(homeOf(service)).hostname.replace(/^www\./, ''); }
    catch { return service.name; }
  })();
  const isTranslator = service.name === 'Google Traductor';
  const supportsWebSyntax = ['Google', 'DuckDuckGo'].includes(service.name);
  const supportsMarkdown = Boolean(service.scope?.includes('AI'));
  const requiresUserscript = Boolean(service.requiresUserscript);
  const facts = serviceFacts[service.name]?.[locale] ?? [];

  return {
    summary: locale === 'es'
      ? service.search
        ? `Envía la consulta directamente a ${service.name} en ${hostname}.`
        : `Abre ${service.name} en ${hostname}${requiresUserscript ? '; el envío automático requiere el userscript' : ''}.`
      : service.search
        ? `Sends the query directly to ${service.name} at ${hostname}.`
        : `Opens ${service.name} at ${hostname}${requiresUserscript ? '; automatic submission requires the userscript' : ''}.`,
    shortcutLabel: locale === 'es' ? 'Atajo' : 'Shortcut',
    syntaxLabel: locale === 'es' ? 'Opciones y sintaxis' : 'Options and syntax',
    noOptions: locale === 'es' ? 'Sin opciones especiales disponibles.' : 'No special options available.',
    history: facts[0] ?? '',
    focus: facts[1] ?? '',
    syntaxes: isTranslator
      ? translatorSyntax[locale]
      : serviceSyntax[service.name]?.[locale]
        ?? (supportsWebSyntax ? webSyntax[locale] : supportsMarkdown ? markdownSyntax[locale] : [])
  };
}
