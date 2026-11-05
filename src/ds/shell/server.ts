import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type ShellMessages, shellMessageKey } from "./messages";

const en: ShellMessages = {
  landmarks: { sections: "Sections", quickAccess: "Quick access" },
  header: {
    inbox: "Inbox",
    unread: { one: "{count} unread notification", other: "{count} unread notifications" },
  },
  account: {
    label: "Account: {name}",
    account: "Account",
    businessSettings: "Business settings",
    demo: {
      title: "Demo",
      role: "View as",
      preset: "Business type",
      reset: "Reset demo data",
      resetDone: "Demo data reset.",
      failed: "Could not apply the change. Try again.",
    },
  },
  search: {
    open: "Search",
    tooltip: "Search ⌘J",
    placeholder: "Search dashboards, users, and more…",
    empty: "No results found.",
  },
  preferences: {
    trigger: "Preferences",
    title: "Preferences",
    description: "Customize your dashboard layout preferences.",
    themePreset: "Theme preset",
    themePresetPlaceholder: "Preset",
    font: "Font",
    fontPlaceholder: "Select font",
    language: "Language",
    currency: "Currency",
    themeMode: "Theme mode",
    modes: { light: "Light", dark: "Dark", system: "System" },
    themeCycle: "Current theme: {mode}. Click to cycle themes",
    pageLayout: "Page layout",
    layouts: { centered: "Centered", fullWidth: "Full width" },
    navbarBehavior: "Navbar behavior",
    navbarStyles: { sticky: "Sticky", scroll: "Scroll" },
    restoreDefaults: "Restore defaults",
    languageFailed: "Could not change the language. Try again.",
    currencyFailed: "Could not change the currency. Try again.",
  },
};

const es: ShellMessages = {
  landmarks: { sections: "Secciones", quickAccess: "Acceso rápido" },
  header: {
    inbox: "Bandeja de entrada",
    unread: { one: "{count} notificación sin leer", other: "{count} notificaciones sin leer" },
  },
  account: {
    label: "Cuenta: {name}",
    account: "Cuenta",
    businessSettings: "Ajustes del negocio",
    demo: {
      title: "Demo",
      role: "Ver como",
      preset: "Tipo de negocio",
      reset: "Restablecer datos de demo",
      resetDone: "Datos de demo restablecidos.",
      failed: "No se pudo aplicar el cambio. Inténtalo de nuevo.",
    },
  },
  search: {
    open: "Buscar",
    tooltip: "Buscar ⌘J",
    placeholder: "Buscar paneles, usuarios y más…",
    empty: "No se encontraron resultados.",
  },
  preferences: {
    trigger: "Preferencias",
    title: "Preferencias",
    description: "Personaliza el aspecto de tu panel.",
    themePreset: "Tema",
    themePresetPlaceholder: "Tema",
    font: "Fuente",
    fontPlaceholder: "Elegir fuente",
    language: "Idioma",
    currency: "Moneda",
    themeMode: "Apariencia",
    modes: { light: "Claro", dark: "Oscuro", system: "Sistema" },
    themeCycle: "Apariencia: {mode}. Haz clic para cambiarla",
    pageLayout: "Diseño de página",
    layouts: { centered: "Centrado", fullWidth: "Ancho completo" },
    navbarBehavior: "Comportamiento de la barra",
    navbarStyles: { sticky: "Fija", scroll: "Se desplaza" },
    restoreDefaults: "Restablecer valores predeterminados",
    languageFailed: "No se pudo cambiar el idioma. Inténtalo de nuevo.",
    currencyFailed: "No se pudo cambiar la moneda. Inténtalo de nuevo.",
  },
};

const de: ShellMessages = {
  landmarks: { sections: "Bereiche", quickAccess: "Schnellzugriff" },
  header: {
    inbox: "Posteingang",
    unread: { one: "{count} ungelesene Benachrichtigung", other: "{count} ungelesene Benachrichtigungen" },
  },
  account: {
    label: "Konto: {name}",
    account: "Konto",
    businessSettings: "Unternehmenseinstellungen",
    demo: {
      title: "Demo",
      role: "Ansicht als",
      preset: "Betriebsart",
      reset: "Demodaten zurücksetzen",
      resetDone: "Demodaten zurückgesetzt.",
      failed: "Die Änderung konnte nicht übernommen werden. Bitte versuche es erneut.",
    },
  },
  search: {
    open: "Suchen",
    tooltip: "Suchen ⌘J",
    placeholder: "Dashboards, Nutzer und mehr suchen…",
    empty: "Keine Ergebnisse gefunden.",
  },
  preferences: {
    trigger: "Einstellungen",
    title: "Einstellungen",
    description: "Passe das Erscheinungsbild deines Dashboards an.",
    themePreset: "Design",
    themePresetPlaceholder: "Design",
    font: "Schrift",
    fontPlaceholder: "Schrift auswählen",
    language: "Sprache",
    currency: "Währung",
    themeMode: "Darstellung",
    modes: { light: "Hell", dark: "Dunkel", system: "System" },
    themeCycle: "Darstellung: {mode}. Klicken zum Wechseln",
    pageLayout: "Seitenlayout",
    layouts: { centered: "Zentriert", fullWidth: "Volle Breite" },
    navbarBehavior: "Verhalten der Kopfleiste",
    navbarStyles: { sticky: "Fixiert", scroll: "Nicht fixiert" },
    restoreDefaults: "Zurücksetzen",
    languageFailed: "Die Sprache konnte nicht geändert werden. Bitte versuche es erneut.",
    currencyFailed: "Die Währung konnte nicht geändert werden. Bitte versuche es erneut.",
  },
};

const fr: ShellMessages = {
  landmarks: { sections: "Sections", quickAccess: "Accès rapide" },
  header: {
    inbox: "Boîte de réception",
    unread: { one: "{count} notification non lue", other: "{count} notifications non lues" },
  },
  account: {
    label: "Compte : {name}",
    account: "Compte",
    businessSettings: "Paramètres de l’entreprise",
    demo: {
      title: "Démo",
      role: "Afficher en tant que",
      preset: "Type d’activité",
      reset: "Réinitialiser les données de démo",
      resetDone: "Données de démo réinitialisées.",
      failed: "Impossible d’appliquer le changement. Veuillez réessayer.",
    },
  },
  search: {
    open: "Rechercher",
    tooltip: "Rechercher ⌘J",
    placeholder: "Rechercher tableaux de bord, utilisateurs…",
    empty: "Aucun résultat.",
  },
  preferences: {
    trigger: "Préférences",
    title: "Préférences",
    description: "Personnalisez l’apparence de votre tableau de bord.",
    themePreset: "Thème",
    themePresetPlaceholder: "Thème",
    font: "Police",
    fontPlaceholder: "Choisir une police",
    language: "Langue",
    currency: "Devise",
    themeMode: "Apparence",
    modes: { light: "Clair", dark: "Sombre", system: "Système" },
    themeCycle: "Apparence : {mode}. Cliquez pour la changer",
    pageLayout: "Mise en page",
    layouts: { centered: "Centrée", fullWidth: "Pleine largeur" },
    navbarBehavior: "Comportement de la barre",
    navbarStyles: { sticky: "Fixe", scroll: "Défile" },
    restoreDefaults: "Réinitialiser",
    languageFailed: "Impossible de changer la langue. Veuillez réessayer.",
    currencyFailed: "Impossible de changer la devise. Veuillez réessayer.",
  },
};

export const shellMessages = defineMessages<ShellMessages>({ en, es, de, fr });

/** Pass to `resolveMessages` in the layout that mounts the shell. */
export const shellBundle: MessageBundle<ShellMessages> = { key: shellMessageKey, dictionary: shellMessages };
