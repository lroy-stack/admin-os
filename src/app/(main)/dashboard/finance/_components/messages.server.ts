import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type FinanceMessages, financeMessageKey } from "./messages";

const en: FinanceMessages = {
  meta: {
    title: "Personal finances",
    description:
      "A personal finance dashboard with net worth, spending, income sources, account allocation, transactions and wallets.",
  },
  header: { title: "Personal finances", updated: "Updated {time}", settings: "Settings", export: "Export" },
  tabs: { dashboard: "Dashboard", accounts: "Accounts", transactions: "Transactions" },
  comingSoon: { accounts: "Accounts view coming soon.", transactions: "Transactions view coming soon." },
  kpis: {
    netWorth: "Net worth",
    netWorthChange: "+{amount} vs last month",
    availableCash: "Available cash",
    availableCashChange: "{amount} above your {days}-day average",
    monthlySpend: "Monthly spend",
    monthlySpendChange: "{amount} more than last month",
    savingsRate: "Savings rate",
    savingsRateChange: "Up from {percent} last month",
  },
  income: {
    title: "Income sources",
    share: "{source} · {percent}",
    sources: { salary: "Primary salary", freelance: "Freelance projects", investments: "Dividends and interest" },
  },
  notification: {
    title: "Credit score updated",
    description: {
      one: "Your score increased by {count} point to {score}.",
      other: "Your score increased by {count} points to {score}.",
    },
    action: "View details",
  },
  spending: {
    title: "Spending overview",
    periodLabel: "Period",
    periods: { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" },
    expense: "Expense",
    income: "Income",
  },
  allocation: {
    title: "Account allocation",
    balance: "Balance",
    total: "Total",
    accounts: {
      main: "Main account",
      savings: "Savings account",
      investment: "Investment account",
      reserve: "Reserve account",
    },
  },
  wallet: {
    title: "Wallet",
    physicalVault: "Physical vault:",
    airGapped: "Air-gapped",
    quantity: "{quantity} {ticker}",
  },
  upcoming: {
    title: "Upcoming bills and payments",
    billsDue: { one: "You have {count} bill due this month", other: "You have {count} bills due this month" },
    autopay: "Autopay will process {amount} today",
    when: "{time} · {date}",
    items: { claude: "Claude Pro subscription", resend: "Resend Pro Team", linear: "Linear Plus plan" },
  },
  quick: {
    transferTitle: "Quick transfer",
    amountLabel: "Amount",
    send: "Send",
    shortcutsTitle: "Shortcuts",
    shortcuts: {
      scanQr: "Scan QR",
      transfer: "Transfer",
      payBills: "Pay bills",
      history: "History",
      mobile: "Mobile",
      electricity: "Electricity",
      water: "Water",
      more: "More",
    },
  },
};

const es: FinanceMessages = {
  meta: {
    title: "Finanzas personales",
    description:
      "Un panel de finanzas personales con patrimonio neto, gastos, fuentes de ingresos, distribución de cuentas, transacciones y carteras.",
  },
  header: { title: "Finanzas personales", updated: "Actualizado {time}", settings: "Ajustes", export: "Exportar" },
  tabs: { dashboard: "Panel", accounts: "Cuentas", transactions: "Transacciones" },
  comingSoon: {
    accounts: "La vista de cuentas llegará pronto.",
    transactions: "La vista de transacciones llegará pronto.",
  },
  kpis: {
    netWorth: "Patrimonio neto",
    netWorthChange: "+{amount} vs. mes anterior",
    availableCash: "Efectivo disponible",
    availableCashChange: "{amount} por encima de tu media de {days} días",
    monthlySpend: "Gasto mensual",
    monthlySpendChange: "{amount} más que el mes anterior",
    savingsRate: "Tasa de ahorro",
    savingsRateChange: "Sube desde el {percent} del mes anterior",
  },
  income: {
    title: "Fuentes de ingresos",
    share: "{source} · {percent}",
    sources: { salary: "Salario principal", freelance: "Proyectos freelance", investments: "Dividendos e intereses" },
  },
  notification: {
    title: "Puntuación crediticia actualizada",
    description: {
      one: "Tu puntuación ha subido {count} punto hasta {score}.",
      other: "Tu puntuación ha subido {count} puntos hasta {score}.",
    },
    action: "Ver detalles",
  },
  spending: {
    title: "Resumen de gastos",
    periodLabel: "Periodo",
    periods: { weekly: "Semanal", monthly: "Mensual", yearly: "Anual" },
    expense: "Gastos",
    income: "Ingresos",
  },
  allocation: {
    title: "Distribución de cuentas",
    balance: "Saldo",
    total: "Total",
    accounts: {
      main: "Cuenta principal",
      savings: "Cuenta de ahorro",
      investment: "Cuenta de inversión",
      reserve: "Cuenta de reserva",
    },
  },
  wallet: {
    title: "Cartera",
    physicalVault: "Cartera física:",
    airGapped: "Aislada de la red",
    quantity: "{quantity} {ticker}",
  },
  upcoming: {
    title: "Facturas y pagos próximos",
    billsDue: {
      one: "Tienes {count} factura que vence este mes",
      other: "Tienes {count} facturas que vencen este mes",
    },
    autopay: "El pago automático procesará {amount} hoy",
    when: "{time} · {date}",
    items: { claude: "Suscripción a Claude Pro", resend: "Resend Pro Team", linear: "Plan Linear Plus" },
  },
  quick: {
    transferTitle: "Transferencia rápida",
    amountLabel: "Importe",
    send: "Enviar",
    shortcutsTitle: "Accesos directos",
    shortcuts: {
      scanQr: "Escanear QR",
      transfer: "Transferir",
      payBills: "Pagar facturas",
      history: "Historial",
      mobile: "Móvil",
      electricity: "Electricidad",
      water: "Agua",
      more: "Más",
    },
  },
};

const de: FinanceMessages = {
  meta: {
    title: "Persönliche Finanzen",
    description:
      "Ein Dashboard für persönliche Finanzen mit Nettovermögen, Ausgaben, Einkommensquellen, Kontoaufteilung, Transaktionen und Wallets.",
  },
  header: {
    title: "Persönliche Finanzen",
    updated: "Aktualisiert {time}",
    settings: "Einstellungen",
    export: "Exportieren",
  },
  tabs: { dashboard: "Dashboard", accounts: "Konten", transactions: "Transaktionen" },
  comingSoon: {
    accounts: "Die Kontenansicht folgt in Kürze.",
    transactions: "Die Transaktionsansicht folgt in Kürze.",
  },
  kpis: {
    netWorth: "Nettovermögen",
    netWorthChange: "+{amount} ggü. Vormonat",
    availableCash: "Verfügbares Guthaben",
    availableCashChange: "{amount} über deinem {days}-Tage-Schnitt",
    monthlySpend: "Monatliche Ausgaben",
    monthlySpendChange: "{amount} mehr als im Vormonat",
    savingsRate: "Sparquote",
    savingsRateChange: "Vormonat: {percent}",
  },
  income: {
    title: "Einkommensquellen",
    share: "{source} · {percent}",
    sources: { salary: "Hauptgehalt", freelance: "Freelance-Projekte", investments: "Dividenden und Zinsen" },
  },
  notification: {
    title: "Kredit-Score aktualisiert",
    description: {
      one: "Dein Score ist um {count} Punkt auf {score} gestiegen.",
      other: "Dein Score ist um {count} Punkte auf {score} gestiegen.",
    },
    action: "Details anzeigen",
  },
  spending: {
    title: "Ausgabenübersicht",
    periodLabel: "Zeitraum",
    periods: { weekly: "Wöchentlich", monthly: "Monatlich", yearly: "Jährlich" },
    expense: "Ausgaben",
    income: "Einnahmen",
  },
  allocation: {
    title: "Kontoaufteilung",
    balance: "Kontostand",
    total: "Gesamt",
    accounts: {
      main: "Hauptkonto",
      savings: "Sparkonto",
      investment: "Anlagekonto",
      reserve: "Rücklagenkonto",
    },
  },
  wallet: {
    title: "Wallet",
    physicalVault: "Physischer Tresor:",
    airGapped: "Vom Netz getrennt",
    quantity: "{quantity} {ticker}",
  },
  upcoming: {
    title: "Anstehende Rechnungen und Zahlungen",
    billsDue: {
      one: "Diesen Monat ist {count} Rechnung fällig",
      other: "Diesen Monat sind {count} Rechnungen fällig",
    },
    autopay: "Die automatische Zahlung bucht heute {amount} ab",
    when: "{time} · {date}",
    items: { claude: "Claude-Pro-Abo", resend: "Resend Pro Team", linear: "Linear-Plus-Tarif" },
  },
  quick: {
    transferTitle: "Schnellüberweisung",
    amountLabel: "Betrag",
    send: "Senden",
    shortcutsTitle: "Kurzbefehle",
    shortcuts: {
      scanQr: "QR scannen",
      transfer: "Überweisen",
      payBills: "Rechnungen zahlen",
      history: "Verlauf",
      mobile: "Mobilfunk",
      electricity: "Strom",
      water: "Wasser",
      more: "Mehr",
    },
  },
};

const fr: FinanceMessages = {
  meta: {
    title: "Finances personnelles",
    description:
      "Un tableau de bord de finances personnelles avec patrimoine net, dépenses, sources de revenus, répartition des comptes, transactions et portefeuilles.",
  },
  header: { title: "Finances personnelles", updated: "Mis à jour {time}", settings: "Paramètres", export: "Exporter" },
  tabs: { dashboard: "Tableau de bord", accounts: "Comptes", transactions: "Transactions" },
  comingSoon: {
    accounts: "La vue des comptes arrive bientôt.",
    transactions: "La vue des transactions arrive bientôt.",
  },
  kpis: {
    netWorth: "Patrimoine net",
    netWorthChange: "+{amount} vs mois précédent",
    availableCash: "Trésorerie disponible",
    availableCashChange: "{amount} de plus que votre moyenne sur {days} jours",
    monthlySpend: "Dépenses mensuelles",
    monthlySpendChange: "{amount} de plus que le mois précédent",
    savingsRate: "Taux d’épargne",
    savingsRateChange: "Mois précédent : {percent}",
  },
  income: {
    title: "Sources de revenus",
    share: "{source} · {percent}",
    sources: { salary: "Salaire principal", freelance: "Missions freelance", investments: "Dividendes et intérêts" },
  },
  notification: {
    title: "Score de crédit mis à jour",
    description: {
      one: "Votre score a augmenté de {count} point pour atteindre {score}.",
      other: "Votre score a augmenté de {count} points pour atteindre {score}.",
    },
    action: "Voir les détails",
  },
  spending: {
    title: "Aperçu des dépenses",
    periodLabel: "Période",
    periods: { weekly: "Hebdomadaire", monthly: "Mensuel", yearly: "Annuel" },
    expense: "Dépenses",
    income: "Revenus",
  },
  allocation: {
    title: "Répartition des comptes",
    balance: "Solde",
    total: "Total",
    accounts: {
      main: "Compte principal",
      savings: "Compte d’épargne",
      investment: "Compte d’investissement",
      reserve: "Compte de réserve",
    },
  },
  wallet: {
    title: "Portefeuille",
    physicalVault: "Coffre physique :",
    airGapped: "Isolé du réseau",
    quantity: "{quantity} {ticker}",
  },
  upcoming: {
    title: "Factures et paiements à venir",
    billsDue: {
      one: "Vous avez {count} facture à régler ce mois-ci",
      other: "Vous avez {count} factures à régler ce mois-ci",
    },
    autopay: "Le prélèvement automatique traitera {amount} aujourd’hui",
    when: "{time} · {date}",
    items: { claude: "Abonnement Claude Pro", resend: "Resend Pro Team", linear: "Forfait Linear Plus" },
  },
  quick: {
    transferTitle: "Virement rapide",
    amountLabel: "Montant",
    send: "Envoyer",
    shortcutsTitle: "Raccourcis",
    shortcuts: {
      scanQr: "Scanner un QR",
      transfer: "Virer",
      payBills: "Payer les factures",
      history: "Historique",
      mobile: "Mobile",
      electricity: "Électricité",
      water: "Eau",
      more: "Plus",
    },
  },
};

export const financeMessages = defineMessages<FinanceMessages>({ en, es, de, fr });

export const financeBundle: MessageBundle<FinanceMessages> = { key: financeMessageKey, dictionary: financeMessages };
