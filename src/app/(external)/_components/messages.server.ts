import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type LandingMessages, landingMessageKey } from "./messages";

const en: LandingMessages = {
  home: "admin-OS home",
  theme: {
    cycle: "Current theme: {mode}. Click to cycle themes",
    modes: { light: "Light", dark: "Dark", system: "System" },
  },
  language: { label: "Language", failed: "Could not change the language. Try again." },
  hero: {
    title: "The open-source management dashboard for small businesses.",
    lead: "Built for restaurants first, and designed so that a hair salon or a car repair workshop can run on the same modules.",
    status: "In active development towards its first release.",
    demo: "Open the demo",
    github: "View on GitHub",
  },
  showcase: {
    label: "admin-OS preview",
    alt: "admin-OS Home with the preferences panel open: theme, font, language, currency and layout",
  },
  features: {
    eyebrow: "What it does",
    title: "Well designed, reusable at every level, and ready to be managed by an AI assistant.",
    items: {
      bookings: {
        title: "Bookings with a live floor plan",
        description:
          "The room in 2D, 2.5D or 3D with table states you can read from across the room, an arrivals rail planned by time slot, a room editor for several levels and a full-screen service view.",
      },
      glass: {
        title: "Liquid-glass interface",
        description:
          "A glass shell with five themes (Lime, Ember, Rose, Tide, Cobalt), each in light and dark and checked against WCAG contrast, with layout controls and a layout that works on phones and touch screens.",
      },
      presets: {
        title: "Vertical presets",
        description:
          "One codebase for hospitality (tables and covers), salons (chairs and services) and workshops (bays and vehicles). Generic modules sit underneath; only the vocabulary and the seed data change.",
      },
      languages: {
        title: "Four languages, three currencies",
        description:
          "English, Spanish, German and French, with complete dictionaries that lint enforces, and USD, EUR or GBP as the business currency.",
      },
      roles: {
        title: "Roles and permissions",
        description:
          "Owner, manager and staff roles with typed permissions that gate every capability, the MCP tools and the navigation.",
      },
      data: {
        title: "Pluggable data layer",
        description:
          "Every screen reads and writes through typed capabilities. A mock adapter ships for demos, with its own data per visitor; a real backend replaces one adapter.",
      },
      mcp: {
        title: "MCP server",
        description:
          "Any MCP-capable AI assistant can operate the dashboard with the same capabilities and permissions as the screens, over Streamable HTTP or stdio.",
      },
    },
  },
  run: {
    title: "Run it yourself",
    body: "Clone the repository, install the dependencies and start the development server. The mock adapter ships demo data, so every screen works without a backend.",
    stack: "Built with {stack}.",
  },
  links: {
    title: "Project",
    source: "Source code",
    start: "Getting started",
    mcp: "Connect an AI assistant",
    architecture: "Architecture decisions",
    license: "MIT license",
  },
  footer: {
    madeBy: "Made by {author}",
    github: "admin-OS on GitHub",
  },
};

const es: LandingMessages = {
  home: "Inicio de admin-OS",
  theme: {
    cycle: "Apariencia: {mode}. Haz clic para cambiarla",
    modes: { light: "Claro", dark: "Oscuro", system: "Sistema" },
  },
  language: { label: "Idioma", failed: "No se pudo cambiar el idioma. Inténtalo de nuevo." },
  hero: {
    title: "El panel de gestión de código abierto para pequeños negocios.",
    lead: "Pensado primero para restaurantes y diseñado para que una peluquería o un taller mecánico funcionen con los mismos módulos.",
    status: "En desarrollo activo hacia su primera versión.",
    demo: "Abrir la demo",
    github: "Ver en GitHub",
  },
  showcase: {
    label: "Vista previa de admin-OS",
    alt: "Inicio de admin-OS con el panel de preferencias abierto: tema, fuente, idioma, moneda y diseño",
  },
  features: {
    eyebrow: "Qué hace",
    title: "Bien diseñado, reutilizable a todos los niveles y listo para que lo gestione un asistente de IA.",
    items: {
      bookings: {
        title: "Reservas con plano de sala en vivo",
        description:
          "La sala en 2D, 2,5D o 3D con estados de mesa que se leen desde el otro extremo del local, una columna de llegadas planificada por franja horaria, un editor de sala con varias plantas y una vista de servicio a pantalla completa.",
      },
      glass: {
        title: "Interfaz liquid glass",
        description:
          "Una interfaz de cristal con cinco temas (Lime, Ember, Rose, Tide, Cobalt), cada uno en claro y oscuro y verificado según el contraste WCAG, con controles de diseño y una disposición que funciona en móviles y pantallas táctiles.",
      },
      presets: {
        title: "Presets por sector",
        description:
          "Un solo código para hostelería (mesas y comensales), peluquerías (sillones y servicios) y talleres (boxes y vehículos). Debajo hay módulos genéricos; solo cambian el vocabulario y los datos de ejemplo.",
      },
      languages: {
        title: "Cuatro idiomas, tres monedas",
        description:
          "Inglés, español, alemán y francés, con diccionarios completos que el linter hace cumplir, y USD, EUR o GBP como moneda del negocio.",
      },
      roles: {
        title: "Roles y permisos",
        description:
          "Roles de propietario, encargado y personal con permisos tipados que controlan cada capacidad, las herramientas MCP y la navegación.",
      },
      data: {
        title: "Capa de datos intercambiable",
        description:
          "Cada pantalla lee y escribe a través de capacidades tipadas. Incluye un adaptador simulado para demos, con datos propios para cada visitante; un backend real sustituye un solo adaptador.",
      },
      mcp: {
        title: "Servidor MCP",
        description:
          "Cualquier asistente de IA compatible con MCP puede manejar el panel con las mismas capacidades y permisos que las pantallas, por Streamable HTTP o stdio.",
      },
    },
  },
  run: {
    title: "Ejecútalo en tu equipo",
    body: "Clona el repositorio, instala las dependencias e inicia el servidor de desarrollo. El adaptador simulado incluye datos de demostración, así que todas las pantallas funcionan sin backend.",
    stack: "Creado con {stack}.",
  },
  links: {
    title: "Proyecto",
    source: "Código fuente",
    start: "Primeros pasos",
    mcp: "Conectar un asistente de IA",
    architecture: "Decisiones de arquitectura",
    license: "Licencia MIT",
  },
  footer: {
    madeBy: "Hecho por {author}",
    github: "admin-OS en GitHub",
  },
};

const de: LandingMessages = {
  home: "Startseite von admin-OS",
  theme: {
    cycle: "Darstellung: {mode}. Klicken zum Wechseln",
    modes: { light: "Hell", dark: "Dunkel", system: "System" },
  },
  language: { label: "Sprache", failed: "Die Sprache konnte nicht geändert werden. Bitte versuche es erneut." },
  hero: {
    title: "Das Open-Source-Verwaltungsdashboard für kleine Unternehmen.",
    lead: "Zuerst für Restaurants gebaut und so entworfen, dass ein Friseursalon oder eine Kfz-Werkstatt mit denselben Modulen läuft.",
    status: "In aktiver Entwicklung auf dem Weg zur ersten Version.",
    demo: "Demo öffnen",
    github: "Auf GitHub ansehen",
  },
  showcase: {
    label: "Vorschau von admin-OS",
    alt: "Startseite von admin-OS mit geöffneten Einstellungen: Design, Schrift, Sprache, Währung und Layout",
  },
  features: {
    eyebrow: "Was es kann",
    title:
      "Durchdacht gestaltet, auf jeder Ebene wiederverwendbar und bereit, von einem KI-Assistenten bedient zu werden.",
    items: {
      bookings: {
        title: "Reservierungen mit Live-Raumplan",
        description:
          "Der Raum in 2D, 2,5D oder 3D mit Tischstatus, die du quer durch den Raum erkennst, eine Ankunftsleiste nach Zeitfenstern, ein Raumeditor für mehrere Ebenen und eine Vollbildansicht für den Service.",
      },
      glass: {
        title: "Liquid-Glass-Oberfläche",
        description:
          "Eine Glasoberfläche mit fünf Designs (Lime, Ember, Rose, Tide, Cobalt), jeweils hell und dunkel und auf WCAG-Kontrast geprüft, mit Layout-Einstellungen und einem Layout, das auf Smartphones und Touchscreens funktioniert.",
      },
      presets: {
        title: "Branchen-Presets",
        description:
          "Eine Codebasis für Gastronomie (Tische und Gedecke), Salons (Frisierplätze und Leistungen) und Werkstätten (Werkstattplätze und Fahrzeuge). Darunter liegen generische Module; nur Vokabular und Beispieldaten ändern sich.",
      },
      languages: {
        title: "Vier Sprachen, drei Währungen",
        description:
          "Englisch, Spanisch, Deutsch und Französisch mit vollständigen Wörterbüchern, die der Linter erzwingt, und USD, EUR oder GBP als Geschäftswährung.",
      },
      roles: {
        title: "Rollen und Berechtigungen",
        description:
          "Die Rollen Inhaber, Leitung und Mitarbeitende mit typisierten Berechtigungen, die jede Fähigkeit, die MCP-Tools und die Navigation steuern.",
      },
      data: {
        title: "Austauschbare Datenschicht",
        description:
          "Jeder Bildschirm liest und schreibt über typisierte Fähigkeiten. Ein Mock-Adapter für Demos liefert jedem Besucher eigene Daten; ein echtes Backend ersetzt einen einzigen Adapter.",
      },
      mcp: {
        title: "MCP-Server",
        description:
          "Jeder MCP-fähige KI-Assistent kann das Dashboard mit denselben Fähigkeiten und Berechtigungen bedienen wie die Bildschirme, über Streamable HTTP oder stdio.",
      },
    },
  },
  run: {
    title: "Selbst ausführen",
    body: "Klone das Repository, installiere die Abhängigkeiten und starte den Entwicklungsserver. Der Mock-Adapter bringt Demodaten mit, sodass jeder Bildschirm ohne Backend funktioniert.",
    stack: "Entwickelt mit {stack}.",
  },
  links: {
    title: "Projekt",
    source: "Quellcode",
    start: "Erste Schritte",
    mcp: "KI-Assistenten verbinden",
    architecture: "Architekturentscheidungen",
    license: "MIT-Lizenz",
  },
  footer: {
    madeBy: "Erstellt von {author}",
    github: "admin-OS auf GitHub",
  },
};

const fr: LandingMessages = {
  home: "Accueil d’admin-OS",
  theme: {
    cycle: "Apparence : {mode}. Cliquez pour la changer",
    modes: { light: "Clair", dark: "Sombre", system: "Système" },
  },
  language: { label: "Langue", failed: "Impossible de changer la langue. Veuillez réessayer." },
  hero: {
    title: "Le tableau de bord de gestion open source pour les petites entreprises.",
    lead: "Conçu d’abord pour les restaurants, et pensé pour qu’un salon de coiffure ou un garage automobile fonctionne avec les mêmes modules.",
    status: "En développement actif vers sa première version.",
    demo: "Ouvrir la démo",
    github: "Voir sur GitHub",
  },
  showcase: {
    label: "Aperçu d’admin-OS",
    alt: "Accueil d’admin-OS avec le panneau des préférences ouvert : thème, police, langue, devise et mise en page",
  },
  features: {
    eyebrow: "Fonctionnalités",
    title: "Bien conçu, réutilisable à tous les niveaux et prêt à être piloté par un assistant IA.",
    items: {
      bookings: {
        title: "Réservations avec plan de salle en direct",
        description:
          "La salle en 2D, 2,5D ou 3D avec des états de table lisibles depuis l’autre bout de la salle, une colonne des arrivées planifiée par créneau, un éditeur de salle sur plusieurs niveaux et une vue de service en plein écran.",
      },
      glass: {
        title: "Interface liquid glass",
        description:
          "Une interface en verre avec cinq thèmes (Lime, Ember, Rose, Tide, Cobalt), chacun en clair et en sombre et vérifié selon le contraste WCAG, avec des réglages de mise en page et un affichage adapté aux téléphones et aux écrans tactiles.",
      },
      presets: {
        title: "Préréglages métier",
        description:
          "Une seule base de code pour la restauration (tables et couverts), les salons (fauteuils et prestations) et les ateliers (postes et véhicules). Des modules génériques en dessous ; seuls le vocabulaire et les données d’exemple changent.",
      },
      languages: {
        title: "Quatre langues, trois devises",
        description:
          "Anglais, espagnol, allemand et français, avec des dictionnaires complets imposés par le linter, et USD, EUR ou GBP comme devise de l’entreprise.",
      },
      roles: {
        title: "Rôles et autorisations",
        description:
          "Les rôles propriétaire, responsable et personnel, avec des autorisations typées qui contrôlent chaque capacité, les outils MCP et la navigation.",
      },
      data: {
        title: "Couche de données interchangeable",
        description:
          "Chaque écran lit et écrit via des capacités typées. Un adaptateur fictif est fourni pour les démos, avec des données propres à chaque visiteur ; un vrai backend remplace un seul adaptateur.",
      },
      mcp: {
        title: "Serveur MCP",
        description:
          "Tout assistant IA compatible MCP peut piloter le tableau de bord avec les mêmes capacités et autorisations que les écrans, en Streamable HTTP ou en stdio.",
      },
    },
  },
  run: {
    title: "Lancez-le chez vous",
    body: "Clonez le dépôt, installez les dépendances et démarrez le serveur de développement. L’adaptateur fictif fournit des données de démonstration : chaque écran fonctionne sans backend.",
    stack: "Conçu avec {stack}.",
  },
  links: {
    title: "Projet",
    source: "Code source",
    start: "Premiers pas",
    mcp: "Connecter un assistant IA",
    architecture: "Décisions d’architecture",
    license: "Licence MIT",
  },
  footer: {
    madeBy: "Créé par {author}",
    github: "admin-OS sur GitHub",
  },
};

export const landingMessages = defineMessages<LandingMessages>({ en, es, de, fr });

export const landingBundle: MessageBundle<LandingMessages> = { key: landingMessageKey, dictionary: landingMessages };
