import { defineMessages } from "@/core/i18n";

/**
 * The MCP Worker's pages, the consent page (ADR 0016 D4) and the grants page (D3), in the four locales (ADR 0007,
 * `docs/i18n/glossary.md`).
 */
export interface ConsentMessages {
  readonly title: string;
  readonly heading: string;
  readonly publishedBy: string;
  readonly unverified: string;
  readonly redirect: string;
  readonly loopback: string;
  readonly actsAs: string;
  readonly read: { readonly title: string; readonly body: string };
  readonly write: { readonly title: string; readonly body: string; readonly warning: string };
  readonly allow: string;
  readonly allowRead: string;
  readonly allowWrite: string;
  readonly deny: string;
  readonly manage: string;
  readonly error: {
    readonly title: string;
    readonly invalidRequest: string;
    readonly unverifiedClient: string;
    readonly expired: string;
    readonly startAgain: string;
  };
  readonly grants: {
    readonly title: string;
    readonly intro: string;
    readonly empty: string;
    readonly read: string;
    readonly write: string;
    readonly since: string;
    readonly revoke: string;
    readonly revoked: string;
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
    write: {
      title: "Change",
      body: "Create, update and cancel records as the role allows. Writes that need a person still wait for approval in the demo.",
      warning: "This app also asks to change data. Allow it only if you want it to act for you.",
    },
    allow: "Allow",
    allowRead: "Allow reading only",
    allowWrite: "Allow reading and changes",
    deny: "Deny",
    manage: "You can revoke this access at any time on the connected apps page.",
    error: {
      title: "This connection cannot continue",
      invalidRequest: "The app sent a request this server does not accept.",
      unverifiedClient: "This app could not be verified.",
      expired: "This page expired or was already used.",
      startAgain: "Start connecting again from your app.",
    },
    grants: {
      title: "Connected apps",
      intro: "Apps with access to the demo data of this browser.",
      empty: "No app has access to the demo data of this browser.",
      read: "Read",
      write: "Read and change",
      since: "Connected {date}",
      revoke: "Revoke",
      revoked: "Access revoked. The app has to connect again.",
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
    write: {
      title: "Cambiar",
      body: "Crear, actualizar y cancelar registros según lo que permita el rol. Los cambios que necesitan a una persona siguen esperando su aprobación en la demo.",
      warning: "Esta app también pide cambiar datos. Permítelo solo si quieres que actúe por ti.",
    },
    allow: "Permitir",
    allowRead: "Permitir solo leer",
    allowWrite: "Permitir leer y cambiar",
    deny: "Denegar",
    manage: "Puedes revocar este acceso cuando quieras en la página de apps conectadas.",
    error: {
      title: "Esta conexión no puede continuar",
      invalidRequest: "La app envió una solicitud que este servidor no acepta.",
      unverifiedClient: "No se pudo verificar esta app.",
      expired: "Esta página caducó o ya se usó.",
      startAgain: "Vuelve a conectar desde tu app.",
    },
    grants: {
      title: "Apps conectadas",
      intro: "Apps con acceso a los datos de demostración de este navegador.",
      empty: "Ninguna app tiene acceso a los datos de demostración de este navegador.",
      read: "Leer",
      write: "Leer y cambiar",
      since: "Conectada el {date}",
      revoke: "Revocar",
      revoked: "Acceso revocado. La app tiene que volver a conectarse.",
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
    write: {
      title: "Ändern",
      body: "Datensätze anlegen, aktualisieren und stornieren, soweit die Rolle es erlaubt. Änderungen, die eine Person brauchen, warten weiter auf ihre Freigabe in der Demo.",
      warning: "Diese App möchte auch Daten ändern. Erlaube es nur, wenn sie für dich handeln soll.",
    },
    allow: "Zulassen",
    allowRead: "Nur Lesen zulassen",
    allowWrite: "Lesen und Ändern zulassen",
    deny: "Ablehnen",
    manage: "Du kannst diesen Zugriff jederzeit auf der Seite der verbundenen Apps widerrufen.",
    error: {
      title: "Diese Verbindung kann nicht fortgesetzt werden",
      invalidRequest: "Die App hat eine Anfrage gesendet, die dieser Server nicht annimmt.",
      unverifiedClient: "Diese App konnte nicht überprüft werden.",
      expired: "Diese Seite ist abgelaufen oder wurde schon verwendet.",
      startAgain: "Starte die Verbindung in deiner App erneut.",
    },
    grants: {
      title: "Verbundene Apps",
      intro: "Apps mit Zugriff auf die Demodaten dieses Browsers.",
      empty: "Keine App hat Zugriff auf die Demodaten dieses Browsers.",
      read: "Lesen",
      write: "Lesen und Ändern",
      since: "Verbunden am {date}",
      revoke: "Widerrufen",
      revoked: "Zugriff widerrufen. Die App muss sich neu verbinden.",
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
    write: {
      title: "Modifier",
      body: "Créer, mettre à jour et annuler des enregistrements selon ce que le rôle permet. Les modifications qui demandent une personne attendent toujours son approbation dans la démo.",
      warning:
        "Cette app demande aussi à modifier des données. Autorisez-le seulement si vous voulez qu’elle agisse pour vous.",
    },
    allow: "Autoriser",
    allowRead: "Autoriser la lecture seule",
    allowWrite: "Autoriser la lecture et les modifications",
    deny: "Refuser",
    manage: "Vous pouvez révoquer cet accès à tout moment sur la page des apps connectées.",
    error: {
      title: "Cette connexion ne peut pas continuer",
      invalidRequest: "L’app a envoyé une demande que ce serveur n’accepte pas.",
      unverifiedClient: "Cette app n’a pas pu être vérifiée.",
      expired: "Cette page a expiré ou a déjà été utilisée.",
      startAgain: "Relancez la connexion depuis votre app.",
    },
    grants: {
      title: "Apps connectées",
      intro: "Apps ayant accès aux données de démo de ce navigateur.",
      empty: "Aucune app n’a accès aux données de démo de ce navigateur.",
      read: "Lire",
      write: "Lire et modifier",
      since: "Connectée le {date}",
      revoke: "Révoquer",
      revoked: "Accès révoqué. L’app doit se reconnecter.",
    },
  },
});
