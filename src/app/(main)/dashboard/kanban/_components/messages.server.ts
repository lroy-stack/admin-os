import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type KanbanMessages, kanbanMessageKey } from "./messages";

const en: KanbanMessages = {
  meta: {
    title: "Kanban board",
    description: "A kanban board for organizing work, tracking progress, and managing tasks visually.",
  },
  views: { board: "Board", list: "List", table: "Table" },
  toolbar: {
    searchLabel: "Search tasks",
    searchPlaceholder: "Search tasks",
    filter: "Filter",
    sort: "Sort",
    addTask: "Add task",
    addMenu: "Open add task menu",
    importCsv: "Import CSV",
    addFromTemplate: "Add from template",
    createAutomation: "Create automation",
  },
  columns: { ideas: "Ideas", planned: "Planned", building: "Building", qa: "QA", shipped: "Shipped" },
  priorities: { High: "High", Medium: "Medium", Low: "Low" },
  teams: {
    Backend: "Backend",
    Data: "Data",
    Design: "Design",
    Docs: "Docs",
    "Finance Ops": "Finance Ops",
    Platform: "Platform",
    Product: "Product",
    QA: "QA",
    Security: "Security",
  },
  insights: {
    Attachments: { one: "{count} attachment", other: "{count} attachments" },
    Comments: { one: "{count} comment", other: "{count} comments" },
    Documents: { one: "{count} document", other: "{count} documents" },
  },
  column: {
    drag: "Drag {column} column",
    addTask: "Add task to {column}",
    actions: "{column} column actions",
    taskCount: { one: "{count} task", other: "{count} tasks" },
  },
  card: { progress: "Progress", owner: "Owner", dueDate: "Due date", team: "Team", done: "Done" },
  list: {
    taskUnit: { one: "task", other: "tasks" },
    highPriority: "{count} high priority",
    groupActions: "{column} group actions",
    tasksOf: "{column} tasks",
    noTasks: "No tasks.",
    priorityOf: "Priority: {priority}",
    due: "Due {date}",
    assignedTo: "Assigned to {name}",
  },
  table: {
    label: "Kanban tasks",
    headers: {
      task: "Task",
      status: "Status",
      priority: "Priority",
      team: "Team",
      owner: "Owner",
      dueDate: "Due date",
    },
    changeStatus: "Change status for {title}",
    dragTask: "Drag {title}",
    emptyTitle: "No tasks yet",
    emptyDescription: "Tasks from your board appear here.",
    range: { one: "{from}–{to} of {count} task", other: "{from}–{to} of {count} tasks" },
    rowsPerPage: "Rows per page",
    page: "Page {page} of {pages}",
    previousPage: "Previous page",
    nextPage: "Next page",
  },
  tasks: {
    "tender-workflow-map": {
      title: "Tender workflow map",
      description: "Model Tender, Award/L1, Work Order, allocation, salary, and documents.",
    },
    "license-strategy-research": {
      title: "License strategy research",
      description: "Compare private MVP, open core, GPL, AGPL, and commercial modules.",
    },
    "backup-restore-plan": {
      title: "Backup and restore plan",
      description: "Define local database backup, restore, and exported document recovery.",
    },
    "work-order-allocation-model": {
      title: "Work order allocation model",
      description: "Sketch how awarded work orders connect to employee allocations and salary months.",
    },
    "future-sync-notes": {
      title: "Future sync notes",
      description: "Capture local-first sync assumptions before deciding on cloud PostgreSQL and file storage.",
    },
    "electron-app-shell": {
      title: "Electron app shell",
      description: "Create local-first desktop shell with React, Tailwind, and shadcn/ui.",
    },
    "secure-preload-api": {
      title: "Secure preload API",
      description: "Expose renderer-safe methods for imports, records, PDFs, and backups.",
    },
    "party-employee-records": {
      title: "Party and employee records",
      description: "Create local records for clients, contractors, employees, and identifiers.",
    },
    "generated-documents-index": {
      title: "Generated documents index",
      description: "Plan filters for generated PDFs by party, salary month, employee, and import batch.",
    },
    "sqlite-drizzle-schema": {
      title: "SQLite and Drizzle schema",
      description: "Model parties, employees, tenders, work orders, salary imports, and documents.",
    },
    "salary-excel-import": {
      title: "Salary Excel import",
      description: "Read salary sheets with SheetJS and persist import batches locally.",
    },
    "column-mapping-builder": {
      title: "Column mapping builder",
      description: "Map Excel columns to salary fields with reusable templates per party.",
    },
    "salary-row-validation": {
      title: "Salary row validation",
      description: "Flag missing employee IDs, invalid amounts, duplicate rows, and unmapped fields.",
    },
    "payslip-preview": {
      title: "Payslip preview",
      description: "Preview generated payslips before bulk PDF export and document history.",
    },
    "architecture-rule": {
      title: "Architecture rule locked",
      description: "Renderer stays UI-only; preload, IPC, services, and database stay separated.",
    },
    "private-mvp-scope": {
      title: "Private MVP scope",
      description: "Start private source first, then revisit open-core after workflow validation.",
    },
    "mvp-module-priorities": {
      title: "MVP module priorities",
      description: "Payslip generation is first, but data model supports wider tender operations.",
    },
  },
};

const es: KanbanMessages = {
  meta: {
    title: "Tablero kanban",
    description: "Un tablero kanban para organizar el trabajo, seguir el progreso y gestionar tareas de forma visual.",
  },
  views: { board: "Tablero", list: "Lista", table: "Tabla" },
  toolbar: {
    searchLabel: "Buscar tareas",
    searchPlaceholder: "Buscar tareas",
    filter: "Filtrar",
    sort: "Ordenar",
    addTask: "Añadir tarea",
    addMenu: "Abrir el menú de añadir tarea",
    importCsv: "Importar CSV",
    addFromTemplate: "Añadir desde plantilla",
    createAutomation: "Crear automatización",
  },
  columns: { ideas: "Ideas", planned: "Planificadas", building: "En desarrollo", qa: "Pruebas", shipped: "Entregadas" },
  priorities: { High: "Alta", Medium: "Media", Low: "Baja" },
  teams: {
    Backend: "Backend",
    Data: "Datos",
    Design: "Diseño",
    Docs: "Documentación",
    "Finance Ops": "Operaciones financieras",
    Platform: "Plataforma",
    Product: "Producto",
    QA: "Calidad",
    Security: "Seguridad",
  },
  insights: {
    Attachments: { one: "{count} adjunto", other: "{count} adjuntos" },
    Comments: { one: "{count} comentario", other: "{count} comentarios" },
    Documents: { one: "{count} documento", other: "{count} documentos" },
  },
  column: {
    drag: "Arrastrar la columna {column}",
    addTask: "Añadir tarea a {column}",
    actions: "Acciones de la columna {column}",
    taskCount: { one: "{count} tarea", other: "{count} tareas" },
  },
  card: { progress: "Progreso", owner: "Responsable", dueDate: "Fecha de vencimiento", team: "Equipo", done: "Hecha" },
  list: {
    taskUnit: { one: "tarea", other: "tareas" },
    highPriority: "{count} de prioridad alta",
    groupActions: "Acciones del grupo {column}",
    tasksOf: "Tareas en {column}",
    noTasks: "No hay tareas.",
    priorityOf: "Prioridad: {priority}",
    due: "Vence el {date}",
    assignedTo: "Asignada a {name}",
  },
  table: {
    label: "Tareas del tablero kanban",
    headers: {
      task: "Tarea",
      status: "Estado",
      priority: "Prioridad",
      team: "Equipo",
      owner: "Responsable",
      dueDate: "Fecha de vencimiento",
    },
    changeStatus: "Cambiar el estado de {title}",
    dragTask: "Arrastrar {title}",
    emptyTitle: "Aún no hay tareas",
    emptyDescription: "Las tareas de tu tablero aparecen aquí.",
    range: { one: "{from}–{to} de {count} tarea", other: "{from}–{to} de {count} tareas" },
    rowsPerPage: "Filas por página",
    page: "Página {page} de {pages}",
    previousPage: "Página anterior",
    nextPage: "Página siguiente",
  },
  tasks: {
    "tender-workflow-map": {
      title: "Mapa del flujo de licitaciones",
      description: "Modela licitación, adjudicación/L1, orden de trabajo, asignación, nómina y documentos.",
    },
    "license-strategy-research": {
      title: "Estudio de la estrategia de licencias",
      description: "Compara MVP privado, núcleo abierto, GPL, AGPL y módulos comerciales.",
    },
    "backup-restore-plan": {
      title: "Plan de copia de seguridad y restauración",
      description:
        "Define la copia de seguridad y la restauración de la base de datos local, y la recuperación de los documentos exportados.",
    },
    "work-order-allocation-model": {
      title: "Modelo de asignación de órdenes de trabajo",
      description:
        "Esboza cómo las órdenes de trabajo adjudicadas se vinculan con las asignaciones de empleados y los meses de nómina.",
    },
    "future-sync-notes": {
      title: "Notas sobre la sincronización futura",
      description:
        "Recoge los supuestos de sincronización con prioridad local antes de decidir sobre PostgreSQL en la nube y el almacenamiento de archivos.",
    },
    "electron-app-shell": {
      title: "Base de la app Electron",
      description: "Crea la base de escritorio con prioridad local usando React, Tailwind y shadcn/ui.",
    },
    "secure-preload-api": {
      title: "API de precarga segura",
      description: "Expón métodos seguros para el renderizador: importaciones, registros, PDF y copias de seguridad.",
    },
    "party-employee-records": {
      title: "Fichas de partes y empleados",
      description: "Crea fichas locales de clientes, contratistas, empleados e identificadores.",
    },
    "generated-documents-index": {
      title: "Índice de documentos generados",
      description: "Planifica filtros para los PDF generados por parte, mes de nómina, empleado y lote de importación.",
    },
    "sqlite-drizzle-schema": {
      title: "Esquema de SQLite y Drizzle",
      description: "Modela partes, empleados, licitaciones, órdenes de trabajo, importaciones de nóminas y documentos.",
    },
    "salary-excel-import": {
      title: "Importación de nóminas desde Excel",
      description: "Lee las hojas de nómina con SheetJS y guarda los lotes de importación en local.",
    },
    "column-mapping-builder": {
      title: "Editor de correspondencia de columnas",
      description: "Asocia columnas de Excel con campos de nómina mediante plantillas reutilizables por parte.",
    },
    "salary-row-validation": {
      title: "Validación de filas de nómina",
      description: "Señala IDs de empleado ausentes, importes no válidos, filas duplicadas y campos sin asociar.",
    },
    "payslip-preview": {
      title: "Vista previa de nóminas",
      description:
        "Previsualiza las nóminas generadas antes de la exportación masiva a PDF y del historial de documentos.",
    },
    "architecture-rule": {
      title: "Regla de arquitectura fijada",
      description:
        "El renderizador solo contiene la interfaz; la precarga, IPC, los servicios y la base de datos permanecen separados.",
    },
    "private-mvp-scope": {
      title: "Alcance del MVP privado",
      description: "Empieza con el código fuente privado y revisa el núcleo abierto tras validar el flujo de trabajo.",
    },
    "mvp-module-priorities": {
      title: "Prioridades de los módulos del MVP",
      description:
        "Primero va la generación de nóminas, pero el modelo de datos admite operaciones de licitación más amplias.",
    },
  },
};

const de: KanbanMessages = {
  meta: {
    title: "Kanban-Board",
    description:
      "Ein Kanban-Board, um Arbeit zu organisieren, den Fortschritt zu verfolgen und Aufgaben visuell zu verwalten.",
  },
  views: { board: "Board", list: "Liste", table: "Tabelle" },
  toolbar: {
    searchLabel: "Aufgaben suchen",
    searchPlaceholder: "Aufgaben suchen",
    filter: "Filtern",
    sort: "Sortieren",
    addTask: "Aufgabe hinzufügen",
    addMenu: "Menü zum Hinzufügen öffnen",
    importCsv: "CSV importieren",
    addFromTemplate: "Aus Vorlage hinzufügen",
    createAutomation: "Automatisierung erstellen",
  },
  columns: { ideas: "Ideen", planned: "Geplant", building: "In Arbeit", qa: "Prüfung", shipped: "Ausgeliefert" },
  priorities: { High: "Hoch", Medium: "Mittel", Low: "Niedrig" },
  teams: {
    Backend: "Backend",
    Data: "Daten",
    Design: "Design",
    Docs: "Doku",
    "Finance Ops": "Finanzbetrieb",
    Platform: "Plattform",
    Product: "Produkt",
    QA: "QS",
    Security: "Sicherheit",
  },
  insights: {
    Attachments: { one: "{count} Anhang", other: "{count} Anhänge" },
    Comments: { one: "{count} Kommentar", other: "{count} Kommentare" },
    Documents: { one: "{count} Dokument", other: "{count} Dokumente" },
  },
  column: {
    drag: "Spalte {column} verschieben",
    addTask: "Aufgabe zu {column} hinzufügen",
    actions: "Aktionen für Spalte {column}",
    taskCount: { one: "{count} Aufgabe", other: "{count} Aufgaben" },
  },
  card: { progress: "Fortschritt", owner: "Verantwortlich", dueDate: "Frist", team: "Team", done: "Erledigt" },
  list: {
    taskUnit: { one: "Aufgabe", other: "Aufgaben" },
    highPriority: "{count} mit hoher Priorität",
    groupActions: "Gruppenaktionen für {column}",
    tasksOf: "Aufgaben in {column}",
    noTasks: "Keine Aufgaben.",
    priorityOf: "Priorität: {priority}",
    due: "Zu erledigen bis {date}",
    assignedTo: "Zugewiesen an {name}",
  },
  table: {
    label: "Kanban-Aufgaben",
    headers: {
      task: "Aufgabe",
      status: "Status",
      priority: "Priorität",
      team: "Team",
      owner: "Verantwortlich",
      dueDate: "Frist",
    },
    changeStatus: "Status von {title} ändern",
    dragTask: "{title} verschieben",
    emptyTitle: "Noch keine Aufgaben",
    emptyDescription: "Aufgaben aus deinem Board erscheinen hier.",
    range: { one: "{from}–{to} von {count} Aufgabe", other: "{from}–{to} von {count} Aufgaben" },
    rowsPerPage: "Zeilen pro Seite",
    page: "Seite {page} von {pages}",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
  },
  tasks: {
    "tender-workflow-map": {
      title: "Ablaufplan für Ausschreibungen",
      description: "Modelliere Ausschreibung, Zuschlag/L1, Arbeitsauftrag, Zuweisung, Gehalt und Dokumente.",
    },
    "license-strategy-research": {
      title: "Recherche zur Lizenzstrategie",
      description: "Vergleiche privates MVP, Open Core, GPL, AGPL und kommerzielle Module.",
    },
    "backup-restore-plan": {
      title: "Plan für Sicherung und Wiederherstellung",
      description:
        "Lege Sicherung und Wiederherstellung der lokalen Datenbank sowie die Wiederherstellung exportierter Dokumente fest.",
    },
    "work-order-allocation-model": {
      title: "Zuweisungsmodell für Arbeitsaufträge",
      description:
        "Skizziere, wie vergebene Arbeitsaufträge mit Mitarbeiterzuweisungen und Gehaltsmonaten verknüpft sind.",
    },
    "future-sync-notes": {
      title: "Notizen zur künftigen Synchronisierung",
      description:
        "Halte die Local-first-Annahmen zur Synchronisierung fest, bevor du dich für Cloud-PostgreSQL und Dateispeicher entscheidest.",
    },
    "electron-app-shell": {
      title: "App-Gerüst mit Electron",
      description: "Erstelle ein Local-first-Desktop-Gerüst mit React, Tailwind und shadcn/ui.",
    },
    "secure-preload-api": {
      title: "Sichere Preload-API",
      description: "Stelle renderersichere Methoden für Importe, Datensätze, PDFs und Sicherungen bereit.",
    },
    "party-employee-records": {
      title: "Datensätze zu Parteien und Mitarbeitenden",
      description: "Lege lokale Datensätze für Kunden, Auftragnehmer, Mitarbeitende und Kennungen an.",
    },
    "generated-documents-index": {
      title: "Index der erzeugten Dokumente",
      description: "Plane Filter für erzeugte PDFs nach Partei, Gehaltsmonat, Mitarbeiter und Importcharge.",
    },
    "sqlite-drizzle-schema": {
      title: "SQLite- und Drizzle-Schema",
      description: "Modelliere Parteien, Mitarbeiter, Ausschreibungen, Arbeitsaufträge, Gehaltsimporte und Dokumente.",
    },
    "salary-excel-import": {
      title: "Gehaltsimport aus Excel",
      description: "Lies Gehaltstabellen mit SheetJS ein und speichere Importchargen lokal.",
    },
    "column-mapping-builder": {
      title: "Editor für die Spaltenzuordnung",
      description: "Ordne Excel-Spalten mit wiederverwendbaren Vorlagen pro Partei den Gehaltsfeldern zu.",
    },
    "salary-row-validation": {
      title: "Prüfung der Gehaltszeilen",
      description:
        "Markiere fehlende Mitarbeiter-IDs, ungültige Beträge, doppelte Zeilen und nicht zugeordnete Felder.",
    },
    "payslip-preview": {
      title: "Vorschau der Gehaltsabrechnungen",
      description:
        "Prüfe erzeugte Gehaltsabrechnungen in der Vorschau, bevor sie gesammelt als PDF exportiert und im Dokumentenverlauf abgelegt werden.",
    },
    "architecture-rule": {
      title: "Architekturregel festgelegt",
      description: "Der Renderer bleibt reine Oberfläche; Preload, IPC, Services und Datenbank bleiben getrennt.",
    },
    "private-mvp-scope": {
      title: "Umfang des privaten MVP",
      description: "Beginne mit privatem Quellcode und prüfe Open Core erst nach der Validierung des Workflows.",
    },
    "mvp-module-priorities": {
      title: "Modulprioritäten des MVP",
      description:
        "Zuerst kommt die Gehaltsabrechnung, aber das Datenmodell trägt auch umfassendere Ausschreibungsprozesse.",
    },
  },
};

const fr: KanbanMessages = {
  meta: {
    title: "Tableau kanban",
    description:
      "Un tableau kanban pour organiser le travail, suivre l’avancement et gérer les tâches de façon visuelle.",
  },
  views: { board: "Kanban", list: "Liste", table: "Tableau" },
  toolbar: {
    searchLabel: "Rechercher des tâches",
    searchPlaceholder: "Rechercher des tâches",
    filter: "Filtrer",
    sort: "Trier",
    addTask: "Ajouter une tâche",
    addMenu: "Ouvrir le menu d’ajout de tâche",
    importCsv: "Importer un CSV",
    addFromTemplate: "Ajouter depuis un modèle",
    createAutomation: "Créer une automatisation",
  },
  columns: { ideas: "Idées", planned: "Planifiées", building: "En développement", qa: "Recette", shipped: "Livrées" },
  priorities: { High: "Haute", Medium: "Moyenne", Low: "Basse" },
  teams: {
    Backend: "Backend",
    Data: "Données",
    Design: "Design",
    Docs: "Documentation",
    "Finance Ops": "Ops financières",
    Platform: "Plateforme",
    Product: "Produit",
    QA: "Qualité",
    Security: "Sécurité",
  },
  insights: {
    Attachments: { one: "{count} pièce jointe", other: "{count} pièces jointes" },
    Comments: { one: "{count} commentaire", other: "{count} commentaires" },
    Documents: { one: "{count} document", other: "{count} documents" },
  },
  column: {
    drag: "Déplacer la colonne {column}",
    addTask: "Ajouter une tâche à {column}",
    actions: "Actions de la colonne {column}",
    taskCount: { one: "{count} tâche", other: "{count} tâches" },
  },
  card: { progress: "Avancement", owner: "Responsable", dueDate: "Date d’échéance", team: "Équipe", done: "Terminée" },
  list: {
    taskUnit: { one: "tâche", other: "tâches" },
    highPriority: "{count} en priorité haute",
    groupActions: "Actions du groupe {column}",
    tasksOf: "Tâches dans {column}",
    noTasks: "Aucune tâche.",
    priorityOf: "Priorité : {priority}",
    due: "Échéance le {date}",
    assignedTo: "Assignée à {name}",
  },
  table: {
    label: "Tâches du kanban",
    headers: {
      task: "Tâche",
      status: "Statut",
      priority: "Priorité",
      team: "Équipe",
      owner: "Responsable",
      dueDate: "Date d’échéance",
    },
    changeStatus: "Modifier le statut de {title}",
    dragTask: "Déplacer {title}",
    emptyTitle: "Aucune tâche pour l’instant",
    emptyDescription: "Les tâches de votre tableau apparaissent ici.",
    range: { one: "{from}–{to} sur {count} tâche", other: "{from}–{to} sur {count} tâches" },
    rowsPerPage: "Lignes par page",
    page: "Page {page} sur {pages}",
    previousPage: "Page précédente",
    nextPage: "Page suivante",
  },
  tasks: {
    "tender-workflow-map": {
      title: "Cartographie du flux d’appels d’offres",
      description: "Modélisez appel d’offres, attribution/L1, ordre de travail, affectation, salaire et documents.",
    },
    "license-strategy-research": {
      title: "Étude de la stratégie de licences",
      description: "Comparez MVP privé, open core, GPL, AGPL et modules commerciaux.",
    },
    "backup-restore-plan": {
      title: "Plan de sauvegarde et de restauration",
      description:
        "Définissez la sauvegarde et la restauration de la base locale, ainsi que la récupération des documents exportés.",
    },
    "work-order-allocation-model": {
      title: "Modèle d’affectation des ordres de travail",
      description:
        "Esquissez comment les ordres de travail attribués se rattachent aux affectations des employés et aux mois de paie.",
    },
    "future-sync-notes": {
      title: "Notes sur la synchronisation future",
      description:
        "Consignez les hypothèses de synchronisation local-first avant de choisir PostgreSQL dans le cloud et le stockage de fichiers.",
    },
    "electron-app-shell": {
      title: "Socle de l’application Electron",
      description: "Créez le socle de bureau local-first avec React, Tailwind et shadcn/ui.",
    },
    "secure-preload-api": {
      title: "API de préchargement sécurisée",
      description: "Exposez des méthodes sûres pour le moteur de rendu : imports, enregistrements, PDF et sauvegardes.",
    },
    "party-employee-records": {
      title: "Fiches des parties et des employés",
      description: "Créez des fiches locales pour les clients, sous-traitants, employés et identifiants.",
    },
    "generated-documents-index": {
      title: "Index des documents générés",
      description: "Prévoyez des filtres pour les PDF générés par partie, mois de paie, employé et lot d’import.",
    },
    "sqlite-drizzle-schema": {
      title: "Schéma SQLite et Drizzle",
      description: "Modélisez parties, employés, appels d’offres, ordres de travail, imports de paie et documents.",
    },
    "salary-excel-import": {
      title: "Import de la paie depuis Excel",
      description: "Lisez les feuilles de paie avec SheetJS et enregistrez les lots d’import en local.",
    },
    "column-mapping-builder": {
      title: "Éditeur de correspondance des colonnes",
      description: "Associez les colonnes Excel aux champs de paie avec des modèles réutilisables par partie.",
    },
    "salary-row-validation": {
      title: "Validation des lignes de paie",
      description:
        "Signalez les identifiants d’employé manquants, les montants invalides, les lignes en double et les champs non associés.",
    },
    "payslip-preview": {
      title: "Aperçu des bulletins de paie",
      description: "Prévisualisez les bulletins générés avant l’export PDF groupé et l’historique des documents.",
    },
    "architecture-rule": {
      title: "Règle d’architecture verrouillée",
      description:
        "Le moteur de rendu reste limité à l’interface ; préchargement, IPC, services et base de données restent séparés.",
    },
    "private-mvp-scope": {
      title: "Périmètre du MVP privé",
      description:
        "Commencez par un code source privé, puis réexaminez l’open core après validation du flux de travail.",
    },
    "mvp-module-priorities": {
      title: "Priorités des modules du MVP",
      description:
        "La génération des bulletins de paie passe en premier, mais le modèle de données prend en charge des opérations d’appels d’offres plus larges.",
    },
  },
};

export const kanbanMessages = defineMessages<KanbanMessages>({ en, es, de, fr });

export const kanbanBundle: MessageBundle<KanbanMessages> = { key: kanbanMessageKey, dictionary: kanbanMessages };
