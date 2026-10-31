import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type GrowthMessages, growthMessageKey } from "./messages";

const en: GrowthMessages = {
  meta: {
    title: "Growth Reports",
    description: "Won revenue by segment, lead sources, new customers and win rate over the last 3, 6 or 12 months.",
  },
  title: "Growth Reports",
  periodLabel: "Report period",
  periods: { threeMonths: "3M", sixMonths: "6M", twelveMonths: "12M" },
  exportCsv: "Export CSV",
  openCustomers: "Open customers",
  openPipeline: "Open pipeline",
  kpis: {
    newCustomers: "New customers, last {count} months",
    averageWonDeal: "Average won deal",
    salesCycle: "Average sales cycle, days",
  },
  segments: { enterprise: "Enterprise", midMarket: "Mid-market", smb: "SMB" },
  channels: {
    Website: "Website",
    Referral: "Referral",
    LinkedIn: "LinkedIn",
    Email: "Email",
    Events: "Events",
    WhatsApp: "WhatsApp",
  },
  revenueBySegment: {
    title: "Revenue by segment",
    unitLabel: "Chart unit",
    wonSummary: "won, last {count} months",
  },
  leadSources: {
    title: "Lead sources",
    intro: {
      one: "How the customer who joined in the last {months} months reached us. One customer can come through several channels.",
      other:
        "How the {count} customers who joined in the last {months} months reached us. One customer can come through several channels.",
    },
    centerLabel: { one: "new customer", other: "new customers" },
  },
  newCustomers: {
    title: "New customers per month",
    series: "New customers",
  },
  winRate: {
    title: "Win rate trend",
    series: "Win rate",
    average: "Average",
    tooltip: "Win rate: {rate}",
  },
};

const es: GrowthMessages = {
  meta: {
    title: "Informes de crecimiento",
    description:
      "Ingresos ganados por segmento, origen de los leads, clientes nuevos y tasa de éxito de los últimos 3, 6 o 12 meses.",
  },
  title: "Informes de crecimiento",
  periodLabel: "Periodo del informe",
  periods: { threeMonths: "3 meses", sixMonths: "6 meses", twelveMonths: "12 meses" },
  exportCsv: "Exportar CSV",
  openCustomers: "Abrir clientes",
  openPipeline: "Abrir embudo",
  kpis: {
    newCustomers: "Clientes nuevos, últimos {count} meses",
    averageWonDeal: "Valor medio por oportunidad ganada",
    salesCycle: "Ciclo de venta medio, en días",
  },
  segments: { enterprise: "Gran empresa", midMarket: "Mediana empresa", smb: "Pequeña empresa" },
  channels: {
    Website: "Sitio web",
    Referral: "Recomendación",
    LinkedIn: "LinkedIn",
    Email: "Correo",
    Events: "Eventos",
    WhatsApp: "WhatsApp",
  },
  revenueBySegment: {
    title: "Ingresos por segmento",
    unitLabel: "Unidad del gráfico",
    wonSummary: "ganado, últimos {count} meses",
  },
  leadSources: {
    title: "Origen de los leads",
    intro: {
      one: "Cómo llegó a nosotros el cliente que se incorporó en los últimos {months} meses. Un cliente puede llegar por varios canales.",
      other:
        "Cómo llegaron a nosotros los {count} clientes que se incorporaron en los últimos {months} meses. Un cliente puede llegar por varios canales.",
    },
    centerLabel: { one: "cliente nuevo", other: "clientes nuevos" },
  },
  newCustomers: {
    title: "Clientes nuevos por mes",
    series: "Clientes nuevos",
  },
  winRate: {
    title: "Evolución de la tasa de éxito",
    series: "Tasa de éxito",
    average: "Media",
    tooltip: "Tasa de éxito: {rate}",
  },
};

const de: GrowthMessages = {
  meta: {
    title: "Wachstumsberichte",
    description:
      "Gewonnener Umsatz nach Segment, Lead-Quellen, Neukunden und Abschlussquote der letzten 3, 6 oder 12 Monate.",
  },
  title: "Wachstumsberichte",
  periodLabel: "Berichtszeitraum",
  periods: { threeMonths: "3 Mon.", sixMonths: "6 Mon.", twelveMonths: "12 Mon." },
  exportCsv: "CSV exportieren",
  openCustomers: "Kunden öffnen",
  openPipeline: "Pipeline öffnen",
  kpis: {
    newCustomers: "Neukunden, letzte {count} Monate",
    averageWonDeal: "Ø Wert gewonnener Deals",
    salesCycle: "Ø Verkaufszyklus in Tagen",
  },
  segments: { enterprise: "Großunternehmen", midMarket: "Mittelstand", smb: "Kleinunternehmen" },
  channels: {
    Website: "Website",
    Referral: "Empfehlung",
    LinkedIn: "LinkedIn",
    Email: "E-Mail",
    Events: "Veranstaltungen",
    WhatsApp: "WhatsApp",
  },
  revenueBySegment: {
    title: "Umsatz nach Segment",
    unitLabel: "Einheit des Diagramms",
    wonSummary: "gewonnen, letzte {count} Monate",
  },
  leadSources: {
    title: "Lead-Quellen",
    intro: {
      one: "Wie der Kunde, der in den letzten {months} Monaten dazugekommen ist, zu uns gefunden hat. Ein Kunde kann über mehrere Kanäle kommen.",
      other:
        "Wie die {count} Kunden, die in den letzten {months} Monaten dazugekommen sind, zu uns gefunden haben. Ein Kunde kann über mehrere Kanäle kommen.",
    },
    centerLabel: { one: "Neukunde", other: "Neukunden" },
  },
  newCustomers: {
    title: "Neukunden pro Monat",
    series: "Neukunden",
  },
  winRate: {
    title: "Entwicklung der Abschlussquote",
    series: "Abschlussquote",
    average: "Ø",
    tooltip: "Abschlussquote: {rate}",
  },
};

const fr: GrowthMessages = {
  meta: {
    title: "Rapports de croissance",
    description:
      "Chiffre d’affaires gagné par segment, sources des prospects, nouveaux clients et taux de réussite sur les 3, 6 ou 12 derniers mois.",
  },
  title: "Rapports de croissance",
  periodLabel: "Période du rapport",
  periods: { threeMonths: "3 mois", sixMonths: "6 mois", twelveMonths: "12 mois" },
  exportCsv: "Exporter en CSV",
  openCustomers: "Ouvrir les clients",
  openPipeline: "Ouvrir le pipeline",
  kpis: {
    newCustomers: "Nouveaux clients, {count} derniers mois",
    averageWonDeal: "Valeur moyenne d’une affaire gagnée",
    salesCycle: "Cycle de vente moyen, en jours",
  },
  segments: { enterprise: "Grands comptes", midMarket: "Moyennes entreprises", smb: "Petites entreprises" },
  channels: {
    Website: "Site web",
    Referral: "Recommandation",
    LinkedIn: "LinkedIn",
    Email: "E-mail",
    Events: "Événements",
    WhatsApp: "WhatsApp",
  },
  revenueBySegment: {
    title: "Chiffre d’affaires par segment",
    unitLabel: "Unité du graphique",
    wonSummary: "gagné, {count} derniers mois",
  },
  leadSources: {
    title: "Sources des prospects",
    intro: {
      one: "Comment le client arrivé ces {months} derniers mois nous a trouvés. Un client peut passer par plusieurs canaux.",
      other:
        "Comment les {count} clients arrivés ces {months} derniers mois nous ont trouvés. Un client peut passer par plusieurs canaux.",
    },
    centerLabel: { one: "nouveau client", other: "nouveaux clients" },
  },
  newCustomers: {
    title: "Nouveaux clients par mois",
    series: "Nouveaux clients",
  },
  winRate: {
    title: "Évolution du taux de réussite",
    series: "Taux de réussite",
    average: "Moy.",
    tooltip: "Taux de réussite\u00a0: {rate}",
  },
};

export const growthMessages = defineMessages<GrowthMessages>({ en, es, de, fr });

export const growthBundle: MessageBundle<GrowthMessages> = {
  key: growthMessageKey,
  dictionary: growthMessages,
};
