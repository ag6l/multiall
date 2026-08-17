const timeCopy = {
  es: {
    greetings: ['Buena madrugada', 'Buenos días', 'Buenas tardes', 'Buenas noches'],
    notes: [
      [
        '¿Sigues despierto?', '¿Trabajando de madrugada?', 'Una búsqueda más antes de dormir.',
        'La calma de la madrugada ayuda a pensar.', '¿Una idea no te deja dormir?',
        'Todo está tranquilo; es buen momento para concentrarse.', '¿Terminando algo importante?',
        'La inspiración también llega tarde.', '¿Buscando respuestas mientras todos duermen?',
        'Una noche larga merece una buena respuesta.', '¿Preparando el día antes de que empiece?',
        'Las mejores ideas no siempre miran el reloj.', '¿Necesitas resolver algo ahora mismo?',
        'Madrugada, café y una búsqueda pendiente.', 'Aprovecha el silencio para descubrir algo nuevo.',
        '¿Dándole los últimos detalles?', 'Todavía hay tiempo para una gran idea.',
        'El mundo duerme, pero la curiosidad no.', '¿Qué te mantiene despierto?',
        'Hagamos que esta hora cuente.',
        '¿Un proyecto secreto de madrugada?', 'La ciudad duerme, pero tu mente sigue activa.',
        '¿Resolviendo algo antes del amanecer?', 'Pocas horas, pero suficientes para una buena idea.',
        'El silencio de la noche ayuda a enfocarse.', '¿Qué pregunta te trajo hasta aquí?',
        'A esta hora, cada respuesta se agradece el doble.', '¿Últimos ajustes antes de descansar?'
      ],
      [
        'Un buen momento para empezar.', '¿Listo para descubrir algo nuevo?', 'Que tengas una mañana productiva.',
        'Empieza el día con una buena pregunta.', '¿Qué quieres aprender esta mañana?',
        'Una búsqueda puede cambiar el rumbo del día.', 'Mente fresca, nuevas posibilidades.',
        '¿Organizando las ideas del día?', 'Hoy puede empezar con un gran hallazgo.',
        'Encuentra primero lo que más importa.', '¿Café listo y curiosidad despierta?',
        'La mañana es perfecta para explorar.', 'Convierte esa idea en un buen comienzo.',
        '¿Qué resolveremos antes del mediodía?', 'Un paso pequeño puede abrir muchas puertas.',
        'Es hora de poner las ideas en movimiento.', 'Busca, compara y empieza con claridad.',
        'Una mañana tranquila para pensar mejor.', '¿Cuál es la primera pregunta de hoy?',
        'Haz espacio para descubrir algo inesperado.',
        '¿Qué meta te propones hoy?', 'El día empieza con la pregunta correcta.',
        '¿Ya tienes tu primera búsqueda del día?', 'Una mañana despejada, una mente despejada.',
        '¿Listo para avanzar en tu proyecto?', 'El mejor momento para planear es ahora.',
        'Empieza con calma y termina con claridad.', 'Hoy es un buen día para aprender algo nuevo.'
      ],
      [
        '¿Buscando inspiración?', 'La tarde aún tiene mucho por ofrecer.', 'Hora de encontrar eso que necesitas.',
        '¿Retomamos esa idea pendiente?', 'Todavía queda tiempo para avanzar.',
        'Una respuesta útil puede mejorar tu tarde.', '¿Qué necesitas resolver ahora?',
        'La tarde es buena para conectar ideas.', 'Sigue el impulso y encuentra lo que falta.',
        '¿Buscando un descanso productivo?', 'Explora una posibilidad nueva.',
        'Haz que la siguiente búsqueda valga la pena.', '¿Afinando los detalles de tu proyecto?',
        'Una pausa breve, una idea fresca.', 'Todavía puedes descubrir algo sorprendente.',
        '¿Cuál es el siguiente paso?', 'La curiosidad mantiene viva la tarde.',
        'Encuentra claridad antes de continuar.', 'Vamos por esa respuesta que falta.',
        'Cada búsqueda puede acercarte a la solución.',
        '¿Cómo va tu tarde hasta ahora?', 'Un buen momento para revisar pendientes.',
        '¿Qué te gustaría resolver antes de la noche?', 'La tarde invita a seguir avanzando.',
        'Sigue el ritmo; ya casi llegas a la meta del día.', 'Una idea a tiempo puede ahorrarte horas.',
        '¿Buscando algo específico o solo explorando?'
      ],
      [
        '¿Trabajando de noche?', 'Una última búsqueda para terminar el día.', 'La noche también es buena para aprender.',
        '¿Cerrando pendientes o empezando ideas?', 'La tranquilidad nocturna invita a explorar.',
        'Encuentra esa respuesta antes de descansar.', '¿Qué te gustaría resolver esta noche?',
        'Una buena idea para cerrar el día.', 'La noche guarda tiempo para la curiosidad.',
        '¿Preparando algo para mañana?', 'Termina el día con una respuesta clara.',
        'Todavía queda espacio para descubrir.', '¿Un último impulso creativo?',
        'Las ideas nocturnas también merecen atención.', 'Busca con calma; el día ya bajó el ritmo.',
        '¿Reflexionando sobre el siguiente paso?', 'Una consulta más y luego a descansar.',
        'Convierte la curiosidad de hoy en el plan de mañana.', '¿Qué falta por encontrar?',
        'Que esta búsqueda sea un buen cierre.',
        '¿Repasando lo que hiciste hoy?', 'La noche es buena para atar cabos sueltos.',
        '¿Una idea de último momento?', 'Cierra el día con la mente tranquila.',
        'Todavía puedes resolver algo antes de descansar.', 'La noche premia a quien sigue buscando.',
        '¿Qué aprendiste hoy que valga la pena guardar?'
      ]
    ]
  },
  en: {
    greetings: ['Good early morning', 'Good morning', 'Good afternoon', 'Good evening'],
    notes: [
      [
        'Still awake?', 'Working through the night?', 'One more search before sleep.',
        'The quiet hours are good for thinking.', 'Is an idea keeping you awake?',
        'Everything is calm; it is a good time to focus.', 'Finishing something important?',
        'Inspiration arrives late sometimes.', 'Looking for answers while everyone sleeps?',
        'A long night deserves a good answer.', 'Preparing the day before it begins?',
        'The best ideas do not always watch the clock.', 'Need to solve something right now?',
        'Late hours, coffee, and one pending search.', 'Use the silence to discover something new.',
        'Adding the final touches?', 'There is still time for a great idea.',
        'The world sleeps, but curiosity does not.', 'What is keeping you awake?',
        'Let us make this hour count.',
        'A secret project at this hour?', 'The city sleeps, but your mind keeps going.',
        'Solving something before sunrise?', 'Few hours left, but enough for one good idea.',
        'The quiet of the night helps you focus.', 'What question brought you here?',
        'At this hour, every answer counts double.', 'Putting the final touches on before you rest?'
      ],
      [
        'A good time to get started.', 'Ready to discover something new?', 'Here is to a productive morning.',
        'Start the day with a good question.', 'What would you like to learn this morning?',
        'One search can change the direction of your day.', 'Fresh mind, new possibilities.',
        'Organizing today’s ideas?', 'Today can begin with a great find.',
        'Find what matters most first.', 'Coffee ready and curiosity awake?',
        'Morning is perfect for exploring.', 'Turn that idea into a strong start.',
        'What can we solve before noon?', 'A small step can open many doors.',
        'It is time to put ideas in motion.', 'Search, compare, and begin with clarity.',
        'A quiet morning helps you think better.', 'What is today’s first question?',
        'Make room to discover something unexpected.',
        'What goal are you chasing today?', 'The day starts with the right question.',
        'Got your first search of the day yet?', 'A clear morning, a clear mind.',
        'Ready to move your project forward?', 'The best time to plan is right now.',
        'Start calm and finish with clarity.', 'Today is a good day to learn something new.'
      ],
      [
        'Looking for inspiration?', 'The afternoon still has plenty to offer.', 'Time to find what you need.',
        'Ready to revisit that pending idea?', 'There is still time to make progress.',
        'A useful answer can improve your afternoon.', 'What do you need to solve now?',
        'Afternoons are good for connecting ideas.', 'Keep the momentum and find what is missing.',
        'Looking for a productive break?', 'Explore a new possibility.',
        'Make the next search worthwhile.', 'Fine-tuning your project?',
        'A short pause can bring a fresh idea.', 'There is still something surprising to discover.',
        'What is the next step?', 'Curiosity keeps the afternoon moving.',
        'Find clarity before you continue.', 'Let us find that missing answer.',
        'Every search can bring you closer to a solution.',
        'How is your afternoon going so far?', 'A good time to check off pending tasks.',
        'What would you like to solve before evening?', 'The afternoon invites you to keep moving.',
        'Keep the pace; you are almost through the day.', 'A timely idea can save you hours.',
        'Looking for something specific, or just exploring?'
      ],
      [
        'Working at night?', 'One last search to wrap up the day.', 'Nighttime is good for learning too.',
        'Closing tasks or starting ideas?', 'The evening calm invites exploration.',
        'Find that answer before you rest.', 'What would you like to solve tonight?',
        'A good idea to close the day.', 'The night leaves room for curiosity.',
        'Preparing something for tomorrow?', 'End the day with a clear answer.',
        'There is still room to discover.', 'One last creative push?',
        'Nighttime ideas deserve attention too.', 'Search calmly; the day has slowed down.',
        'Thinking about the next step?', 'One more query, then some rest.',
        'Turn today’s curiosity into tomorrow’s plan.', 'What remains to be found?',
        'Let this search be a satisfying finish.',
        'Looking back on what you got done today?', 'Night is good for tying up loose ends.',
        'One last-minute idea?', 'End the day with a clear mind.',
        'There is still time to solve one more thing before you rest.', 'The night rewards those who keep looking.',
        'What did you learn today that is worth keeping?'
      ]
    ]
  }
};

function periodForHour(hour) {
  if (hour < 5) return 0;
  if (hour < 12) return 1;
  if (hour < 20) return 2;
  return 3;
}

export function timeGreeting(language = 'en', date = new Date()) {
  const copy = timeCopy[language] ?? timeCopy.es;
  const period = periodForHour(date.getHours());
  const notes = copy.notes[period];
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + period;
  return { greeting: copy.greetings[period], note: notes[seed % notes.length] };
}

export function formatLocalDateTime(date = new Date(), language = 'en') {
  const months = language === 'en'
    ? ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const two = (value) => String(value).padStart(2, '0');
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())} ${two(date.getDate())} ${months[date.getMonth()]} ${two(date.getFullYear() % 100)}`;
}

/** Most services have no dedicated home page beyond their search engine's
 *  origin, so `home` is only stored on the few that differ (a sub-path, or a
 *  search-less AI chat). Everyone else falls back to that origin. */
export function homeOf(service) {
  if (service.home) return service.home;
  try { return new URL(service.search).origin + '/'; } catch { return service.search; }
}

function destinationFor(service, query) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || !service.search) return homeOf(service);
  return `${service.search}${encodeURIComponent(normalizedQuery)}${service.searchSuffix ?? ''}`;
}

function encodePrompt(prompt) {
  const bytes = new TextEncoder().encode(prompt);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/**
 * The fragment is the only channel that reaches the userscript across origins,
 * and it never leaves the browser. Text-only prompts keep the original
 * `aiforall=` marker so userscript 1.5 still understands them; adding files
 * switches to `aiforall2=`, a base64url JSON envelope that 2.0 reads.
 *
 * Files are capped because a fragment is not a transport for large binaries —
 * past roughly a megabyte browsers start refusing the navigation outright.
 */
export const MAX_ATTACHMENT_PAYLOAD = 1_200_000;

function automatedDestinationFor(service, query, attachments = []) {
  if (!query.trim() && !attachments.length) return homeOf(service);
  const prompt = query.replace(/\r\n?/g, '\n');

  if (service.name === 'Perplexity' && service.search) {
    return `${service.search}${encodeURIComponent(prompt)}${service.searchSuffix ?? ''}`;
  }

  const destination = new URL(homeOf(service));
  if (attachments.length) {
    const envelope = encodePrompt(JSON.stringify({ prompt, files: attachments }));
    if (envelope.length <= MAX_ATTACHMENT_PAYLOAD) {
      destination.hash = `aiforall2=${envelope}`;
      return destination.toString();
    }
  }
  destination.hash = `aiforall=${encodePrompt(prompt)}`;
  return destination.toString();
}

function openDestination(destination, newTab) {
  if (newTab) {
    window.open(destination, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.assign(destination);
}

export function visitService(service, query, newTab = false) {
  openDestination(destinationFor(service, query), newTab);
}

export function visitAutomatedService(service, query, newTab = false, attachments = []) {
  openDestination(automatedDestinationFor(service, query, attachments), newTab);
}

/** Encodes a File for the fragment envelope, chunked to avoid blowing the stack. */
export async function encodeAttachment(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return { name: file.name, type: file.type, data: btoa(binary) };
}
