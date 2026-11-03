import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type KitMessages, kitMessageKey } from "./messages";

const en: KitMessages = {
  meta: {
    title: "Window kit",
    description: "The shared panels, dialogs and confirmations, each opened in a real browser.",
  },
  title: "Window kit",
  subtitle: "Every window is chosen by its job: look at a record, confirm, do a quick task, fill in a form.",
  panel: {
    title: "Record panel",
    description: "A side sheet from 768 px and a bottom drawer below. For looking at a record and acting on it.",
    open: "Open record",
    panelTitle: "Table 12",
    panelDescription: "Reservation for Maria Lopez at 20:30.",
    panelBody: "Party of four, window seat. Allergy note: nuts.",
  },
  confirm: {
    title: "Confirm an action",
    description: "Cancel has the focus first, so Enter never confirms by accident. A reason can be required.",
    plain: {
      open: "Release table",
      title: "Release table 12?",
      consequence: "The guests lose their seat. This cannot be undone.",
    },
    withReason: {
      open: "Cancel reservation",
      title: "Cancel this reservation?",
      consequence: "The table is released and the guest is notified. This cannot be undone.",
      reasonLabel: "Reason",
      reasonTooShort: "Write at least 3 characters.",
    },
    failing: {
      open: "Delete zone",
      title: "Delete the terrace zone?",
      consequence: "The zone and its tables are removed.",
      refusal: "The zone still has open orders.",
    },
    confirmed: { one: "Confirmed {count} time", other: "Confirmed {count} times" },
  },
  quick: {
    title: "Quick dialog",
    description: "One decision or up to four fields. A bottom sheet on phones.",
    open: "Seat walk-in",
    windowTitle: "Seat walk-in",
    windowDescription: "Add a party that arrived without a booking.",
    nameLabel: "Name",
    partyLabel: "Party size",
    submit: "Seat walk-in",
    cancel: "Cancel",
    submitted: "Submitted: {name}",
  },
  form: {
    title: "Form dialog",
    description: "Create or edit a record. A full-screen sheet on phones.",
    open: "New guest",
    windowTitle: "New guest",
    windowDescription: "Add a guest to the guest book.",
    nameLabel: "Name",
    emailLabel: "Email",
    notesLabel: "Notes",
    submit: "Save guest",
    cancel: "Cancel",
    submitted: "Submitted: {name}",
  },
};

const es: KitMessages = {
  meta: {
    title: "Kit de ventanas",
    description: "Los paneles, diálogos y confirmaciones compartidos, cada uno abierto en un navegador real.",
  },
  title: "Kit de ventanas",
  subtitle: "Cada ventana se elige por su tarea: ver un registro, confirmar, una tarea rápida o un formulario.",
  panel: {
    title: "Panel de registro",
    description:
      "Una hoja lateral desde 768 px y un panel inferior en pantallas menores. Para ver un registro y actuar.",
    open: "Abrir registro",
    panelTitle: "Mesa 12",
    panelDescription: "Reserva de María López a las 20:30.",
    panelBody: "Cuatro comensales, mesa junto a la ventana. Alergia: frutos secos.",
  },
  confirm: {
    title: "Confirmar una acción",
    description: "Cancelar recibe el foco primero, así Intro nunca confirma por error. Se puede exigir un motivo.",
    plain: {
      open: "Liberar mesa",
      title: "¿Liberar la mesa 12?",
      consequence: "Los comensales pierden su sitio. No se puede deshacer.",
    },
    withReason: {
      open: "Cancelar reserva",
      title: "¿Cancelar esta reserva?",
      consequence: "Se libera la mesa y se avisa al cliente. No se puede deshacer.",
      reasonLabel: "Motivo",
      reasonTooShort: "Escribe al menos 3 caracteres.",
    },
    failing: {
      open: "Eliminar zona",
      title: "¿Eliminar la zona de terraza?",
      consequence: "Se eliminan la zona y sus mesas.",
      refusal: "La zona todavía tiene comandas abiertas.",
    },
    confirmed: { one: "Confirmado {count} vez", other: "Confirmado {count} veces" },
  },
  quick: {
    title: "Diálogo rápido",
    description: "Una decisión o hasta cuatro campos. Una hoja inferior en el móvil.",
    open: "Sentar sin reserva",
    windowTitle: "Sentar sin reserva",
    windowDescription: "Añade un grupo que llegó sin reserva.",
    nameLabel: "Nombre",
    partyLabel: "Comensales",
    submit: "Sentar sin reserva",
    cancel: "Cancelar",
    submitted: "Enviado: {name}",
  },
  form: {
    title: "Diálogo de formulario",
    description: "Crear o editar un registro. Una hoja a pantalla completa en el móvil.",
    open: "Nuevo cliente",
    windowTitle: "Nuevo cliente",
    windowDescription: "Añade un cliente al libro de clientes.",
    nameLabel: "Nombre",
    emailLabel: "Correo",
    notesLabel: "Notas",
    submit: "Guardar cliente",
    cancel: "Cancelar",
    submitted: "Enviado: {name}",
  },
};

const de: KitMessages = {
  meta: {
    title: "Fenster-Kit",
    description: "Die gemeinsamen Panels, Dialoge und Bestätigungen, jeweils in einem echten Browser geöffnet.",
  },
  title: "Fenster-Kit",
  subtitle: "Jedes Fenster richtet sich nach seiner Aufgabe: Datensatz ansehen, bestätigen, Schnellaufgabe, Formular.",
  panel: {
    title: "Datensatz-Panel",
    description: "Ein seitliches Panel ab 768 px und darunter ein Panel von unten. Zum Ansehen und Bearbeiten.",
    open: "Datensatz öffnen",
    panelTitle: "Tisch 12",
    panelDescription: "Reservierung für Maria Lopez um 20:30 Uhr.",
    panelBody: "Vier Personen, Fensterplatz. Allergiehinweis: Nüsse.",
  },
  confirm: {
    title: "Aktion bestätigen",
    description:
      "Abbrechen hat zuerst den Fokus, die Eingabetaste bestätigt also nie versehentlich. Ein Grund kann Pflicht sein.",
    plain: {
      open: "Tisch freigeben",
      title: "Tisch 12 freigeben?",
      consequence: "Die Gäste verlieren ihren Platz. Das lässt sich nicht rückgängig machen.",
    },
    withReason: {
      open: "Reservierung stornieren",
      title: "Diese Reservierung stornieren?",
      consequence: "Der Tisch wird freigegeben und der Gast benachrichtigt. Das lässt sich nicht rückgängig machen.",
      reasonLabel: "Grund",
      reasonTooShort: "Schreibe mindestens 3 Zeichen.",
    },
    failing: {
      open: "Bereich löschen",
      title: "Den Terrassenbereich löschen?",
      consequence: "Der Bereich und seine Tische werden entfernt.",
      refusal: "Der Bereich hat noch offene Bestellungen.",
    },
    confirmed: { one: "{count} Mal bestätigt", other: "{count} Mal bestätigt" },
  },
  quick: {
    title: "Schnelldialog",
    description: "Eine Entscheidung oder bis zu vier Felder. Auf dem Smartphone ein Panel von unten.",
    open: "Laufkundschaft platzieren",
    windowTitle: "Laufkundschaft platzieren",
    windowDescription: "Füge eine Gruppe ohne Reservierung hinzu.",
    nameLabel: "Name",
    partyLabel: "Personenzahl",
    submit: "Laufkundschaft platzieren",
    cancel: "Abbrechen",
    submitted: "Gesendet: {name}",
  },
  form: {
    title: "Formulardialog",
    description: "Einen Datensatz anlegen oder bearbeiten. Auf dem Smartphone ein Vollbild-Panel.",
    open: "Neuer Gast",
    windowTitle: "Neuer Gast",
    windowDescription: "Füge dem Gästebuch einen Gast hinzu.",
    nameLabel: "Name",
    emailLabel: "E-Mail",
    notesLabel: "Notizen",
    submit: "Gast speichern",
    cancel: "Abbrechen",
    submitted: "Gesendet: {name}",
  },
};

const fr: KitMessages = {
  meta: {
    title: "Kit de fenêtres",
    description: "Les panneaux, dialogues et confirmations partagés, chacun ouvert dans un vrai navigateur.",
  },
  title: "Kit de fenêtres",
  subtitle: "Chaque fenêtre est choisie selon sa tâche : consulter une fiche, confirmer, tâche rapide, formulaire.",
  panel: {
    title: "Panneau de fiche",
    description: "Un panneau latéral dès 768 px et un panneau du bas en dessous. Pour consulter une fiche et agir.",
    open: "Ouvrir la fiche",
    panelTitle: "Table 12",
    panelDescription: "Réservation de Maria Lopez à 20 h 30.",
    panelBody: "Quatre couverts, table près de la fenêtre. Allergie : fruits à coque.",
  },
  confirm: {
    title: "Confirmer une action",
    description:
      "Annuler reçoit le focus en premier, Entrée ne confirme donc jamais par erreur. Un motif peut être exigé.",
    plain: {
      open: "Libérer la table",
      title: "Libérer la table 12 ?",
      consequence: "Les clients perdent leur place. Cette action est irréversible.",
    },
    withReason: {
      open: "Annuler la réservation",
      title: "Annuler cette réservation ?",
      consequence: "La table est libérée et le client est prévenu. Cette action est irréversible.",
      reasonLabel: "Motif",
      reasonTooShort: "Saisissez au moins 3 caractères.",
    },
    failing: {
      open: "Supprimer la zone",
      title: "Supprimer la zone terrasse ?",
      consequence: "La zone et ses tables sont supprimées.",
      refusal: "La zone a encore des commandes ouvertes.",
    },
    confirmed: { one: "Confirmé {count} fois", other: "Confirmé {count} fois" },
  },
  quick: {
    title: "Dialogue rapide",
    description: "Une décision ou jusqu’à quatre champs. Un panneau du bas sur mobile.",
    open: "Installer sans réservation",
    windowTitle: "Installer sans réservation",
    windowDescription: "Ajoutez un groupe arrivé sans réservation.",
    nameLabel: "Nom",
    partyLabel: "Couverts",
    submit: "Installer sans réservation",
    cancel: "Annuler",
    submitted: "Envoyé : {name}",
  },
  form: {
    title: "Dialogue de formulaire",
    description: "Créer ou modifier une fiche. Un panneau plein écran sur mobile.",
    open: "Nouveau client",
    windowTitle: "Nouveau client",
    windowDescription: "Ajoutez un client au carnet de clients.",
    nameLabel: "Nom",
    emailLabel: "E-mail",
    notesLabel: "Notes",
    submit: "Enregistrer le client",
    cancel: "Annuler",
    submitted: "Envoyé : {name}",
  },
};

export const kitMessages = defineMessages<KitMessages>({ en, es, de, fr });

export const kitBundle: MessageBundle<KitMessages> = { key: kitMessageKey, dictionary: kitMessages };
