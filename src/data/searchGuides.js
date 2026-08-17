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
  }
};

export function searchGuideFor(service, language = 'es') {
  if (!service) return null;
  const locale = language === 'en' ? 'en' : 'es';
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
