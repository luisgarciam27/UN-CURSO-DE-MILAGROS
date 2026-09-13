import { PrayerItem } from '../types';

export const PRAYER_CATEGORIES = [
  { id: 'all', label: 'Todas las Oraciones' },
  { id: 'sanacion', label: 'Sanación y Paz Interior' },
  { id: 'conflictos', label: 'Conflictos y Juicios' },
  { id: 'rendicion', label: 'Rendición y Entrega' },
  { id: 'relaciones', label: 'Relaciones y Pareja' },
  { id: 'familia', label: 'Familia e Hijos' },
  { id: 'abundancia', label: 'Abundancia y Prosperidad' },
];

export const PRAYERS_DATABASE: PrayerItem[] = [
  {
    id: 'entregar-recuerdos-dolorosos',
    title: 'Oración para entregar recuerdos dolorosos',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para soltar recuerdos pasados, juicios, resentimientos y culpas, reemplazándolos con el Amor de Dios.',
    textTemplate: `Espíritu Santo te pido te manifiestes en mi mente.

Te entrego este recuerdo y todos los juicios, resentimientos y culpas que surgieron con él. Permite que sean deshechos en la Luz y reemplazados por el Amor de Dios que ya habita en mí. Permíteme ver inocencia y luz en todas las personas que aparecieron en estos recuerdos y reconocer que compartimos una misma santidad; ayúdame a sentir el Amor de Dios por ellas y a unirme a ellas en ese Amor, donde no hay separación.

Espíritu Santo, corrige ahora mi percepción. Enséñame a amar como Cristo ama. Ayúdame a mantener mi atención solo en Cristo, solo en la Verdad, solo en el Amor de Dios. Recuérdame la inocencia de mi Ser verdadero y la luz eterna de mi espíritu.

Dios Padre, Fuente de toda Luz y de toda Sanación, en Tus manos pongo mi mente, sabiendo que ya es perfecta, ya es íntegra y ya es sana. Ayúdame a recordar mi verdad: yo soy el santo Hijo de Dios y soy uno Contigo, amado Padre. Yo elijo Tu Amor por sobre todas las cosas.

Hágase Tu Voluntad, Dios Padre.`
  },
  {
    id: 'sanando-conflicto-original',
    title: 'Sanando el Conflicto Original de cualquier problema',
    category: 'conflictos',
    categoryLabel: 'Conflictos y Juicios',
    description: 'Para descubrir y sanar la raíz u origen inconsciente de cualquier problema actual (miedo, dolor, ira, recuerdos de padres o exparejas).',
    textTemplate: `Dios, te pido te manifiestes en mi mente.

Te pido me muestres el obstáculo o el conflicto original razón por la cual hoy tengo {problema}.

*Una vez descrito el problema, vendrán recuerdos conscientes o inconscientes a ti (pueden venir imágenes en relación a Papá, Mamá, ex parejas o cualquier otra situación de tu pasado). No juzgues el pensamiento que venga a ti, solo recibe el recuerdo y la emoción que le acompaña tal como lo experimentaste en ese momento (miedo, dolor, tristeza, ira, etc.).*

Dios, te pido que elimines de mi mente este recuerdo, no lo quiero más. Libérame de este dolor y del sentimiento que tengo de {sentimiento}.

Quiero ver inocencia y Luz en {persona} y sentir el amor de Dios por él, ella o ellos y unirme a él, ella o ellos en dicho Amor.

Dame Paz.`,
    fields: [
      { key: 'problema', label: 'Descripción del problema actual', placeholder: 'ej. dificultad financiera, angustia en el trabajo...' },
      { key: 'sentimiento', label: 'Sentimiento o emoción a liberar', placeholder: 'ej. tristeza, miedo, culpa, abandono...' },
      { key: 'persona', label: 'Persona(s) involucrada(s)', placeholder: 'ej. mi padre, mi expareja, todos ellos...' }
    ]
  },
  {
    id: 'oracion-rendirse-1',
    title: 'Oración para Rendirse (Parte 1)',
    category: 'rendicion',
    categoryLabel: 'Rendición y Entrega',
    description: 'Para dejar de buscar soluciones en el mundo y acudir a la paz interior sin súplicas de carencia.',
    textTemplate: `Padre Santo, te pido te manifiestes en mi Mente.

Hoy me acerco a Ti no para pedir, sino para recordar. No vengo con súplicas, porque empiezo a comprender que ya me lo diste todo. Tu Amor no necesita ser solicitado, solo necesita ser aceptado.

He intentado buscar soluciones en el mundo, he confundido oración con carencia, y he elevado ídolos en Tu lugar. Hoy suelto todo eso.

Espíritu Santo, guíame más allá de mis deseos aprendidos. Llévame al silencio donde Tu Amor canta.`
  },
  {
    id: 'oracion-rendirse-2',
    title: 'Oración para Rendirse (Parte 2)',
    category: 'rendicion',
    categoryLabel: 'Rendición y Entrega',
    description: 'Para renunciar al mundo de la ilusión y descansar plenamente en el Amor y la Unidad con Cristo.',
    textTemplate: `Hazme olvidar lo que creo necesitar, para que pueda aceptar lo que ya está aquí.

No quiero más pedir el eco. Quiero escuchar el canto. Quiero recordar que en mi unión Contigo, no hay necesidad, no hay falta, no hay temor.

Elijo renunciar a este mundo para ser uno Contigo. Elijo dejar de buscar, para encontrarme en Ti. Elijo dejar de pedir cosas del mundo, para llevar mi atención solo al Amor que eres Tú.

Yo elijo entregarme a tu Amor. Y en esta entrega, Yo descanso, Yo confío, Yo me rindo a tu voluntad.

Ayúdame a recordar mi unidad en Cristo. Ayúdame a recordar que, Yo soy La luz del Mundo junto con Jesús.

Amén.`
  },
  {
    id: 'perdon-por-mi-hermano',
    title: 'Oración del Perdón por mi Hermano',
    category: 'relaciones',
    categoryLabel: 'Relaciones y Pareja',
    description: 'Para reconocer que lo visto en el hermano es reflejo del propio miedo y elegir ver su inocencia.',
    textTemplate: `Dios, te pido te manifiestes en mi mente.

Hoy reconozco que lo que vi en {hermano} no era más que el reflejo de mi propio miedo. Perdóname por haberlo confundido con mi enemigo, cuando en verdad es Tu Hijo, igual que yo.

No deseo mantenerlo atado a mi juicio, ni usarlo más como excusa para no ver mi luz. Hoy te pido ver con nuevos ojos: que pueda recordar su inocencia... y en ella, reconocer la mía.

Libéralo en mi mente, y llévame contigo a la paz que nunca se fue.

Amén.

*Frase para Reprogramar la Mente:*
“Hoy elijo ver a Jesús en mi hermano, y recordar que en su luz, también soy luz.”`,
    fields: [
      { key: 'hermano', label: 'Nombre de la persona o hermano', placeholder: 'ej. mi compañero, Juan...' }
    ]
  },
  {
    id: 'union-perdon-uno-mismo',
    title: 'Oración de Unión y Perdón en Cristo para uno mismo',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para dejar atrás la ilusión de pequeñez y aceptar la herencia santa de unión con Jesús.',
    textTemplate: `Jesús, te pido te manifiestes en mi mente.

Amado Hermano, espejo perfecto de quien Yo Soy. Hoy dejo a un lado mis ilusiones de pequeñez, y reconozco que no estoy separado de Ti. Te extiendo mi mano, no como alguien inferior, sino como un hermano que ha recordado su herencia santa.

Deseo ser sanado, no en el cuerpo, sino en la mente que olvidó su inocencia. Hoy te entrego todo pensamiento de culpa, de miedo y de separación. Acepto tu Amor como mi propia verdad.

Espíritu Santo, guíame a ver mi rostro reflejado en Cristo, a reconocer que soy, como Jesús, un Santo Hijo de Dios, completo, inocente, eterno y amado sin condición. Que en esta unión mi mente sea restaurada a la Paz de Dios, y que al recordarlo, la sanación se extienda de mí hacia todos.

Hoy no camino solo. Camino junto contigo Jesús, en la Mente de Cristo que compartimos para siempre.

Dios Padre, Yo deseo unirme a tu amor junto a Tu amado Hijo Jesús en la Eternidad.

Amén.`
  },
  {
    id: 'union-perdon-ayudando-otros',
    title: 'Oración de Unión y Perdón en Cristo ayudando a otros',
    category: 'relaciones',
    categoryLabel: 'Relaciones y Pareja',
    description: 'Para renunciar a la creencia de separación y desigualdad, convirtiéndose en instrumento de verdadera curación.',
    textTemplate: `Amado Jesús, te pido te manifiestes en mi mente.

Maestro de la Unidad y la Paz. Hoy deposito ante Ti toda creencia en separación. Renuncio a la idea de que uno puede ser más y otro menos, de que uno puede sanar mientras el otro sufre. Ambos somos uno, creados en perfecta igualdad en el Amor de Dios.

Te entrego todo pensamiento de superioridad, toda ilusión de desigualdad. Que mis ojos se abren para ver a mi hermano como a mí mismo, sin ídolos que opaquen la Luz que compartimos.

Espíritu Santo, enséñame a sanar no desde el saber del mundo, sino desde la humildad que reconoce que no hay diferencia entre nosotros. Hazme un instrumento de la verdadera curación: la que une, la que perdona, la que recuerda que no hay separación.

Que mi mente se funda hoy en la Mente de Cristo, y que, junto a Jesús, camine el sendero de la verdadera sanación, donde solo el Amor es real y el pecado y el miedo no tienen poder.

Hoy elijo la Unión, hoy elijo recordar que somos uno. Y en este recuerdo, toda enfermedad se disuelve en la Luz de Dios.

Hágase tu Voluntad Dios Padre.

Amén.`
  },
  {
    id: 'perdon-unirme-hermano',
    title: 'Oración del Perdón para unirme a mi Hermano',
    category: 'relaciones',
    categoryLabel: 'Relaciones y Pareja',
    description: 'Para dejar de tener razón y recordar que somos Uno en Cristo junto con nuestros hermanos.',
    textTemplate: `Padre, te pedimos que te manifiestes en nuestras mentes.

Hoy me uno a mi hermano no para pedir por separado, sino para recordar que somos Uno. Perdóname por los juicios que hemos levantado entre nosotros, por las barreras que creímos reales y las palabras que nos separaron.

Ya no queremos tener razón. Elegimos recordar que somos Uno en Cristo. Queremos recordar el Amor que nos creó como uno solo.

Que nuestras oraciones no sean gritos de necesidad, sino cantos de unidad que regresan a Ti. Muéstranos Tu Voluntad, y enséñanos a caminar juntos.

Dios Padre, en tus manos ponemos esta relación para que todo sea sanado y guiado de acuerdo con Tu Voluntad.

Amén.`
  },
  {
    id: 'sanar-conectar-abundancia',
    title: 'Oración para Sanar y Conectar con la Abundancia',
    category: 'abundancia',
    categoryLabel: 'Abundancia y Prosperidad',
    description: 'Para entregar todo miedo a la escasez y corregir la percepción sobre el mundo material.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

Te entrego todo miedo, juicio, resentimiento, incertidumbre y pensamiento de escasez en relación a la abundancia en mi mente y pido que todo sea reemplazado por la Paz y el Amor de Dios en mi mente.

Corrige mi percepción sobre el mundo material y ayúdame a verlo desde los ojos del Amor. Ayúdame a recordar que en el Amor de Dios ya lo tenemos todo y que este Amor ya nos ha sido otorgado por Dios mismo.

Pido ver la Luz e inocencia en todos mis hermanos y en mí, y sentir el Amor de Dios por todos ellos y unirme a ellos en dicho Amor.

Espíritu Santo en tus manos pongo mis necesidades. Provéeme de acuerdo con la voluntad del Padre.

Sana mi mente y dame Paz.`
  },
  {
    id: 'sanacion-en-uno-mismo',
    title: 'Oración para la Sanación en uno mismo',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para entregar cualquier condición o tema de salud física a la curación de la mente.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

"En tus manos pongo mi curación. Te entrego toda emoción de dolor, tristeza, culpa, miedo, juicios y resentimientos en relación a este tema de salud en mi mente ({temaSalud}). Y te pido que todo sea reemplazado por el Amor y la Paz de Dios en mi mente.

Libérame de mi deseo de estar separado de Dios y de mi renuencia a amar. Quiero ver Inocencia y Luz en todos mis hermanos sin excepción y en mí. Pido ver la Faz de Cristo en todos mis hermanos y en mí, y sentir el Amor de Dios por todos ellos y unirme a ellos en dicho Amor.

Te pido corrijas mi percepción en relación a mi cuerpo, sana mi mente y enséñame a ver las cosas como Tú las ves. Ayúdame a mantener mi atención solo en el Amor de Dios.

Llévame a la Luz, que es la fuente de toda curación. Hágase tu voluntad Dios Padre."`,
    fields: [
      { key: 'temaSalud', label: 'Condición o síntoma de salud', placeholder: 'ej. dolor de cabeza, tensión en la espalda, fatiga...' }
    ]
  },
  {
    id: 'pedir-por-nuestros-hijos',
    title: 'Oración para pedir por nuestros Hijos',
    category: 'familia',
    categoryLabel: 'Familia e Hijos',
    description: 'Para entregar ansiedades y miedos sobre un hijo, viendo su ser verdadero y la luz de su espíritu.',
    textTemplate: `Jesús, te pido te manifiestes en mi mente.

Dame tu fortaleza para no unirme al dolor de {hijo} y permíteme ser un canal de tu Amor y de tu Paz. Te entrego toda ansiedad, miedo, culpa y preocupaciones en relación a {hijo} y te pido que todo sea reemplazado por la Paz y el Amor de Dios en mi mente.

Jesús, en relación a {hijo} pido ver su Ser verdadero y la Luz de su Espíritu. Pido ver la Faz de Cristo en él/ella. Corrige mi percepción sobre {hijo} y de igual manera corrige la percepción de {hijo} sobre sí mismo/a.

Pido sentir el Amor de Dios por {hijo} y unirme a él/ella en dicho Amor. Dios Padre, fuente de Luz y de toda sanación, en tus manos pongo a {hijo} para que todo sea sanado y llevado de acuerdo con tu voluntad.

Amén.`,
    fields: [
      { key: 'hijo', label: 'Nombre del hijo/a', placeholder: 'ej. mi hijo Daniel, Sofia...' }
    ]
  },
  {
    id: 'oracion-antes-dormir',
    title: 'Oración para antes de Dormir',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para entregar el día al Espíritu Santo y permitir que la mente sea sanada durante el sueño.',
    textTemplate: `Jesús te pido te manifiestes en mi mente.

Jesús te entrego este día y todas sus experiencias. Pido tu guía para que mi mente sea sanada mientras duermo. Que el Espíritu Santo remueva todo temor y me llene del Amor y de la Paz de Dios.

Permite que mis sueños sean de Luz y verdad, y que despierte renovada/o en paz y con el corazón lleno de Amor.

Amén.`
  },
  {
    id: 'eliminar-culpa-actos',
    title: 'Oración para eliminar la culpa de nuestros actos',
    category: 'conflictos',
    categoryLabel: 'Conflictos y Juicios',
    description: 'Para entregar juicios, tristeza y culpa por errores pasados y recibir la Paz de Dios.',
    textTemplate: `Espíritu Santo te pido te manifiestes en mi mente.

Te entrego todos los juicios, tristeza, culpa, resentimientos y miedos que tengo ahora con estos actos que he tenido ({situacionCulpa}) y pido que los reemplaces por la Paz y el Amor de Dios en mi mente.

Pido ver la Luz del Espíritu y la Inocencia del Ser verdadero en todos mis hermanos y en mí. Enséñame a relacionarme desde la Luz de mi Espíritu con todos mis hermanos. Ayúdame a ver a mis hermanos desde la Visión de Cristo. Pido unirme a todos mis hermanos en el Amor de Dios.

Dios Padre, fuente de Luz y de toda curación pongo mi mente en tus manos para que todo sea sanado y llevado de acuerdo con tu voluntad.

Amén.`,
    fields: [
      { key: 'situacionCulpa', label: 'Situación o acto específico a entregar', placeholder: 'ej. una palabra desubicada, una decisión pasada...' }
    ]
  },
  {
    id: 'sanar-nino-interior',
    title: 'Oración para sanar con tu Niño Interior',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para conectar con recuerdos de la infancia y transformar emociones dolorosas en amor y paz.',
    textTemplate: `Espíritu Santo te pido te manifiestes en mi mente.

Te pido me muestres una imagen o un recuerdo de lo que yo debo sanar con mi Niño Interior.

*Instrucción: aquí cierras los ojos y esperas 1 o 2 min. para recibir cualquier imagen o recuerdo que el Espíritu Santo quiera mostrarte. Permítete sentir las emociones que emanan de aquel recuerdo y no las juzgues. Una vez pasado los 2 min aprox, abres los ojos y continuas leyendo.*

Espíritu Santo, te entrego este recuerdo y todas las emociones que vienen con el mismo y te pido que lo transformes en Paz y Amor de Dios en mi mente. Pido ver inocencia y luz en mí y en mi infancia.

Dios Padre fuente de Luz y de toda Sanación, en tus manos pongo mi mente para que todo sea sanado y llevado de acuerdo a tu voluntad.

Dame Paz.`
  },
  {
    id: 'sanar-mama-papa',
    title: 'Oración para sanar con Mamá o Papá',
    category: 'familia',
    categoryLabel: 'Familia e Hijos',
    description: 'Para liberar memorias, juicios y dolores vinculados a la figura materna o paterna.',
    textTemplate: `Espíritu Santo te pido te manifiestes en mi mente.

Te pido me muestres una imagen o un recuerdo de lo que yo debo sanar con {progenitor}.

*Instrucción: aquí cierras los ojos y esperas 1 o 2 min. para recibir cualquier imagen o recuerdo que el Espíritu Santo quiera mostrarte. Permítete sentir las emociones que emanan y no las juzgues.*

Espíritu Santo, te entrego este recuerdo y todas las emociones que vienen con el mismo y te pido que lo transformes en Paz y Amor de Dios en mi mente. Pido ver inocencia y luz en {progenitor}, y sentir el Amor de Dios por él/ella y unirme a él/ella en dicho amor.

Dios Padre fuente de Luz y de toda Sanación, en tus manos pongo mi mente para que todo sea sanado y llevado de acuerdo a tu voluntad.

Dame Paz.`,
    fields: [
      { key: 'progenitor', label: 'Mamá o Papá (con nombre opcional)', placeholder: 'ej. mi mamá María, mi papá José...' }
    ]
  },
  {
    id: 'amor-propio',
    title: 'Oración de Amor Propio',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para disolver el rechazo, la tristeza y la falta de valor propio, reconociéndose como hijo/a amado/a de Dios.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

Espíritu Santo, te entrego todo juicio, resentimiento, rechazo, tristeza y falta de valor que tengo conmigo misma/o. Te pido reemplazes todo por la paz y el amor de Dios en mi mente.

Pido ver la luz de Dios en mí. Pido ver la faz de Cristo en mí.

Espíritu Santo, enséñame a amarme tal y como Dios me ama. Ayúdame a recordar que soy hijo/a de Dios, su ser amado y que su amor está y estará conmigo siempre.

Dios Padre en tus manos pongo mi mente para que sea sanada por tu amor.

Hágase tu voluntad.`
  },
  {
    id: 'relaciones-sanas',
    title: 'Oración para Relaciones Sanas',
    category: 'relaciones',
    categoryLabel: 'Relaciones y Pareja',
    description: 'Para liberar proyecciones, juicios y apegos en una relación y darle el propósito divino.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

Espíritu Santo, te entrego todos los juicios, miedos, apegos, culpas, resentimientos y conflictos emocionales que he proyectado en {personaRelacion} y en su lugar pido el Amor y la Paz de Dios en mi mente.

Pido que me ayudes a ver la inocencia del SER verdadero de {personaRelacion} y a su vez permíteme ver la inocencia de mi SER verdadero. Te pido que me muestres la Luz del Espíritu de {personaRelacion} y a su vez pido que me reveles la Luz de mi Espíritu.

Pido ver la Faz de Cristo en {personaRelacion} y en mí. Espíritu Santo, corrige mi percepción sobre la relación que tengo con {personaRelacion} y dale el propósito de Dios.

Elijo sentir el amor de Dios por {personaRelacion} y unirme a él/ella en dicho Amor. Dios Padre enséñame a Amar como tú lo haces con tus hijos.

Hágase tu voluntad.`,
    fields: [
      { key: 'personaRelacion', label: 'Nombre de la pareja o persona', placeholder: 'ej. mi pareja Carlos, socio...' }
    ]
  },
  {
    id: 'proposito-dios-actividad',
    title: 'Oración para darle Propósito de Dios a cada actividad en tu Relación',
    category: 'relaciones',
    categoryLabel: 'Relaciones y Pareja',
    description: 'Para encomendar encuentros, conversaciones o comidas al Espíritu Santo.',
    textTemplate: `Espíritu Santo te pido te manifiestes en mi mente.

Pongo en tus manos esta conversación, encuentro, almuerzo o actividad que tendré con {actividadCon} para que le des el propósito de Dios.

Pido ver la faz de Cristo en {actividadCon}.

Dios Padre, hágase tu voluntad.`,
    fields: [
      { key: 'actividadCon', label: 'Nombre de la persona o actividad', placeholder: 'ej. mi reunión con Ana, almuerzo familiar...' }
    ]
  },
  {
    id: 'pedir-por-otros',
    title: 'Oración para pedir por Otros',
    category: 'familia',
    categoryLabel: 'Familia e Hijos',
    description: 'Para no unirse al sufrimiento ajeno y convertirse en canal de paz y amor.',
    textTemplate: `Jesús, te pido te manifiestes en mi mente.

Dame tu fortaleza para no unirme al sufrimiento de {otro} y permíteme ser un canal de tu Amor y de tu Paz. Estoy dispuesto a renunciar a todos los juicios, preocupaciones, miedos y resentimientos en mí y compartir tu Amor con {otro}.

Jesús, en relación a {otro} pido ver su Ser verdadero y la Luz de su Espíritu. Pido Ver la Faz de Cristo en {otro}. Corrige mi percepción sobre {otro} y de igual manera corrige la percepción de {otro} sobre sí misma/o.

Dios padre, fuente de Luz y de toda sanación, en tus manos pongo a {otro} para que todo sea sanado y llevado de acuerdo a tu voluntad.

Amén.`,
    fields: [
      { key: 'otro', label: 'Nombre de la persona', placeholder: 'ej. mi amigo Pedro, mi compañero...' }
    ]
  },
  {
    id: 'volver-camino-paz',
    title: 'Oración para volver al Camino de la Paz',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para entregar confusión, soledad, dudas e incertidumbre al Espíritu Santo.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

Espíritu Santo, te entrego mi confusión, este miedo que tengo a diferentes cosas en mi mente, te entrego el sentimiento de soledad, te entrego mis dudas e incertidumbres, te entrego mi dolor y conflictos de mi mente y en su lugar pido que sea reemplazado por el Amor, la Luz y la Paz de Dios en mi mente.

Espíritu Santo pido tu guía en mi vida, pido que el amor de Dios guíe mi vida. Espíritu Santo te pido me reveles la verdad de mi ser verdadero y que me ayudes a conectar con toda la esencia de mi ser.

Espíritu Santo, te pido me muestres la luz de mi espíritu y que esta luz guíe mi vida.

Dios Padre, en tus manos pongo mi mente y mi vida para que todo sea llevado de acuerdo a tu voluntad.`
  },
  {
    id: 'poner-todo-manos-dios',
    title: 'Oración para poner todo en manos de Dios',
    category: 'conflictos',
    categoryLabel: 'Conflictos y Juicios',
    description: 'Para encomendar reuniones, juntas, trabajo o asuntos cotidianos al propósito de paz del Espíritu Santo.',
    textTemplate: `Dios Padre, en tus manos pongo este día para que todo sea llevado de acuerdo con tu voluntad.

Dios Padre, en tus manos pongo la siguiente {asunto} para que el Espíritu Santo le dé un propósito de Paz y de Amor.

Hágase tu voluntad.

*(Y también puedes poner cualquier aspecto de la vida en manos de Dios: reunión con mi pareja, espacio de juego, cocinar, etc.)*`,
    fields: [
      { key: 'asunto', label: 'Asunto, reunión o actividad', placeholder: 'ej. reunión con mi jefe, proyecto de trabajo...' }
    ]
  },
  {
    id: 'oracion-pura',
    title: 'Oración Pura',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Breve y potente plegaria para recordar la inocencia del ser verdadero en todos.',
    textTemplate: `Dios Padre, te pido te manifiestes en mi mente.

"Dios revélame la Verdad y muéstrame la inocencia de mi ser verdadero. Llévame a la Luz para que la pueda ver en todos. Deseo unirme a tu amor en la eternidad."

Hágase tu voluntad.`
  },
  {
    id: 'cuando-tengas-pesadillas',
    title: 'Oración para cuando tengas pesadillas',
    category: 'sanacion',
    categoryLabel: 'Sanación y Paz Interior',
    description: 'Para neutralizar el efecto de un mal sueño o pesadilla al despertar.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

"Espíritu Santo, te entrego esta pesadilla, libérame de ella y de los sentimientos, deseos y pensamientos que tuve en la misma, te pido que todo ello lo reemplaces por la Luz, Paz y Amor de Dios."`
  },
  {
    id: 'resolver-conflictos',
    title: 'Oración para resolver conflictos',
    category: 'conflictos',
    categoryLabel: 'Conflictos y Juicios',
    description: 'Para entregar problemas específicos y disolver juicios sobre los involucrados.',
    textTemplate: `Espíritu Santo, te pido te manifiestes en mi mente.

"Espíritu Santo, en tus Manos pongo este problema que tengo ({problemaConflicto}); te pido que lo resuelvas de acuerdo con Tu Voluntad."

*Trae a tu mente a todas las personas involucradas en el problema. Luego haz esta petición:*

"Espíritu Santo, libérame de todos los juicios que he emitido acerca de este problema o situación, así como de los juicios que he hecho en contra de las personas involucradas. En lugar de mis juicios, quiero ver Inocencia y Luz en dichas personas y sentir el amor de Dios por ellas y unirme a ellas en dicho Amor."`,
    fields: [
      { key: 'problemaConflicto', label: 'Descripción del conflicto', placeholder: 'ej. desacuerdo financiero, malentendido familiar...' }
    ]
  }
];
