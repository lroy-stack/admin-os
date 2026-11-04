import { defineMessages, type ErrorMessages } from "@/core/i18n";

/** Texts for the approvals error codes, in the shape `errorText` takes. */
export const approvalsErrors = defineMessages<ErrorMessages>({
  en: {
    "approvals.not_found": "This request is no longer waiting for approval.",
    "approvals.not_pending": "This request has already been decided.",
    "approvals.expired": "This request expired after 24 hours without an answer. Ask the assistant to try again.",
    "approvals.conflict": "The situation changed since the assistant asked, so the request was not run.",
    "approvals.requester_forbidden": "The person who asked no longer has the right to do this, so it was not run.",
    "approvals.queue_full": "Too many requests are waiting for a person. Decide some of them, then ask again.",
  },
  es: {
    "approvals.not_found": "Esta solicitud ya no está esperando aprobación.",
    "approvals.not_pending": "Esta solicitud ya se ha resuelto.",
    "approvals.expired": "Esta solicitud caducó tras 24 horas sin respuesta. Pide al asistente que la repita.",
    "approvals.conflict": "La situación cambió desde que el asistente lo pidió, así que no se ejecutó.",
    "approvals.requester_forbidden": "Quien lo pidió ya no tiene permiso para hacerlo, así que no se ejecutó.",
    "approvals.queue_full": "Hay demasiadas solicitudes esperando a una persona. Resuelve alguna y vuelve a pedirlo.",
  },
  de: {
    "approvals.not_found": "Diese Anfrage wartet nicht mehr auf Genehmigung.",
    "approvals.not_pending": "Diese Anfrage wurde bereits entschieden.",
    "approvals.expired":
      "Diese Anfrage ist nach 24 Stunden ohne Antwort abgelaufen. Bitten Sie den Assistenten, es erneut zu versuchen.",
    "approvals.conflict":
      "Die Lage hat sich seit der Anfrage des Assistenten geändert, daher wurde sie nicht ausgeführt.",
    "approvals.requester_forbidden":
      "Die anfragende Person hat dieses Recht nicht mehr, daher wurde die Anfrage nicht ausgeführt.",
    "approvals.queue_full":
      "Zu viele Anfragen warten auf eine Person. Entscheiden Sie einige davon und fragen Sie dann erneut an.",
  },
  fr: {
    "approvals.not_found": "Cette demande n’attend plus d’approbation.",
    "approvals.not_pending": "Cette demande a déjà été traitée.",
    "approvals.expired": "Cette demande a expiré après 24 heures sans réponse. Demandez à l’assistant de la refaire.",
    "approvals.conflict": "La situation a changé depuis la demande de l’assistant, elle n’a donc pas été exécutée.",
    "approvals.requester_forbidden":
      "La personne à l’origine de la demande n’a plus le droit de le faire, elle n’a donc pas été exécutée.",
    "approvals.queue_full": "Trop de demandes attendent une personne. Traitez-en quelques-unes, puis redemandez.",
  },
});
