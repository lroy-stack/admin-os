import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type FinanceV1Messages, financeV1MessageKey } from "./messages";

const en: FinanceV1Messages = {
  meta: {
    title: "Finance overview",
    description: "A finance overview with accounts, net worth, cash flow, spending by category and upcoming payments.",
  },
  tabs: { overview: "Overview", activity: "Activity", insights: "Insights", utilities: "Utilities" },
  kpis: {
    versusLastMonth: "{change} vs last month",
    primaryAccount: { title: "Primary account", balance: "Available balance" },
    netWorth: { title: "Net worth", period: "This month", scope: "Across all linked accounts" },
    monthlyCashFlow: { title: "Monthly cash flow", period: "This month · Net" },
    savingsRate: { title: "Savings rate", period: "This month · After expenses", note: "Above your average" },
  },
  cashFlow: {
    title: "Cash flow overview",
    description: "Monthly income and expenses with net cash impact.",
    periodPlaceholder: "Select period",
    periods: {
      thisMonth: "This month",
      lastSixMonths: "Last 6 months",
      yearToDate: "Year to date",
      thisYear: "This year",
    },
    income: "Income",
    expenses: "Expenses",
  },
  spending: {
    title: "Spending breakdown",
    description: "Expense distribution by category.",
    segment: "{category}: {amount}",
    categories: {
      housing: "Housing",
      utilities: "Utilities",
      groceries: "Groceries",
      transportation: "Transport",
      subscriptions: "Subscriptions",
      healthcare: "Healthcare",
      other: "Other",
    },
  },
  reliability: {
    title: "Income reliability",
    description: "How consistent your income has been recently.",
    level: "High reliability",
    basis: { one: "Based on the last month of income", other: "Based on the last {count} months of income" },
    fixed: { title: "Fixed income", description: "Recurring · Predictable" },
    variable: { title: "Variable income", description: "Fluctuating sources" },
    trend: "Consistency trend:",
    stable: "Stable",
  },
  card: {
    title: "My card",
    description: "{added} of {total} cards added · Overview of your primary card and upcoming payments",
    validThru: "Valid thru",
    cvv: "CVV",
    type: "Card type",
    virtual: "Virtual",
    billingCycle: "Billing cycle",
    billingDay: "Day {day} of each month",
    limit: "Card limit",
    availableBalance: "Available balance",
    upcomingPayments: "Upcoming payments",
    dueOn: "Due on {date}",
    payments: {
      rent: "Apartment rent",
      electricity: "Electricity bill",
      chatgpt: "ChatGPT Plus",
      creditCard: "Credit card payment",
    },
  },
};

const es: FinanceV1Messages = {
  meta: {
    title: "Resumen financiero",
    description:
      "Un resumen financiero con cuentas, patrimonio neto, flujo de caja, gastos por categoría y próximos pagos.",
  },
  tabs: { overview: "Resumen", activity: "Actividad", insights: "Análisis", utilities: "Suministros" },
  kpis: {
    versusLastMonth: "{change} vs. mes anterior",
    primaryAccount: { title: "Cuenta principal", balance: "Saldo disponible" },
    netWorth: { title: "Patrimonio neto", period: "Este mes", scope: "En todas las cuentas vinculadas" },
    monthlyCashFlow: { title: "Flujo de caja mensual", period: "Este mes · Neto" },
    savingsRate: { title: "Tasa de ahorro", period: "Este mes · Después de gastos", note: "Por encima de tu media" },
  },
  cashFlow: {
    title: "Resumen del flujo de caja",
    description: "Ingresos y gastos mensuales con su impacto neto en caja.",
    periodPlaceholder: "Seleccionar periodo",
    periods: {
      thisMonth: "Este mes",
      lastSixMonths: "Últimos 6 meses",
      yearToDate: "Año en curso",
      thisYear: "Este año",
    },
    income: "Ingresos",
    expenses: "Gastos",
  },
  spending: {
    title: "Desglose de gastos",
    description: "Distribución de los gastos por categoría.",
    segment: "{category}: {amount}",
    categories: {
      housing: "Vivienda",
      utilities: "Suministros",
      groceries: "Alimentación",
      transportation: "Transporte",
      subscriptions: "Suscripciones",
      healthcare: "Salud",
      other: "Otros",
    },
  },
  reliability: {
    title: "Fiabilidad de los ingresos",
    description: "Qué tan constantes han sido tus ingresos últimamente.",
    level: "Fiabilidad alta",
    basis: { one: "Según el último mes de ingresos", other: "Según los últimos {count} meses de ingresos" },
    fixed: { title: "Ingresos fijos", description: "Recurrentes · Previsibles" },
    variable: { title: "Ingresos variables", description: "Fuentes fluctuantes" },
    trend: "Tendencia de regularidad:",
    stable: "Estable",
  },
  card: {
    title: "Mi tarjeta",
    description: "{added} de {total} tarjetas añadidas · Resumen de tu tarjeta principal y próximos pagos",
    validThru: "Válida hasta",
    cvv: "CVV",
    type: "Tipo de tarjeta",
    virtual: "Virtual",
    billingCycle: "Ciclo de facturación",
    billingDay: "Día {day} de cada mes",
    limit: "Límite de la tarjeta",
    availableBalance: "Saldo disponible",
    upcomingPayments: "Próximos pagos",
    dueOn: "Vence el {date}",
    payments: {
      rent: "Alquiler del piso",
      electricity: "Factura de electricidad",
      chatgpt: "ChatGPT Plus",
      creditCard: "Pago de la tarjeta de crédito",
    },
  },
};

const de: FinanceV1Messages = {
  meta: {
    title: "Finanzübersicht",
    description:
      "Eine Finanzübersicht mit Konten, Nettovermögen, Cashflow, Ausgaben nach Kategorie und anstehenden Zahlungen.",
  },
  tabs: { overview: "Übersicht", activity: "Aktivität", insights: "Einblicke", utilities: "Nebenkosten" },
  kpis: {
    versusLastMonth: "{change} ggü. Vormonat",
    primaryAccount: { title: "Hauptkonto", balance: "Verfügbarer Kontostand" },
    netWorth: { title: "Nettovermögen", period: "Diesen Monat", scope: "Über alle verknüpften Konten" },
    monthlyCashFlow: { title: "Monatlicher Cashflow", period: "Diesen Monat · Netto" },
    savingsRate: { title: "Sparquote", period: "Diesen Monat · Nach Ausgaben", note: "Über deinem Durchschnitt" },
  },
  cashFlow: {
    title: "Cashflow-Übersicht",
    description: "Monatliche Einnahmen und Ausgaben mit Nettoeffekt auf die Liquidität.",
    periodPlaceholder: "Zeitraum wählen",
    periods: {
      thisMonth: "Diesen Monat",
      lastSixMonths: "Letzte 6 Monate",
      yearToDate: "Laufendes Jahr",
      thisYear: "Dieses Jahr",
    },
    income: "Einnahmen",
    expenses: "Ausgaben",
  },
  spending: {
    title: "Ausgabenaufschlüsselung",
    description: "Verteilung der Ausgaben nach Kategorie.",
    segment: "{category}: {amount}",
    categories: {
      housing: "Wohnen",
      utilities: "Nebenkosten",
      groceries: "Lebensmittel",
      transportation: "Verkehr",
      subscriptions: "Abonnements",
      healthcare: "Gesundheit",
      other: "Sonstiges",
    },
  },
  reliability: {
    title: "Verlässlichkeit des Einkommens",
    description: "Wie gleichmäßig dein Einkommen zuletzt war.",
    level: "Hohe Verlässlichkeit",
    basis: {
      one: "Basierend auf dem Einkommen des letzten Monats",
      other: "Basierend auf dem Einkommen der letzten {count} Monate",
    },
    fixed: { title: "Festes Einkommen", description: "Wiederkehrend · Planbar" },
    variable: { title: "Variables Einkommen", description: "Schwankende Quellen" },
    trend: "Trend der Gleichmäßigkeit:",
    stable: "Stabil",
  },
  card: {
    title: "Meine Karte",
    description: "{added} von {total} Karten hinzugefügt · Übersicht deiner Hauptkarte und anstehender Zahlungen",
    validThru: "Gültig bis",
    cvv: "CVV",
    type: "Kartentyp",
    virtual: "Virtuell",
    billingCycle: "Abrechnungszyklus",
    billingDay: "{day}. des Monats",
    limit: "Kartenlimit",
    availableBalance: "Verfügbarer Kontostand",
    upcomingPayments: "Anstehende Zahlungen",
    dueOn: "Fällig am {date}",
    payments: {
      rent: "Wohnungsmiete",
      electricity: "Stromrechnung",
      chatgpt: "ChatGPT Plus",
      creditCard: "Kreditkartenzahlung",
    },
  },
};

const fr: FinanceV1Messages = {
  meta: {
    title: "Aperçu financier",
    description:
      "Un aperçu financier avec comptes, patrimoine net, flux de trésorerie, dépenses par catégorie et paiements à venir.",
  },
  tabs: { overview: "Aperçu", activity: "Activité", insights: "Analyses", utilities: "Charges" },
  kpis: {
    versusLastMonth: "{change} vs mois précédent",
    primaryAccount: { title: "Compte principal", balance: "Solde disponible" },
    netWorth: { title: "Patrimoine net", period: "Ce mois-ci", scope: "Sur tous les comptes liés" },
    monthlyCashFlow: { title: "Flux de trésorerie mensuel", period: "Ce mois-ci · Net" },
    savingsRate: { title: "Taux d’épargne", period: "Ce mois-ci · Après dépenses", note: "Au-dessus de votre moyenne" },
  },
  cashFlow: {
    title: "Aperçu des flux de trésorerie",
    description: "Revenus et dépenses mensuels avec leur effet net sur la trésorerie.",
    periodPlaceholder: "Sélectionner une période",
    periods: {
      thisMonth: "Ce mois-ci",
      lastSixMonths: "6 derniers mois",
      yearToDate: "Depuis janvier",
      thisYear: "Cette année",
    },
    income: "Revenus",
    expenses: "Dépenses",
  },
  spending: {
    title: "Répartition des dépenses",
    description: "Répartition des dépenses par catégorie.",
    segment: "{category} : {amount}",
    categories: {
      housing: "Logement",
      utilities: "Charges",
      groceries: "Courses",
      transportation: "Transports",
      subscriptions: "Abonnements",
      healthcare: "Santé",
      other: "Autres",
    },
  },
  reliability: {
    title: "Fiabilité des revenus",
    description: "La régularité de vos revenus ces derniers temps.",
    level: "Fiabilité élevée",
    basis: { one: "Sur la base du dernier mois de revenus", other: "Sur la base des {count} derniers mois de revenus" },
    fixed: { title: "Revenus fixes", description: "Récurrents · Prévisibles" },
    variable: { title: "Revenus variables", description: "Sources fluctuantes" },
    trend: "Tendance de régularité :",
    stable: "Stable",
  },
  card: {
    title: "Ma carte",
    description: "{added} cartes sur {total} ajoutées · Aperçu de votre carte principale et des paiements à venir",
    validThru: "Valide jusqu’au",
    cvv: "CVV",
    type: "Type de carte",
    virtual: "Virtuelle",
    billingCycle: "Cycle de facturation",
    billingDay: "Le {day} de chaque mois",
    limit: "Plafond de la carte",
    availableBalance: "Solde disponible",
    upcomingPayments: "Paiements à venir",
    dueOn: "Échéance le {date}",
    payments: {
      rent: "Loyer de l’appartement",
      electricity: "Facture d’électricité",
      chatgpt: "ChatGPT Plus",
      creditCard: "Paiement de la carte de crédit",
    },
  },
};

export const financeV1Messages = defineMessages<FinanceV1Messages>({ en, es, de, fr });

export const financeV1Bundle: MessageBundle<FinanceV1Messages> = {
  key: financeV1MessageKey,
  dictionary: financeV1Messages,
};
