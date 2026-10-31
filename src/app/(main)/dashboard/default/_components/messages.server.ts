import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type OverviewMessages, overviewMessageKey } from "./messages";

const en: OverviewMessages = {
  meta: {
    title: "Sales Overview",
    description: "Won revenue against target, the hottest open deals, team quota and the mix of the open pipeline.",
  },
  title: "Sales Overview",
  kpis: {
    won: "Won this month",
    versusLastMonth: "{change} vs last month",
    pipeline: "Open pipeline",
    winRate: "Win rate, closed deals",
  },
  revenue: {
    title: "Revenue",
    rangeLabel: "Revenue range",
    ranges: { sixMonths: "6M", twelveMonths: "12M" },
    options: "Revenue options",
    openReports: "Open growth reports",
    summary: {
      one: "won in {count} month · {atTarget} at target",
      other: "won in {count} months · {atTarget} of {count} at target",
    },
    won: "Won revenue",
    target: "Monthly target · {amount}",
  },
  quota: {
    title: "Team quota",
    options: "Quota options",
    attainment: "Team quota attainment",
    summary: "{won} of {target} · 12-month quota",
  },
  stageMix: {
    title: "Stage mix",
    openPipeline: "Open pipeline",
    openAcross: { one: "open across {count} deal", other: "open across {count} deals" },
    chartLabel: "Open pipeline value by stage",
  },
  hotDeals: {
    title: "Hot deals",
    byWeightedValue: "by weighted value",
    addDeal: "Add a deal in the pipeline",
    openPipeline: "Open pipeline",
  },
};

const es: OverviewMessages = {
  meta: {
    title: "Resumen de ventas",
    description:
      "Ingresos ganados frente al objetivo, las oportunidades abiertas más calientes, la cuota del equipo y la composición del embudo.",
  },
  title: "Resumen de ventas",
  kpis: {
    won: "Ganado este mes",
    versusLastMonth: "{change} vs. mes anterior",
    pipeline: "Embudo abierto",
    winRate: "Tasa de éxito, oportunidades cerradas",
  },
  revenue: {
    title: "Ingresos",
    rangeLabel: "Periodo de ingresos",
    ranges: { sixMonths: "6 m", twelveMonths: "12 m" },
    options: "Opciones de ingresos",
    openReports: "Abrir informes de crecimiento",
    summary: {
      one: "ganado en {count} mes · {atTarget} en objetivo",
      other: "ganado en {count} meses · {atTarget} de {count} en objetivo",
    },
    won: "Ingresos ganados",
    target: "Objetivo mensual · {amount}",
  },
  quota: {
    title: "Cuota del equipo",
    options: "Opciones de cuota",
    attainment: "Cumplimiento de la cuota del equipo",
    summary: "{won} de {target} · cuota de 12 meses",
  },
  stageMix: {
    title: "Reparto por fase",
    openPipeline: "Embudo abierto",
    openAcross: { one: "abierto en {count} oportunidad", other: "abierto en {count} oportunidades" },
    chartLabel: "Valor del embudo abierto por fase",
  },
  hotDeals: {
    title: "Oportunidades calientes",
    byWeightedValue: "por valor ponderado",
    addDeal: "Añadir una oportunidad al embudo",
    openPipeline: "Abrir embudo",
  },
};

const de: OverviewMessages = {
  meta: {
    title: "Vertriebsübersicht",
    description:
      "Gewonnener Umsatz gegenüber dem Ziel, die heißesten offenen Deals, die Teamquote und die Zusammensetzung der offenen Pipeline.",
  },
  title: "Vertriebsübersicht",
  kpis: {
    won: "Diesen Monat gewonnen",
    versusLastMonth: "{change} ggü. Vormonat",
    pipeline: "Offene Pipeline",
    winRate: "Abschlussquote, geschlossene Deals",
  },
  revenue: {
    title: "Umsatz",
    rangeLabel: "Umsatzzeitraum",
    ranges: { sixMonths: "6 M", twelveMonths: "12 M" },
    options: "Umsatzoptionen",
    openReports: "Wachstumsberichte öffnen",
    summary: {
      one: "gewonnen in {count} Monat · {atTarget} über dem Ziel",
      other: "gewonnen in {count} Monaten · {atTarget} von {count} über dem Ziel",
    },
    won: "Gewonnener Umsatz",
    target: "Monatsziel · {amount}",
  },
  quota: {
    title: "Teamquote",
    options: "Quotenoptionen",
    attainment: "Erfüllung der Teamquote",
    summary: "{won} von {target} · 12-Monats-Quote",
  },
  stageMix: {
    title: "Phasenmix",
    openPipeline: "Offene Pipeline",
    openAcross: { one: "offen bei {count} Deal", other: "offen bei {count} Deals" },
    chartLabel: "Wert der offenen Pipeline nach Phase",
  },
  hotDeals: {
    title: "Heiße Deals",
    byWeightedValue: "nach gewichtetem Wert",
    addDeal: "Deal zur Pipeline hinzufügen",
    openPipeline: "Pipeline öffnen",
  },
};

const fr: OverviewMessages = {
  meta: {
    title: "Aperçu des ventes",
    description:
      "Chiffre d’affaires gagné par rapport à l’objectif, les affaires ouvertes les plus chaudes, le quota de l’équipe et la répartition du pipeline ouvert.",
  },
  title: "Aperçu des ventes",
  kpis: {
    won: "Gagné ce mois-ci",
    versusLastMonth: "{change} vs mois précédent",
    pipeline: "Pipeline ouvert",
    winRate: "Taux de réussite, affaires closes",
  },
  revenue: {
    title: "Chiffre d’affaires",
    rangeLabel: "Période du chiffre d’affaires",
    ranges: { sixMonths: "6 m", twelveMonths: "12 m" },
    options: "Options du chiffre d’affaires",
    openReports: "Ouvrir les rapports de croissance",
    summary: {
      one: "gagné en {count} mois · {atTarget} à l’objectif",
      other: "gagné en {count} mois · {atTarget} sur {count} à l’objectif",
    },
    won: "Chiffre d’affaires gagné",
    target: "Objectif mensuel : {amount}",
  },
  quota: {
    title: "Quota de l’équipe",
    options: "Options du quota",
    attainment: "Atteinte du quota de l’équipe",
    summary: "{won} sur {target} · quota sur 12 mois",
  },
  stageMix: {
    title: "Répartition par étape",
    openPipeline: "Pipeline ouvert",
    openAcross: { one: "ouvert sur {count} affaire", other: "ouvert sur {count} affaires" },
    chartLabel: "Valeur du pipeline ouvert par étape",
  },
  hotDeals: {
    title: "Affaires chaudes",
    byWeightedValue: "par valeur pondérée",
    addDeal: "Ajouter une affaire au pipeline",
    openPipeline: "Ouvrir le pipeline",
  },
};

export const overviewMessages = defineMessages<OverviewMessages>({ en, es, de, fr });

export const overviewBundle: MessageBundle<OverviewMessages> = {
  key: overviewMessageKey,
  dictionary: overviewMessages,
};
