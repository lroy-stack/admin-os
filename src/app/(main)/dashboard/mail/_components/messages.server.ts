import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type MailMessages, mailMessageKey } from "./messages";

const en: MailMessages = {
  meta: {
    title: "Open source email client with shadcn/ui",
    description:
      "Explore an open source email client with inbox navigation, message search, reading, replying, and archiving.",
  },
  loading: "Loading mail…",
  nav: {
    inbox: "Inbox",
    priority: "Priority",
    drafts: "Drafts",
    sent: "Sent",
    archive: "Archive",
    trash: "Trash",
  },
  sidebar: {
    newEmail: "New email",
    folders: "Folders",
    accounts: "Accounts",
    selectAccount: "Select {name}",
    openMenuOf: "Open {name} menu",
    keyboardShortcuts: "Keyboard shortcuts",
  },
  inbox: {
    title: "Inbox",
    search: "Search…",
    viewOptions: "View options",
    pinned: "Pinned",
    sortBy: "Sort by",
    sorts: { newest: "Newest first", oldest: "Oldest first", unread: "Unread first" },
    noResults: "No messages found",
    noResultsHint: "Try a different word, or clear the search.",
    emptyFolder: "No messages",
    emptyFolderHint: "This folder has nothing in it yet.",
    groupTitle: "{title} ({count})",
  },
  view: {
    close: "Close message",
    previous: "Previous message",
    next: "Next message",
    pinThread: "Pin thread",
    archive: "Archive",
    reply: "Reply",
    moreActions: "More actions",
    replyAll: "Reply all",
    forward: "Forward",
    markUnread: "Mark as unread",
    addLabel: "Add label",
    moveToTrash: "Move to trash",
    to: "To:",
    cc: "Cc:",
    attachments: "Attachments ({count})",
    replyPlaceholder: "Reply to {name}…",
    send: "Send",
    empty: "No email selected",
    drawerTitle: "Mail message",
    drawerDescription: "Read the selected email message",
    toast: { archived: "Message archived", trashed: "Message moved to trash" },
  },
  labels: {
    meeting: "Meeting",
    work: "Work",
    important: "Important",
    personal: "Personal",
    budget: "Budget",
    conference: "Conference",
    travel: "Travel",
  },
  shortcuts: {
    title: "Keyboard shortcuts",
    description: "Keys that work in the mail list and the open message.",
    next: "Next message",
    previous: "Previous message",
    archive: "Archive",
    search: "Search",
  },
  size: { kb: "{size} KB", mb: "{size} MB" },
  demo: {
    attachments: {
      "admin-os-fig": "admin-os.fig",
      "features-docx": "features.docx",
      "preview-png": "preview.png",
      "project-notes-docx": "project-notes.docx",
      "budget-analysis-docx": "budget-analysis.docx",
      "proposal-layout-fig": "proposal-layout.fig",
      "conference-schedule-png": "conference-schedule.png",
    },
    mails: {
      "6c84fb90-12c4-11e1-840d-7b25c5ee775a": {
        subject: "Meeting Tomorrow",
        body: "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.\n\nPlease come prepared with any questions or insights you may have. Looking forward to our meeting!\n\nBest regards, William",
      },
      "110e8400-e29b-11d4-a716-446655440000": {
        subject: "Re: Project Update",
        body: "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in.\n\nI have a few minor suggestions that I'll include in the attached document.\n\nLet's discuss these during our next meeting. Keep up the excellent work!\n\nBest regards, Alice",
      },
      "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2": {
        subject: "Weekend Plans",
        body: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun.\n\nIf you're interested, let me know, and we can plan the details. It'll be a great way to unwind and enjoy nature.\n\nLooking forward to your response!\n\nBest, Bob",
      },
      "61c35085-72d7-42b4-8d62-738f700d4b92": {
        subject: "Re: Question about Budget",
        body: "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources.\n\nI've reviewed the budget report and identified a few areas where we might be able to optimize our spending without compromising the project's quality.\n\nI've attached a detailed analysis for your reference. Let's discuss this further in our next meeting.\n\nThanks, Emily",
      },
      "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97": {
        subject: "Important Announcement",
        body: "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs.\n\nThis change is crucial to our success, and I look forward to discussing it with the team. Please be prepared to share your insights during the meeting.\n\nRegards, Michael",
      },
      "1f0f2c02-e299-40de-9b1d-86ef9e42126b": {
        subject: "Re: Feedback on Proposal",
        body: "Thank you for your feedback on the proposal. It looks great! I'm pleased to hear that you found it promising. The team worked diligently to address all the key points you raised, and I believe we now have a strong foundation for the project.\n\nI've attached the revised proposal for your review.\n\nPlease let me know if you have any further comments or suggestions. Looking forward to your response.\n\nBest regards, Sarah",
      },
      "17c0a96d-4415-42b1-8b4f-764efab57f66": {
        subject: "New Project Idea",
        body: "I have an exciting new project idea to discuss with you. It involves expanding our services to target a niche market that has shown considerable growth in recent months.\n\nI've prepared a detailed proposal outlining the potential benefits and the strategy for execution.\n\nThis project has the potential to significantly impact our business positively. Let's set up a meeting to dive into the details and determine if it aligns with our current goals.\n\nBest regards, David",
      },
      "2f0130cb-39fc-44c4-bb3c-0a4337edaaab": {
        subject: "Vacation Plans",
        body: "Let's plan our vacation for next month. What do you think? I've been thinking of visiting a tropical paradise, and I've put together some destination options.\n\nI believe it's time for us to unwind and recharge. Please take a look at the options and let me know your preferences.\n\nWe can start making arrangements to ensure a smooth and enjoyable trip.\n\nExcited to hear your thoughts! Olivia",
      },
      "de305d54-75b4-431b-adb2-eb6b9e546014": {
        subject: "Re: Conference Registration",
        body: "I've completed the registration for the conference next month. The event promises to be a great networking opportunity, and I'm looking forward to attending the various sessions and connecting with industry experts.\n\nI've also attached the conference schedule for your reference.\n\nIf there are any specific topics or sessions you'd like me to explore, please let me know. It's an exciting event, and I'll make the most of it.\n\nBest regards, James",
      },
      "7dd90c63-00f6-40f3-bd87-5060a24e8ee7": {
        subject: "Team Dinner",
        body: "Let's have a team dinner next week to celebrate our success. We've achieved some significant milestones, and it's time to acknowledge our hard work and dedication.\n\nI've made reservations at a lovely restaurant, and I'm sure it'll be an enjoyable evening.\n\nPlease confirm your availability and any dietary preferences. Looking forward to a fun and memorable dinner with the team!\n\nBest, Sophia",
      },
      "99a88f78-3eb4-4d87-87b7-7b15a49a0a05": {
        subject: "Feedback Request",
        body: "I'd like your feedback on the latest project deliverables. We've made significant progress, and I value your input to ensure we're on the right track.\n\nI've attached the deliverables for your review, and I'm particularly interested in any areas where you think we can further enhance the quality or efficiency.\n\nYour feedback is invaluable, and I appreciate your time and expertise. Let's work together to make this project a success.\n\nRegards, Daniel",
      },
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        subject: "Re: Meeting Agenda",
        body: "Here's the agenda for our meeting next week. I've included all the topics we need to cover, as well as time allocations for each.\n\nIf you have any additional items to discuss or any specific points to address, please let me know, and we can integrate them into the agenda.\n\nIt's essential that our meeting is productive and addresses all relevant matters.\n\nLooking forward to our meeting! Ava",
      },
      "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6": {
        subject: "Product Launch Update",
        body: "The product launch is on track. I'll provide an update during our call. We've made substantial progress in the development and marketing of our new product.\n\nI'm excited to share the latest updates with you during our upcoming call. It's crucial that we coordinate our efforts to ensure a successful launch. Please come prepared with any questions or insights you may have.\n\nLet's make this product launch a resounding success!\n\nBest regards, William",
      },
      "ba54eefd-4097-4949-99f2-2a9ae4d1a836": {
        subject: "Re: Travel Itinerary",
        body: "I've received the travel itinerary. It looks great! Thank you for your prompt assistance in arranging the details. I've reviewed the schedule and the accommodations, and everything seems to be in order. I'm looking forward to the trip, and I'm confident it'll be a smooth and enjoyable experience.\n\nIf there are any specific activities or attractions you recommend at our destination, please feel free to share your suggestions.\n\nExcited for the trip! Mia",
      },
      "df09b6ed-28bd-4e0c-85a9-9320ec5179aa": {
        subject: "Team Building Event",
        body: "Let's plan a team-building event for our department. Team cohesion and morale are vital to our success, and I believe a well-organized team-building event can be incredibly beneficial. I've done some research and have a few ideas for fun and engaging activities.\n\nPlease let me know your thoughts and availability. We want this event to be both enjoyable and productive.\n\nTogether, we'll strengthen our team and boost our performance.\n\nRegards, Ethan",
      },
      "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d": {
        subject: "Re: Budget Approval",
        body: "The budget has been approved. We can proceed with the project. I'm delighted to inform you that our budget proposal has received the green light from the finance department. This is a significant milestone, and it means we can move forward with the project as planned.\n\nI've attached the finalized budget for your reference. Let's ensure that we stay on track and deliver the project on time and within budget.\n\nIt's an exciting time for us! Chloe",
      },
      "6c9a7f94-8329-4d70-95d3-51f68c186ae1": {
        subject: "Weekend Hike",
        body: "Who's up for a weekend hike in the mountains? I've been craving some outdoor adventure, and a hike in the mountains sounds like the perfect escape. If you're up for the challenge, we can explore some scenic trails and enjoy the beauty of nature.\n\nI've done some research and have a few routes in mind.\n\nLet me know if you're interested, and we can plan the details.\n\nIt's sure to be a memorable experience! Samuel",
      },
    },
  },
};

const es: MailMessages = {
  meta: {
    title: "Cliente de correo de código abierto con shadcn/ui",
    description:
      "Explora un cliente de correo de código abierto con navegación por la bandeja de entrada, búsqueda de mensajes, lectura, respuesta y archivado.",
  },
  loading: "Cargando correo…",
  nav: {
    inbox: "Bandeja de entrada",
    priority: "Prioritarios",
    drafts: "Borradores",
    sent: "Enviados",
    archive: "Archivados",
    trash: "Papelera",
  },
  sidebar: {
    newEmail: "Nuevo correo",
    folders: "Carpetas",
    accounts: "Cuentas",
    selectAccount: "Seleccionar {name}",
    openMenuOf: "Abrir menú de {name}",
    keyboardShortcuts: "Atajos de teclado",
  },
  inbox: {
    title: "Bandeja de entrada",
    search: "Buscar…",
    viewOptions: "Opciones de vista",
    pinned: "Fijados",
    sortBy: "Ordenar por",
    sorts: { newest: "Más recientes primero", oldest: "Más antiguos primero", unread: "No leídos primero" },
    noResults: "No se encontraron mensajes",
    noResultsHint: "Prueba con otra palabra o borra la búsqueda.",
    emptyFolder: "Sin mensajes",
    emptyFolderHint: "Esta carpeta aún está vacía.",
    groupTitle: "{title} ({count})",
  },
  view: {
    close: "Cerrar mensaje",
    previous: "Mensaje anterior",
    next: "Mensaje siguiente",
    pinThread: "Fijar conversación",
    archive: "Archivar",
    reply: "Responder",
    moreActions: "Más acciones",
    replyAll: "Responder a todos",
    forward: "Reenviar",
    markUnread: "Marcar como no leído",
    addLabel: "Añadir etiqueta",
    moveToTrash: "Mover a la papelera",
    to: "Para:",
    cc: "CC:",
    attachments: "Archivos adjuntos ({count})",
    replyPlaceholder: "Responder a {name}…",
    send: "Enviar",
    empty: "Ningún correo seleccionado",
    drawerTitle: "Mensaje de correo",
    drawerDescription: "Lee el mensaje de correo seleccionado",
    toast: { archived: "Mensaje archivado", trashed: "Mensaje movido a la papelera" },
  },
  labels: {
    meeting: "Reunión",
    work: "Trabajo",
    important: "Importante",
    personal: "Personal",
    budget: "Presupuesto",
    conference: "Conferencia",
    travel: "Viaje",
  },
  shortcuts: {
    title: "Atajos de teclado",
    description: "Teclas que funcionan en la lista de correo y en el mensaje abierto.",
    next: "Mensaje siguiente",
    previous: "Mensaje anterior",
    archive: "Archivar",
    search: "Buscar",
  },
  size: { kb: "{size} KB", mb: "{size} MB" },
  demo: {
    attachments: {
      "admin-os-fig": "admin-os.fig",
      "features-docx": "funciones.docx",
      "preview-png": "vista-previa.png",
      "project-notes-docx": "notas-del-proyecto.docx",
      "budget-analysis-docx": "analisis-del-presupuesto.docx",
      "proposal-layout-fig": "maqueta-propuesta.fig",
      "conference-schedule-png": "programa-conferencia.png",
    },
    mails: {
      "6c84fb90-12c4-11e1-840d-7b25c5ee775a": {
        subject: "Reunión mañana",
        body: "Hola, vamos a reunirnos mañana para hablar del proyecto. He estado revisando los detalles y tengo algunas ideas que me gustaría compartir. Es fundamental que nos pongamos de acuerdo sobre los próximos pasos para asegurar el éxito del proyecto.\n\nVen preparado con las preguntas o ideas que tengas. ¡Tengo ganas de reunirnos!\n\nUn saludo, William",
      },
      "110e8400-e29b-11d4-a716-446655440000": {
        subject: "Re: Actualización del proyecto",
        body: "Gracias por la actualización del proyecto. ¡Tiene muy buena pinta! He revisado el informe y el avance es impresionante. El equipo ha hecho un trabajo fantástico y agradezco el esfuerzo de todos.\n\nTengo un par de sugerencias menores que incluiré en el documento adjunto.\n\nLas comentamos en nuestra próxima reunión. ¡Sigue así!\n\nUn saludo, Alice",
      },
      "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2": {
        subject: "Planes para el fin de semana",
        body: "¿Tienes planes para el fin de semana? Estaba pensando en ir de excursión a la montaña de aquí al lado. Hace tiempo que no hacemos algo al aire libre.\n\nSi te apetece, dímelo y organizamos los detalles. Será una buena forma de desconectar y disfrutar de la naturaleza.\n\n¡Espero tu respuesta!\n\nUn abrazo, Bob",
      },
      "61c35085-72d7-42b4-8d62-738f700d4b92": {
        subject: "Re: Pregunta sobre el presupuesto",
        body: "Tengo una pregunta sobre el presupuesto del próximo proyecto. Parece que hay una discrepancia en la asignación de recursos.\n\nHe revisado el informe presupuestario y he identificado varias áreas en las que podríamos optimizar el gasto sin comprometer la calidad del proyecto.\n\nAdjunto un análisis detallado para que lo consultes. Lo hablamos con más calma en nuestra próxima reunión.\n\nGracias, Emily",
      },
      "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97": {
        subject: "Anuncio importante",
        body: "Tengo un anuncio importante que hacer durante nuestra reunión de equipo. Se trata de un cambio estratégico en nuestro enfoque del próximo lanzamiento del producto. Hemos recibido comentarios muy valiosos de nuestros beta testers y creo que es el momento de hacer algunos ajustes para responder mejor a las necesidades de nuestros clientes.\n\nEste cambio es crucial para nuestro éxito y tengo ganas de comentarlo con el equipo. Ven preparado para aportar tu opinión durante la reunión.\n\nSaludos, Michael",
      },
      "1f0f2c02-e299-40de-9b1d-86ef9e42126b": {
        subject: "Re: Comentarios sobre la propuesta",
        body: "Gracias por tus comentarios sobre la propuesta. ¡Qué bien! Me alegra saber que te ha parecido prometedora. El equipo trabajó con esmero para abordar todos los puntos clave que planteaste y creo que ahora tenemos una base sólida para el proyecto.\n\nAdjunto la propuesta revisada para que le eches un vistazo.\n\nSi tienes más comentarios o sugerencias, házmelo saber. Quedo a la espera de tu respuesta.\n\nUn saludo, Sarah",
      },
      "17c0a96d-4415-42b1-8b4f-764efab57f66": {
        subject: "Nueva idea de proyecto",
        body: "Tengo una idea de proyecto muy interesante que comentarte. Consiste en ampliar nuestros servicios a un mercado de nicho que ha crecido bastante en los últimos meses.\n\nHe preparado una propuesta detallada con los posibles beneficios y la estrategia de ejecución.\n\nEste proyecto puede tener un impacto muy positivo en nuestro negocio. Fijemos una reunión para ver los detalles y decidir si encaja con nuestros objetivos actuales.\n\nUn saludo, David",
      },
      "2f0130cb-39fc-44c4-bb3c-0a4337edaaab": {
        subject: "Planes de vacaciones",
        body: "Planeemos nuestras vacaciones del mes que viene. ¿Qué te parece? He pensado en visitar algún paraíso tropical y he preparado varias opciones de destino.\n\nCreo que ha llegado el momento de desconectar y recargar pilas. Échale un vistazo a las opciones y dime cuáles prefieres.\n\nPodemos empezar a organizarlo todo para que el viaje sea tranquilo y agradable.\n\n¡Tengo ganas de saber qué opinas! Olivia",
      },
      "de305d54-75b4-431b-adb2-eb6b9e546014": {
        subject: "Re: Inscripción a la conferencia",
        body: "He completado la inscripción a la conferencia del mes que viene. Promete ser una gran oportunidad para hacer contactos y tengo ganas de asistir a las distintas sesiones y conocer a expertos del sector.\n\nTambién adjunto el programa de la conferencia para tu consulta.\n\nSi hay algún tema o sesión concreta que quieras que explore, dímelo. Es un evento muy interesante y voy a aprovecharlo al máximo.\n\nUn saludo, James",
      },
      "7dd90c63-00f6-40f3-bd87-5060a24e8ee7": {
        subject: "Cena de equipo",
        body: "Hagamos una cena de equipo la semana que viene para celebrar nuestro éxito. Hemos alcanzado hitos importantes y es hora de reconocer nuestro esfuerzo y dedicación.\n\nHe reservado en un restaurante muy agradable y seguro que será una velada estupenda.\n\nConfirma tu disponibilidad y cualquier preferencia alimentaria. ¡Tengo ganas de una cena divertida y memorable con el equipo!\n\nUn abrazo, Sophia",
      },
      "99a88f78-3eb4-4d87-87b7-7b15a49a0a05": {
        subject: "Solicitud de comentarios",
        body: "Me gustaría conocer tu opinión sobre los últimos entregables del proyecto. Hemos avanzado bastante y valoro tu criterio para asegurarnos de que vamos por buen camino.\n\nTe adjunto los entregables para que los revises; me interesan especialmente los aspectos en los que creas que podemos mejorar la calidad o la eficiencia.\n\nTus comentarios son muy valiosos y agradezco tu tiempo y tu experiencia. Trabajemos juntos para que este proyecto sea un éxito.\n\nSaludos, Daniel",
      },
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        subject: "Re: Orden del día de la reunión",
        body: "Te envío el orden del día de nuestra reunión de la semana que viene. He incluido todos los temas que debemos tratar, con el tiempo asignado a cada uno.\n\nSi tienes algún punto adicional que comentar o algo concreto que abordar, dímelo y lo incorporamos.\n\nEs esencial que la reunión sea productiva y que cubra todos los asuntos relevantes.\n\n¡Nos vemos en la reunión! Ava",
      },
      "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6": {
        subject: "Novedades del lanzamiento del producto",
        body: "El lanzamiento del producto va según lo previsto. Te daré novedades durante nuestra llamada. Hemos avanzado mucho en el desarrollo y el marketing de nuestro nuevo producto.\n\nTengo ganas de compartir contigo las últimas novedades en la próxima llamada. Es fundamental coordinar nuestros esfuerzos para que el lanzamiento sea un éxito. Ven preparado con las preguntas o ideas que tengas.\n\n¡Hagamos de este lanzamiento un éxito rotundo!\n\nUn saludo, William",
      },
      "ba54eefd-4097-4949-99f2-2a9ae4d1a836": {
        subject: "Re: Itinerario del viaje",
        body: "He recibido el itinerario del viaje. ¡Me parece genial! Gracias por tu rapidez al organizar los detalles. He revisado el calendario y los alojamientos, y todo parece estar en orden. Tengo ganas de que llegue el viaje y confío en que será tranquilo y agradable.\n\nSi hay alguna actividad o atracción que recomiendes en el destino, no dudes en compartir tus sugerencias.\n\n¡Qué ganas de viajar! Mia",
      },
      "df09b6ed-28bd-4e0c-85a9-9320ec5179aa": {
        subject: "Evento de team building",
        body: "Organicemos un evento de team building para nuestro departamento. La cohesión y la motivación del equipo son fundamentales para nuestro éxito, y creo que una actividad bien organizada puede ser muy beneficiosa. He investigado un poco y tengo algunas ideas de actividades divertidas y atractivas.\n\nDime qué opinas y cuándo te viene bien. Queremos que el evento sea agradable y productivo a la vez.\n\nJuntos fortaleceremos al equipo y mejoraremos nuestro rendimiento.\n\nSaludos, Ethan",
      },
      "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d": {
        subject: "Re: Aprobación del presupuesto",
        body: "El presupuesto ha sido aprobado. Podemos seguir adelante con el proyecto. Me complace informarte de que nuestra propuesta de presupuesto ha recibido luz verde del departamento de finanzas. Es un hito importante y significa que podemos avanzar con el proyecto según lo previsto.\n\nTe adjunto el presupuesto definitivo para tu consulta. Asegurémonos de mantenernos en el camino y entregar el proyecto a tiempo y dentro del presupuesto.\n\n¡Es un momento emocionante para nosotros! Chloe",
      },
      "6c9a7f94-8329-4d70-95d3-51f68c186ae1": {
        subject: "Excursión de fin de semana",
        body: "¿Quién se apunta a una excursión de fin de semana por la montaña? Tengo ganas de aventura al aire libre y una caminata por la montaña me parece la escapada perfecta. Si te animas, podemos recorrer algunos senderos con vistas y disfrutar de la naturaleza.\n\nHe investigado un poco y tengo algunas rutas en mente.\n\nDime si te interesa y organizamos los detalles.\n\n¡Seguro que será una experiencia inolvidable! Samuel",
      },
    },
  },
};

const de: MailMessages = {
  meta: {
    title: "Open-Source-E-Mail-Client mit shadcn/ui",
    description:
      "Entdecke einen Open-Source-E-Mail-Client mit Posteingangsnavigation, Nachrichtensuche, Lesen, Antworten und Archivieren.",
  },
  loading: "E-Mails werden geladen…",
  nav: {
    inbox: "Posteingang",
    priority: "Priorität",
    drafts: "Entwürfe",
    sent: "Gesendet",
    archive: "Archiv",
    trash: "Papierkorb",
  },
  sidebar: {
    newEmail: "Neue E-Mail",
    folders: "Ordner",
    accounts: "Konten",
    selectAccount: "{name} auswählen",
    openMenuOf: "Menü von {name} öffnen",
    keyboardShortcuts: "Tastenkürzel",
  },
  inbox: {
    title: "Posteingang",
    search: "Suchen…",
    viewOptions: "Ansichtsoptionen",
    pinned: "Angepinnt",
    sortBy: "Sortieren nach",
    sorts: { newest: "Neueste zuerst", oldest: "Älteste zuerst", unread: "Ungelesene zuerst" },
    noResults: "Keine Nachrichten gefunden",
    noResultsHint: "Versuche ein anderes Wort oder lösche die Suche.",
    emptyFolder: "Keine Nachrichten",
    emptyFolderHint: "In diesem Ordner liegt noch nichts.",
    groupTitle: "{title} ({count})",
  },
  view: {
    close: "Nachricht schließen",
    previous: "Vorherige Nachricht",
    next: "Nächste Nachricht",
    pinThread: "Unterhaltung anpinnen",
    archive: "Archivieren",
    reply: "Antworten",
    moreActions: "Weitere Aktionen",
    replyAll: "Allen antworten",
    forward: "Weiterleiten",
    markUnread: "Als ungelesen markieren",
    addLabel: "Label hinzufügen",
    moveToTrash: "In den Papierkorb verschieben",
    to: "An:",
    cc: "Cc:",
    attachments: "Anhänge ({count})",
    replyPlaceholder: "{name} antworten…",
    send: "Senden",
    empty: "Keine E-Mail ausgewählt",
    drawerTitle: "E-Mail-Nachricht",
    drawerDescription: "Lies die ausgewählte E-Mail-Nachricht",
    toast: { archived: "Nachricht archiviert", trashed: "Nachricht in den Papierkorb verschoben" },
  },
  labels: {
    meeting: "Besprechung",
    work: "Arbeit",
    important: "Wichtig",
    personal: "Privat",
    budget: "Budget",
    conference: "Konferenz",
    travel: "Reise",
  },
  shortcuts: {
    title: "Tastenkürzel",
    description: "Tasten, die in der E-Mail-Liste und in der geöffneten Nachricht funktionieren.",
    next: "Nächste Nachricht",
    previous: "Vorherige Nachricht",
    archive: "Archivieren",
    search: "Suchen",
  },
  size: { kb: "{size} KB", mb: "{size} MB" },
  demo: {
    attachments: {
      "admin-os-fig": "admin-os.fig",
      "features-docx": "Funktionen.docx",
      "preview-png": "Vorschau.png",
      "project-notes-docx": "Projektnotizen.docx",
      "budget-analysis-docx": "Budgetanalyse.docx",
      "proposal-layout-fig": "Angebotslayout.fig",
      "conference-schedule-png": "Konferenzprogramm.png",
    },
    mails: {
      "6c84fb90-12c4-11e1-840d-7b25c5ee775a": {
        subject: "Meeting morgen",
        body: "Hallo, lass uns morgen treffen, um das Projekt zu besprechen. Ich habe mir die Projektdetails angesehen und habe ein paar Ideen, die ich gern mit dir teilen möchte. Wir müssen unbedingt die nächsten Schritte abstimmen, damit das Projekt ein Erfolg wird.\n\nBring bitte alle Fragen und Anregungen mit, die du hast. Ich freue mich auf unser Treffen!\n\nViele Grüße, William",
      },
      "110e8400-e29b-11d4-a716-446655440000": {
        subject: "Re: Projekt-Update",
        body: "Danke für das Projekt-Update. Das sieht großartig aus! Ich habe den Bericht durchgesehen, und die Fortschritte sind beeindruckend. Das Team hat fantastische Arbeit geleistet, und ich schätze den Einsatz aller Beteiligten.\n\nIch habe ein paar kleine Anregungen, die ich in das beigefügte Dokument aufnehme.\n\nLass uns darüber in unserem nächsten Meeting sprechen. Macht weiter so!\n\nViele Grüße, Alice",
      },
      "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2": {
        subject: "Pläne fürs Wochenende",
        body: "Hast du schon etwas für das Wochenende vor? Ich dachte daran, in den Bergen in der Nähe wandern zu gehen. Wir waren schon lange nicht mehr gemeinsam draußen unterwegs.\n\nWenn du Lust hast, sag Bescheid, dann planen wir die Details. Das wäre eine schöne Möglichkeit, abzuschalten und die Natur zu genießen.\n\nIch freue mich auf deine Antwort!\n\nLiebe Grüße, Bob",
      },
      "61c35085-72d7-42b4-8d62-738f700d4b92": {
        subject: "Re: Frage zum Budget",
        body: "Ich habe eine Frage zum Budget für das kommende Projekt. Bei der Verteilung der Ressourcen scheint es eine Unstimmigkeit zu geben.\n\nIch habe den Budgetbericht durchgesehen und einige Bereiche gefunden, in denen wir die Ausgaben optimieren könnten, ohne die Qualität des Projekts zu beeinträchtigen.\n\nEine ausführliche Analyse habe ich dir beigefügt. Lass uns das in unserem nächsten Meeting genauer besprechen.\n\nDanke, Emily",
      },
      "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97": {
        subject: "Wichtige Ankündigung",
        body: "Ich habe in unserem Team-Meeting eine wichtige Ankündigung zu machen. Es geht um eine strategische Neuausrichtung beim bevorstehenden Produktlaunch. Wir haben wertvolles Feedback von unseren Beta-Testern erhalten, und ich glaube, es ist Zeit, einige Anpassungen vorzunehmen, um die Bedürfnisse unserer Kunden besser zu erfüllen.\n\nDiese Änderung ist entscheidend für unseren Erfolg, und ich freue mich darauf, sie mit dem Team zu besprechen. Bitte sei darauf vorbereitet, im Meeting deine Einschätzung zu teilen.\n\nGrüße, Michael",
      },
      "1f0f2c02-e299-40de-9b1d-86ef9e42126b": {
        subject: "Re: Feedback zum Angebot",
        body: "Danke für dein Feedback zum Angebot. Das freut mich! Schön zu hören, dass du es vielversprechend findest. Das Team hat sorgfältig daran gearbeitet, alle von dir genannten Kernpunkte aufzugreifen, und ich glaube, wir haben jetzt eine solide Grundlage für das Projekt.\n\nDas überarbeitete Angebot habe ich zur Durchsicht beigefügt.\n\nSag mir bitte Bescheid, wenn du weitere Anmerkungen oder Vorschläge hast. Ich freue mich auf deine Antwort.\n\nViele Grüße, Sarah",
      },
      "17c0a96d-4415-42b1-8b4f-764efab57f66": {
        subject: "Neue Projektidee",
        body: "Ich habe eine spannende neue Projektidee, die ich mit dir besprechen möchte. Es geht darum, unsere Leistungen auf einen Nischenmarkt auszuweiten, der in den letzten Monaten deutlich gewachsen ist.\n\nIch habe ein ausführliches Konzept mit den möglichen Vorteilen und der Umsetzungsstrategie vorbereitet.\n\nDas Projekt könnte sich sehr positiv auf unser Geschäft auswirken. Lass uns einen Termin vereinbaren, um die Details durchzugehen und zu klären, ob es zu unseren aktuellen Zielen passt.\n\nViele Grüße, David",
      },
      "2f0130cb-39fc-44c4-bb3c-0a4337edaaab": {
        subject: "Urlaubspläne",
        body: "Lass uns unseren Urlaub für nächsten Monat planen. Was meinst du? Ich habe an ein tropisches Paradies gedacht und einige Reiseziele zusammengestellt.\n\nIch finde, es ist Zeit, abzuschalten und neue Energie zu tanken. Schau dir die Optionen an und sag mir, was dir am besten gefällt.\n\nDann können wir mit der Organisation beginnen, damit die Reise reibungslos und schön wird.\n\nIch bin gespannt auf deine Meinung! Olivia",
      },
      "de305d54-75b4-431b-adb2-eb6b9e546014": {
        subject: "Re: Konferenzanmeldung",
        body: "Ich habe mich für die Konferenz im nächsten Monat angemeldet. Die Veranstaltung verspricht eine großartige Gelegenheit zum Netzwerken zu werden, und ich freue mich darauf, die verschiedenen Sessions zu besuchen und mich mit Branchenexperten auszutauschen.\n\nDas Konferenzprogramm habe ich dir ebenfalls beigefügt.\n\nWenn du bestimmte Themen oder Sessions im Blick hast, die ich mir ansehen soll, sag mir Bescheid. Es ist eine spannende Veranstaltung, und ich werde das Beste daraus machen.\n\nViele Grüße, James",
      },
      "7dd90c63-00f6-40f3-bd87-5060a24e8ee7": {
        subject: "Teamessen",
        body: "Lass uns nächste Woche gemeinsam essen gehen, um unseren Erfolg zu feiern. Wir haben einige wichtige Meilensteine erreicht, und es ist an der Zeit, unsere harte Arbeit und unseren Einsatz zu würdigen.\n\nIch habe in einem schönen Restaurant reserviert und bin sicher, dass es ein angenehmer Abend wird.\n\nBitte bestätige mir, ob du kannst, und sag mir, ob es Essenswünsche oder Unverträglichkeiten gibt. Ich freue mich auf ein lustiges und unvergessliches Essen mit dem Team!\n\nLiebe Grüße, Sophia",
      },
      "99a88f78-3eb4-4d87-87b7-7b15a49a0a05": {
        subject: "Bitte um Feedback",
        body: "Ich würde gern dein Feedback zu den neuesten Projektergebnissen hören. Wir sind ein gutes Stück vorangekommen, und deine Einschätzung ist mir wichtig, damit wir auf dem richtigen Weg bleiben.\n\nDie Ergebnisse habe ich dir zur Durchsicht beigefügt. Besonders interessiert mich, wo wir Qualität oder Effizienz noch steigern können.\n\nDein Feedback ist unbezahlbar, und ich danke dir für deine Zeit und dein Fachwissen. Lass uns gemeinsam dafür sorgen, dass das Projekt ein Erfolg wird.\n\nGrüße, Daniel",
      },
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        subject: "Re: Tagesordnung für das Meeting",
        body: "Hier ist die Tagesordnung für unser Meeting nächste Woche. Ich habe alle Themen aufgenommen, die wir besprechen müssen, und für jedes die geplante Zeit angegeben.\n\nWenn du weitere Punkte hast oder etwas Bestimmtes ansprechen möchtest, sag mir Bescheid, dann nehmen wir es in die Tagesordnung auf.\n\nEs ist wichtig, dass unser Meeting produktiv ist und alle relevanten Themen abdeckt.\n\nIch freue mich auf unser Meeting! Ava",
      },
      "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6": {
        subject: "Update zum Produktlaunch",
        body: "Der Produktlaunch liegt im Plan. Ich gebe dir in unserem Call ein Update. Bei Entwicklung und Marketing unseres neuen Produkts haben wir deutliche Fortschritte gemacht.\n\nIch freue mich darauf, dir die neuesten Entwicklungen in unserem nächsten Call vorzustellen. Wir müssen unsere Anstrengungen unbedingt abstimmen, damit der Launch gelingt. Bring bitte alle Fragen und Anregungen mit, die du hast.\n\nLass uns diesen Produktlaunch zu einem großen Erfolg machen!\n\nViele Grüße, William",
      },
      "ba54eefd-4097-4949-99f2-2a9ae4d1a836": {
        subject: "Re: Reiseplan",
        body: "Ich habe den Reiseplan erhalten. Er sieht großartig aus! Danke für deine schnelle Hilfe bei der Organisation. Ich habe den Ablauf und die Unterkünfte durchgesehen, und alles scheint in Ordnung zu sein. Ich freue mich auf die Reise und bin sicher, dass sie reibungslos und schön wird.\n\nWenn du Aktivitäten oder Sehenswürdigkeiten am Reiseziel empfehlen kannst, teile gern deine Vorschläge.\n\nIch freue mich schon riesig auf die Reise! Mia",
      },
      "df09b6ed-28bd-4e0c-85a9-9320ec5179aa": {
        subject: "Teambuilding-Event",
        body: "Lass uns ein Teambuilding-Event für unsere Abteilung organisieren. Teamzusammenhalt und Motivation sind entscheidend für unseren Erfolg, und ich glaube, dass ein gut organisiertes Event sehr hilfreich sein kann. Ich habe mich umgesehen und einige Ideen für unterhaltsame und fesselnde Aktivitäten.\n\nSag mir bitte, was du davon hältst und wann du Zeit hast. Das Event soll sowohl Spaß machen als auch etwas bringen.\n\nGemeinsam stärken wir unser Team und steigern unsere Leistung.\n\nGrüße, Ethan",
      },
      "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d": {
        subject: "Re: Budgetfreigabe",
        body: "Das Budget wurde genehmigt. Wir können mit dem Projekt fortfahren. Ich freue mich, dir mitzuteilen, dass unser Budgetvorschlag von der Finanzabteilung freigegeben wurde. Das ist ein wichtiger Meilenstein und bedeutet, dass wir das Projekt wie geplant weiterführen können.\n\nDas endgültige Budget habe ich dir zur Information beigefügt. Lass uns dafür sorgen, dass wir im Plan bleiben und das Projekt pünktlich und im Budgetrahmen abliefern.\n\nEs ist eine spannende Zeit für uns! Chloe",
      },
      "6c9a7f94-8329-4d70-95d3-51f68c186ae1": {
        subject: "Wochenendwanderung",
        body: "Wer hat Lust auf eine Wanderung in den Bergen am Wochenende? Ich sehne mich nach einem Outdoor-Abenteuer, und eine Bergwanderung klingt nach der perfekten Auszeit. Wenn du dabei bist, können wir ein paar schöne Wanderwege erkunden und die Natur genießen.\n\nIch habe mich ein wenig umgesehen und ein paar Routen im Kopf.\n\nSag mir, ob du Interesse hast, dann planen wir die Details.\n\nDas wird bestimmt ein unvergessliches Erlebnis! Samuel",
      },
    },
  },
};

const fr: MailMessages = {
  meta: {
    title: "Client de messagerie open source avec shadcn/ui",
    description:
      "Découvrez un client de messagerie open source avec navigation dans la boîte de réception, recherche de messages, lecture, réponse et archivage.",
  },
  loading: "Chargement des e-mails…",
  nav: {
    inbox: "Boîte de réception",
    priority: "Prioritaires",
    drafts: "Brouillons",
    sent: "Envoyés",
    archive: "Archives",
    trash: "Corbeille",
  },
  sidebar: {
    newEmail: "Nouvel e-mail",
    folders: "Dossiers",
    accounts: "Comptes",
    selectAccount: "Sélectionner {name}",
    openMenuOf: "Ouvrir le menu de {name}",
    keyboardShortcuts: "Raccourcis clavier",
  },
  inbox: {
    title: "Boîte de réception",
    search: "Rechercher…",
    viewOptions: "Options d’affichage",
    pinned: "Épinglés",
    sortBy: "Trier par",
    sorts: { newest: "Plus récents d’abord", oldest: "Plus anciens d’abord", unread: "Non lus d’abord" },
    noResults: "Aucun message trouvé",
    noResultsHint: "Essayez un autre mot ou effacez la recherche.",
    emptyFolder: "Aucun message",
    emptyFolderHint: "Ce dossier est encore vide.",
    groupTitle: "{title} ({count})",
  },
  view: {
    close: "Fermer le message",
    previous: "Message précédent",
    next: "Message suivant",
    pinThread: "Épingler la conversation",
    archive: "Archiver",
    reply: "Répondre",
    moreActions: "Plus d’actions",
    replyAll: "Répondre à tous",
    forward: "Transférer",
    markUnread: "Marquer comme non lu",
    addLabel: "Ajouter une étiquette",
    moveToTrash: "Mettre à la corbeille",
    to: "À :",
    cc: "Cc :",
    attachments: "Pièces jointes ({count})",
    replyPlaceholder: "Répondre à {name}…",
    send: "Envoyer",
    empty: "Aucun e-mail sélectionné",
    drawerTitle: "Message e-mail",
    drawerDescription: "Lisez le message e-mail sélectionné",
    toast: { archived: "Message archivé", trashed: "Message mis à la corbeille" },
  },
  labels: {
    meeting: "Réunion",
    work: "Travail",
    important: "Important",
    personal: "Personnel",
    budget: "Budget",
    conference: "Conférence",
    travel: "Voyage",
  },
  shortcuts: {
    title: "Raccourcis clavier",
    description: "Touches qui fonctionnent dans la liste des e-mails et dans le message ouvert.",
    next: "Message suivant",
    previous: "Message précédent",
    archive: "Archiver",
    search: "Rechercher",
  },
  size: { kb: "{size} Ko", mb: "{size} Mo" },
  demo: {
    attachments: {
      "admin-os-fig": "admin-os.fig",
      "features-docx": "fonctionnalités.docx",
      "preview-png": "aperçu.png",
      "project-notes-docx": "notes-du-projet.docx",
      "budget-analysis-docx": "analyse-budgétaire.docx",
      "proposal-layout-fig": "maquette-proposition.fig",
      "conference-schedule-png": "programme-conférence.png",
    },
    mails: {
      "6c84fb90-12c4-11e1-840d-7b25c5ee775a": {
        subject: "Réunion demain",
        body: "Bonjour, voyons-nous demain pour parler du projet. J’ai passé en revue les détails du projet et j’ai quelques idées à partager. Il est essentiel que nous nous accordions sur les prochaines étapes pour garantir la réussite du projet.\n\nVenez avec les questions ou les idées que vous pourriez avoir. J’ai hâte de vous voir !\n\nCordialement, William",
      },
      "110e8400-e29b-11d4-a716-446655440000": {
        subject: "Re : Point d’avancement du projet",
        body: "Merci pour le point d’avancement du projet. C’est très bien ! J’ai parcouru le rapport et les progrès sont impressionnants. L’équipe a fait un travail remarquable et je salue les efforts de chacun.\n\nJ’ai quelques suggestions mineures que j’ajouterai au document joint.\n\nDiscutons-en lors de notre prochaine réunion. Continuez ainsi !\n\nCordialement, Alice",
      },
      "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2": {
        subject: "Projets pour le week-end",
        body: "Avez-vous prévu quelque chose pour le week-end ? Je pensais aller faire une randonnée dans les montagnes voisines. Cela fait longtemps que nous n’avons pas passé un moment en plein air.\n\nSi cela vous tente, faites-le-moi savoir et nous organiserons les détails. Ce sera une belle façon de décompresser et de profiter de la nature.\n\nDans l’attente de votre réponse !\n\nÀ bientôt, Bob",
      },
      "61c35085-72d7-42b4-8d62-738f700d4b92": {
        subject: "Re : Question sur le budget",
        body: "J’ai une question sur le budget du prochain projet. Il semble y avoir un écart dans l’allocation des ressources.\n\nJ’ai examiné le rapport budgétaire et repéré quelques postes où nous pourrions optimiser nos dépenses sans compromettre la qualité du projet.\n\nJe joins une analyse détaillée pour votre information. Nous en reparlerons lors de notre prochaine réunion.\n\nMerci, Emily",
      },
      "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97": {
        subject: "Annonce importante",
        body: "J’ai une annonce importante à faire lors de notre réunion d’équipe. Elle concerne un changement stratégique dans notre approche du prochain lancement de produit. Nous avons reçu de précieux retours de nos bêta-testeurs et je pense qu’il est temps d’apporter quelques ajustements pour mieux répondre aux besoins de nos clients.\n\nCe changement est crucial pour notre réussite et j’ai hâte d’en discuter avec l’équipe. Soyez prêt à partager votre point de vue pendant la réunion.\n\nCordialement, Michael",
      },
      "1f0f2c02-e299-40de-9b1d-86ef9e42126b": {
        subject: "Re : Retour sur la proposition",
        body: "Merci pour vos retours sur la proposition. C’est très encourageant ! Je suis ravie d’apprendre que vous la trouvez prometteuse. L’équipe a travaillé avec application pour traiter tous les points clés que vous avez soulevés et je crois que nous disposons désormais d’une base solide pour le projet.\n\nJe joins la proposition révisée pour relecture.\n\nN’hésitez pas à me faire part de vos autres commentaires ou suggestions. Dans l’attente de votre réponse.\n\nCordialement, Sarah",
      },
      "17c0a96d-4415-42b1-8b4f-764efab57f66": {
        subject: "Nouvelle idée de projet",
        body: "J’ai une nouvelle idée de projet passionnante à vous soumettre. Il s’agit d’élargir nos services à un marché de niche qui a connu une croissance notable ces derniers mois.\n\nJ’ai préparé une proposition détaillée présentant les bénéfices potentiels et la stratégie de mise en œuvre.\n\nCe projet pourrait avoir un impact très positif sur notre activité. Organisons une réunion pour en étudier les détails et déterminer s’il correspond à nos objectifs actuels.\n\nCordialement, David",
      },
      "2f0130cb-39fc-44c4-bb3c-0a4337edaaab": {
        subject: "Projets de vacances",
        body: "Organisons nos vacances du mois prochain. Qu’en pensez-vous ? J’ai pensé à un paradis tropical et j’ai rassemblé quelques destinations possibles.\n\nJe crois qu’il est temps pour nous de décompresser et de nous ressourcer. Jetez un œil aux options et dites-moi lesquelles vous préférez.\n\nNous pourrons alors commencer les préparatifs pour que le voyage soit agréable et sans accroc.\n\nJ’ai hâte de connaître votre avis ! Olivia",
      },
      "de305d54-75b4-431b-adb2-eb6b9e546014": {
        subject: "Re : Inscription à la conférence",
        body: "J’ai terminé mon inscription à la conférence du mois prochain. L’événement promet d’être une excellente occasion de réseauter et j’ai hâte d’assister aux différentes sessions et d’échanger avec des experts du secteur.\n\nJe joins également le programme de la conférence pour information.\n\nSi vous souhaitez que j’explore des thèmes ou des sessions en particulier, dites-le-moi. C’est un événement passionnant et j’en tirerai le meilleur parti.\n\nCordialement, James",
      },
      "7dd90c63-00f6-40f3-bd87-5060a24e8ee7": {
        subject: "Dîner d’équipe",
        body: "Organisons un dîner d’équipe la semaine prochaine pour fêter notre réussite. Nous avons franchi des étapes importantes et il est temps de reconnaître notre travail et notre engagement.\n\nJ’ai réservé dans un joli restaurant et je suis sûre que la soirée sera très agréable.\n\nMerci de confirmer votre disponibilité et vos éventuelles préférences alimentaires. J’ai hâte de partager un dîner joyeux et mémorable avec l’équipe !\n\nÀ bientôt, Sophia",
      },
      "99a88f78-3eb4-4d87-87b7-7b15a49a0a05": {
        subject: "Demande de retour",
        body: "J’aimerais avoir votre avis sur les derniers livrables du projet. Nous avons beaucoup progressé et votre regard m’importe pour nous assurer que nous sommes sur la bonne voie.\n\nJe joins les livrables pour relecture ; je suis particulièrement intéressé par les points où nous pourrions encore améliorer la qualité ou l’efficacité.\n\nVotre avis est précieux et je vous remercie de votre temps et de votre expertise. Travaillons ensemble pour faire de ce projet une réussite.\n\nCordialement, Daniel",
      },
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        subject: "Re : Ordre du jour de la réunion",
        body: "Voici l’ordre du jour de notre réunion de la semaine prochaine. J’y ai inclus tous les sujets à aborder, avec le temps alloué à chacun.\n\nSi vous avez des points supplémentaires à discuter ou des éléments précis à traiter, dites-le-moi et nous les intégrerons à l’ordre du jour.\n\nIl est essentiel que notre réunion soit productive et couvre tous les sujets pertinents.\n\nAu plaisir de vous voir en réunion ! Ava",
      },
      "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6": {
        subject: "Point sur le lancement du produit",
        body: "Le lancement du produit est en bonne voie. Je ferai un point lors de notre appel. Nous avons réalisé des progrès considérables dans le développement et le marketing de notre nouveau produit.\n\nJ’ai hâte de partager les dernières nouvelles avec vous lors de notre prochain appel. Il est essentiel de coordonner nos efforts pour garantir un lancement réussi. Venez avec les questions ou les idées que vous pourriez avoir.\n\nFaisons de ce lancement un succès éclatant !\n\nCordialement, William",
      },
      "ba54eefd-4097-4949-99f2-2a9ae4d1a836": {
        subject: "Re : Itinéraire du voyage",
        body: "J’ai bien reçu l’itinéraire du voyage. Il est parfait ! Merci de votre réactivité pour organiser les détails. J’ai examiné le programme et les hébergements, et tout me semble en ordre. J’ai hâte de partir et je suis certaine que le voyage se déroulera sans accroc.\n\nSi vous avez des activités ou des lieux à recommander sur place, n’hésitez pas à me faire part de vos suggestions.\n\nJ’ai vraiment hâte de partir ! Mia",
      },
      "df09b6ed-28bd-4e0c-85a9-9320ec5179aa": {
        subject: "Événement de team building",
        body: "Organisons un événement de team building pour notre service. La cohésion et le moral de l’équipe sont essentiels à notre réussite, et je pense qu’un événement bien organisé peut être très bénéfique. J’ai fait quelques recherches et j’ai plusieurs idées d’activités ludiques et motivantes.\n\nDites-moi ce que vous en pensez et quelles sont vos disponibilités. Nous voulons que cet événement soit à la fois agréable et productif.\n\nEnsemble, nous renforcerons notre équipe et améliorerons nos performances.\n\nCordialement, Ethan",
      },
      "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d": {
        subject: "Re : Validation du budget",
        body: "Le budget a été approuvé. Nous pouvons poursuivre le projet. J’ai le plaisir de vous annoncer que notre proposition de budget a reçu le feu vert du service financier. C’est une étape importante, qui nous permet d’avancer comme prévu.\n\nJe joins le budget définitif pour votre information. Veillons à rester sur la bonne voie et à livrer le projet dans les délais et dans le budget.\n\nC’est un moment passionnant pour nous ! Chloe",
      },
      "6c9a7f94-8329-4d70-95d3-51f68c186ae1": {
        subject: "Randonnée du week-end",
        body: "Qui est partant pour une randonnée en montagne ce week-end ? J’ai envie d’aventure en plein air, et une randonnée en montagne me semble l’escapade idéale. Si vous êtes de la partie, nous pourrons explorer de beaux sentiers et profiter de la nature.\n\nJ’ai fait quelques recherches et j’ai quelques itinéraires en tête.\n\nDites-moi si cela vous intéresse et nous organiserons les détails.\n\nCe sera sûrement une expérience inoubliable ! Samuel",
      },
    },
  },
};

export const mailMessages = defineMessages<MailMessages>({ en, es, de, fr });

export const mailBundle: MessageBundle<MailMessages> = { key: mailMessageKey, dictionary: mailMessages };
