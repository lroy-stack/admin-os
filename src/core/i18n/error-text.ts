import { errorClassOf } from "@/core/errors";

import type { Locale } from "./locale";
import { defineMessages, format, type Message } from "./messages";

/**
 * Flat map: exact error codes (`bookings.table_taken`), error class names and `generic`. Codes are namespaced with a
 * dot and class names are not, so the keys cannot collide.
 */
export type ErrorMessages = Readonly<Record<string, Message>>;

export const defaultErrorMessages = defineMessages<ErrorMessages>({
  en: {
    forbidden: "You do not have permission to do this.",
    not_found: "This item no longer exists.",
    invalid: "Some of the data is not valid. Check it and try again.",
    conflict: "This was changed by someone else. Reload and try again.",
    unavailable: "The service is not available right now. Try again in a moment.",
    timeout: "The request took too long. Try again.",
    invalid_output: "The service returned an unexpected response. Error code: {code}.",
    generic: "Something went wrong. Error code: {code}.",
  },
  es: {
    forbidden: "No tienes permiso para hacer esto.",
    not_found: "Este elemento ya no existe.",
    invalid: "Algunos datos no son válidos. Revísalos e inténtalo de nuevo.",
    conflict: "Alguien más lo ha modificado. Recarga e inténtalo de nuevo.",
    unavailable: "El servicio no está disponible ahora. Inténtalo de nuevo en un momento.",
    timeout: "La solicitud ha tardado demasiado. Inténtalo de nuevo.",
    invalid_output: "El servicio ha devuelto una respuesta inesperada. Código de error: {code}.",
    generic: "Algo ha salido mal. Código de error: {code}.",
  },
  de: {
    forbidden: "Dafür fehlt dir die Berechtigung.",
    not_found: "Dieser Eintrag existiert nicht mehr.",
    invalid: "Einige Angaben sind ungültig. Prüfe sie und versuche es erneut.",
    conflict: "Das wurde von jemand anderem geändert. Lade neu und versuche es erneut.",
    unavailable: "Der Dienst ist gerade nicht verfügbar. Versuche es gleich noch einmal.",
    timeout: "Die Anfrage hat zu lange gedauert. Versuche es erneut.",
    invalid_output: "Der Dienst hat eine unerwartete Antwort geliefert. Fehlercode: {code}.",
    generic: "Etwas ist schiefgelaufen. Fehlercode: {code}.",
  },
  fr: {
    forbidden: "Vous n’avez pas l’autorisation de faire cela.",
    not_found: "Cet élément n’existe plus.",
    invalid: "Certaines données ne sont pas valides. Vérifiez-les et réessayez.",
    conflict: "Quelqu’un d’autre a modifié cet élément. Rechargez et réessayez.",
    unavailable: "Le service est indisponible pour le moment. Réessayez dans un instant.",
    timeout: "La requête a pris trop de temps. Réessayez.",
    invalid_output: "Le service a renvoyé une réponse inattendue. Code d’erreur : {code}.",
    generic: "Une erreur s’est produite. Code d’erreur : {code}.",
  },
});

/**
 * Renders from the error code, never from `message` (server text is for logs). Order: exact code in `dictionary`,
 * the code's class (`dictionary`, then the defaults), then the generic sentence that shows the code.
 */
export function errorText(
  error: { readonly code: string },
  dictionary: Readonly<Record<Locale, ErrorMessages>>,
  locale: Locale,
): string {
  const own = dictionary[locale];
  const defaults = defaultErrorMessages[locale];
  const errorClass = errorClassOf(error.code);
  const message = own[error.code] ?? own[errorClass] ?? defaults[errorClass] ?? own.generic ?? defaults.generic;
  return format(message as Message, locale, { code: error.code });
}
