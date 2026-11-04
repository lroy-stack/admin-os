import { defineMessages, type ErrorMessages } from "@/core/i18n";

/** Texts for the approvals error code, in the shape `errorText` takes. */
export const approvalsErrors = defineMessages<ErrorMessages>({
  en: { "approvals.not_found": "This request is no longer waiting for approval." },
  es: { "approvals.not_found": "Esta solicitud ya no está esperando aprobación." },
  de: { "approvals.not_found": "Diese Anfrage wartet nicht mehr auf Genehmigung." },
  fr: { "approvals.not_found": "Cette demande n’attend plus d’approbation." },
});
