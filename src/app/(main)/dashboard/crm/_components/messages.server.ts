import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CrmMessages, crmMessageKey } from "./messages";

const en: CrmMessages = {
  meta: {
    title: "Deal Pipeline",
    description: "Open deals by stage with close dates, values and owners, plus deals won and lost this month.",
  },
  title: "Deal Pipeline",
  kpis: {
    openPipeline: "Open pipeline",
    weightedForecast: "Weighted forecast",
    closingSoon: "Deals closing in 30 days",
  },
  searchLabel: "Search deals",
  searchPlaceholder: "Search deals…",
  ownerFilter: "Filter by owner",
  view: { label: "Pipeline view", board: "Board", list: "List" },
  exportDeals: "Export deals",
  newDeal: "New deal",
  noMatches: "No deals match these filters",
  table: { deal: "Deal", stage: "Stage", closes: "Closes", owners: "Owners", value: "Value" },
  addToStage: "Add deal to {stage}",
  outcomes: {
    label: "Closed this month",
    won: "Won",
    lost: "Lost",
    wonDetail: { one: "{count} this month", other: "{count} this month" },
    lostDetail: { one: "{count} closed lost", other: "{count} closed lost" },
  },
};

const es: CrmMessages = {
  meta: {
    title: "Embudo de oportunidades",
    description:
      "Oportunidades abiertas por fase con fechas de cierre, valores y responsables, además de las ganadas y perdidas este mes.",
  },
  title: "Embudo de oportunidades",
  kpis: {
    openPipeline: "Embudo abierto",
    weightedForecast: "Previsión ponderada",
    closingSoon: "Oportunidades que cierran en 30 días",
  },
  searchLabel: "Buscar oportunidades",
  searchPlaceholder: "Buscar oportunidades…",
  ownerFilter: "Filtrar por responsable",
  view: { label: "Vista del embudo", board: "Tablero", list: "Lista" },
  exportDeals: "Exportar oportunidades",
  newDeal: "Nueva oportunidad",
  noMatches: "Ninguna oportunidad coincide con estos filtros",
  table: { deal: "Oportunidad", stage: "Fase", closes: "Cierre", owners: "Responsables", value: "Valor" },
  addToStage: "Añadir oportunidad a {stage}",
  outcomes: {
    label: "Cerradas este mes",
    won: "Ganadas",
    lost: "Perdidas",
    wonDetail: { one: "{count} este mes", other: "{count} este mes" },
    lostDetail: { one: "{count} cerrada perdida", other: "{count} cerradas perdidas" },
  },
};

const de: CrmMessages = {
  meta: {
    title: "Deal-Pipeline",
    description:
      "Offene Deals nach Phase mit Abschlussdaten, Werten und Verantwortlichen sowie die in diesem Monat gewonnenen und verlorenen Deals.",
  },
  title: "Deal-Pipeline",
  kpis: {
    openPipeline: "Offene Pipeline",
    weightedForecast: "Gewichtete Prognose",
    closingSoon: "Deals mit Abschluss in 30 Tagen",
  },
  searchLabel: "Deals suchen",
  searchPlaceholder: "Deals suchen…",
  ownerFilter: "Nach Verantwortlichen filtern",
  view: { label: "Pipeline-Ansicht", board: "Board", list: "Liste" },
  exportDeals: "Deals exportieren",
  newDeal: "Neuer Deal",
  noMatches: "Keine Deals entsprechen diesen Filtern",
  table: { deal: "Deal", stage: "Phase", closes: "Abschluss", owners: "Verantwortliche", value: "Wert" },
  addToStage: "Deal zu {stage} hinzufügen",
  outcomes: {
    label: "In diesem Monat abgeschlossen",
    won: "Gewonnen",
    lost: "Verloren",
    wonDetail: { one: "{count} in diesem Monat", other: "{count} in diesem Monat" },
    lostDetail: { one: "{count} verloren", other: "{count} verloren" },
  },
};

const fr: CrmMessages = {
  meta: {
    title: "Pipeline des affaires",
    description:
      "Affaires ouvertes par étape avec dates de clôture, montants et responsables, ainsi que les affaires gagnées et perdues ce mois-ci.",
  },
  title: "Pipeline des affaires",
  kpis: {
    openPipeline: "Pipeline ouvert",
    weightedForecast: "Prévision pondérée",
    closingSoon: "Affaires à conclure sous 30 jours",
  },
  searchLabel: "Rechercher des affaires",
  searchPlaceholder: "Rechercher des affaires…",
  ownerFilter: "Filtrer par responsable",
  view: { label: "Vue du pipeline", board: "Tableau", list: "Liste" },
  exportDeals: "Exporter les affaires",
  newDeal: "Nouvelle affaire",
  noMatches: "Aucune affaire ne correspond à ces filtres",
  table: { deal: "Affaire", stage: "Étape", closes: "Clôture", owners: "Responsables", value: "Montant" },
  addToStage: "Ajouter une affaire à l’étape {stage}",
  outcomes: {
    label: "Clôturées ce mois-ci",
    won: "Gagnées",
    lost: "Perdues",
    wonDetail: { one: "{count} ce mois-ci", other: "{count} ce mois-ci" },
    lostDetail: { one: "{count} perdue", other: "{count} perdues" },
  },
};

export const crmMessages = defineMessages<CrmMessages>({ en, es, de, fr });

export const crmBundle: MessageBundle<CrmMessages> = { key: crmMessageKey, dictionary: crmMessages };
