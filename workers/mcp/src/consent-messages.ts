import { defineMessages } from "@/core/i18n";

/** The consent page of the MCP Worker (ADR 0016 D4), in the four locales (ADR 0007, `docs/i18n/glossary.md`). */
export interface ConsentMessages {
  readonly title: string;
  readonly heading: string;
  readonly publishedBy: string;
  readonly unverified: string;
  readonly redirect: string;
  readonly loopback: string;
  readonly actsAs: string;
  readonly read: { readonly title: string; readonly body: string };
  readonly allow: string;
  readonly deny: string;
  readonly error: {
    readonly title: string;
    readonly invalidRequest: string;
    readonly unverifiedClient: string;
    readonly expired: string;
    readonly startAgain: string;
  };
}

export const consentMessages = defineMessages<ConsentMessages>({
  en: {
    title: "Connect {client} to admin-OS",
    heading: "Allow {client} to use your admin-OS demo?",
    publishedBy: "Published by {domain}.",
    unverified: "This app registered itself; its name is not verified.",
    redirect: "Access is sent to {host}.",
    loopback: "This sends access to an app on your computer. Continue only if you just started connecting from it.",
    actsAs: "It acts as {role} on the demo data of this browser, the same data you see in the demo.",
    read: {
      title: "Read",
      body: "See the demo business’s records and settings. It cannot change anything.",
    },
    allow: "Allow",
    deny: "Deny",
    error: {
      title: "This connection cannot continue",
      invalidRequest: "The app sent a request this server does not accept.",
      unverifiedClient: "This app could not be verified.",
      expired: "This page expired or was already used.",
      startAgain: "Start connecting again from your app.",
    },
  },
  es: {
    title: "Conectar {client} con admin-OS",
    heading: "¿Permitir que {client} use tu demo de admin-OS?",
    publishedBy: "Publicada por {domain}.",
    unverified: "Esta app se registró sola; su nombre no está verificado.",
    redirect: "El acceso se envía a {host}.",
    loopback:
      "El acceso se envía a una app de tu ordenador. Continúa solo si acabas de empezar a conectarla desde ella.",
    actsAs: "Actúa como {role} sobre los datos de demostración de este navegador, los mismos que ves en la demo.",
    read: {
      title: "Leer",
      body: "Ver los registros y los ajustes del negocio de demostración. No puede cambiar nada.",
    },
    allow: "Permitir",
    deny: "Denegar",
    error: {
      title: "Esta conexión no puede continuar",
      invalidRequest: "La app envió una solicitud que este servidor no acepta.",
      unverifiedClient: "No se pudo verificar esta app.",
      expired: "Esta página caducó o ya se usó.",
      startAgain: "Vuelve a conectar desde tu app.",
    },
  },
  de: {
    title: "{client} mit admin-OS verbinden",
    heading: "Darf {client} deine admin-OS-Demo nutzen?",
    publishedBy: "Veröffentlicht von {domain}.",
    unverified: "Diese App hat sich selbst registriert; ihr Name ist nicht überprüft.",
    redirect: "Der Zugriff wird an {host} gesendet.",
    loopback:
      "Der Zugriff geht an eine App auf deinem Computer. Fahre nur fort, wenn du die Verbindung gerade dort gestartet hast.",
    actsAs: "Sie handelt als {role} mit den Demodaten dieses Browsers, denselben, die du in der Demo siehst.",
    read: {
      title: "Lesen",
      body: "Die Daten und Einstellungen des Demobetriebs ansehen. Sie kann nichts ändern.",
    },
    allow: "Zulassen",
    deny: "Ablehnen",
    error: {
      title: "Diese Verbindung kann nicht fortgesetzt werden",
      invalidRequest: "Die App hat eine Anfrage gesendet, die dieser Server nicht annimmt.",
      unverifiedClient: "Diese App konnte nicht überprüft werden.",
      expired: "Diese Seite ist abgelaufen oder wurde schon verwendet.",
      startAgain: "Starte die Verbindung in deiner App erneut.",
    },
  },
  fr: {
    title: "Connecter {client} à admin-OS",
    heading: "Autoriser {client} à utiliser votre démo admin-OS ?",
    publishedBy: "Publiée par {domain}.",
    unverified: "Cette app s’est enregistrée elle-même ; son nom n’est pas vérifié.",
    redirect: "L’accès est envoyé à {host}.",
    loopback:
      "L’accès est envoyé à une app de votre ordinateur. Continuez seulement si vous venez de lancer la connexion depuis celle-ci.",
    actsAs:
      "Elle agit en tant que {role} sur les données de démo de ce navigateur, celles que vous voyez dans la démo.",
    read: {
      title: "Lire",
      body: "Consulter les données et les paramètres de l’entreprise de démo. Elle ne peut rien modifier.",
    },
    allow: "Autoriser",
    deny: "Refuser",
    error: {
      title: "Cette connexion ne peut pas continuer",
      invalidRequest: "L’app a envoyé une demande que ce serveur n’accepte pas.",
      unverifiedClient: "Cette app n’a pas pu être vérifiée.",
      expired: "Cette page a expiré ou a déjà été utilisée.",
      startAgain: "Relancez la connexion depuis votre app.",
    },
  },
});
