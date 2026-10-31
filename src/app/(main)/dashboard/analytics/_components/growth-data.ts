import { Clock, Trophy, UsersRound } from "lucide-react";

import { format, formatAmount, formatNumber, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";
import { customers, type LeadChannel, leadChannels, monthlyWon } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { monthTotal } from "@/lib/crm";

import type { GrowthMessages } from "./messages";

export const periods = ["3M", "6M", "12M"] as const;

export type Period = (typeof periods)[number];

const periodMonths: Record<Period, number> = { "3M": 3, "6M": 6, "12M": 12 };

/** `month` is an ISO year-month ("2026-05"); the charts format it for the locale. */
export type SegmentPoint = { month: string; enterprise: number; midMarket: number; smb: number };

export type GrowthReport = {
  months: number;
  averageWonDeal: number;
  averageSalesCycleDays: number;
  segments: SegmentPoint[];
  segmentTotals: { enterprise: number; midMarket: number; smb: number };
  newCustomers: { month: string; customers: number }[];
  /** `rate` is a fraction: 0.64 is 64%. */
  winRate: { month: string; rate: number }[];
  /** `share` is a fraction of all channel touches. */
  leadSources: { channel: LeadChannel; customers: number; share: number }[];
  newCustomerCount: number;
};

const roundToHundredth = (ratio: number) => Math.round(ratio * 100) / 100;

/** Every Growth figure for the trailing period, derived from the shared CRM dataset. Numbers only, no text. */
export function getGrowthReport(period: Period): GrowthReport {
  const months = periodMonths[period];
  const window = monthlyWon.slice(-months);
  const monthKeys = new Set(window.map((month) => month.month));

  const joined = customers.filter((customer) => monthKeys.has(customer.customerSince.slice(0, 7)));
  const revenue = window.reduce((total, month) => total + monthTotal(month), 0);
  const wonDeals = window.reduce((total, month) => total + month.wonDeals, 0);
  const cycleDays = window.reduce((total, month) => total + month.salesCycleDays * month.wonDeals, 0) / wonDeals;

  const touches = leadChannels.map((channel) => ({
    channel,
    customers: joined.filter((customer) => customer.leadSources.includes(channel)).length,
  }));
  const totalTouches = touches.reduce((total, item) => total + item.customers, 0);

  return {
    months,
    newCustomerCount: joined.length,
    averageWonDeal: revenue / wonDeals,
    averageSalesCycleDays: cycleDays,
    segments: window.map((month) => ({
      month: month.month,
      enterprise: month.enterprise,
      midMarket: month.midMarket,
      smb: month.smb,
    })),
    segmentTotals: {
      enterprise: window.reduce((total, month) => total + month.enterprise, 0),
      midMarket: window.reduce((total, month) => total + month.midMarket, 0),
      smb: window.reduce((total, month) => total + month.smb, 0),
    },
    newCustomers: window.map((month) => ({
      month: month.month,
      customers: joined.filter((customer) => customer.customerSince.startsWith(month.month)).length,
    })),
    winRate: window.map((month) => ({
      month: month.month,
      rate: roundToHundredth(month.wonDeals / (month.wonDeals + month.lostDeals)),
    })),
    leadSources: touches
      .map((item) => ({ ...item, share: totalTouches ? roundToHundredth(item.customers / totalTouches) : 0 }))
      .sort((a, b) => b.customers - a.customers),
  };
}

/** The page header's KPI chips, in one locale and the business currency. */
export function growthKpis(
  report: GrowthReport,
  text: GrowthMessages["kpis"],
  locale: Locale,
  currency: Currency,
): HeaderKpi[] {
  return [
    {
      icon: UsersRound,
      value: formatNumber(report.newCustomerCount, locale),
      label: format(text.newCustomers, locale, { count: report.months }),
    },
    {
      icon: Trophy,
      value: formatAmount(report.averageWonDeal, currency, locale, { fractionDigits: 0 }),
      label: text.averageWonDeal,
    },
    {
      icon: Clock,
      value: formatNumber(Math.round(report.averageSalesCycleDays), locale),
      label: text.salesCycle,
    },
  ];
}
