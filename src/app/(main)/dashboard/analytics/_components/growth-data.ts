import { Clock, Trophy, UsersRound } from "lucide-react";

import { customers, type LeadChannel, leadChannels, monthlyWon } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { formatMonth, monthTotal } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

export const periods = ["3M", "6M", "12M"] as const;

export type Period = (typeof periods)[number];

const periodMonths: Record<Period, number> = { "3M": 3, "6M": 6, "12M": 12 };

export type SegmentPoint = { month: string; enterprise: number; midMarket: number; smb: number };

export type GrowthReport = {
  months: number;
  kpis: HeaderKpi[];
  segments: SegmentPoint[];
  segmentTotals: { enterprise: number; midMarket: number; smb: number };
  newCustomers: { month: string; customers: number }[];
  winRate: { month: string; rate: number }[];
  leadSources: { channel: LeadChannel; customers: number; share: number }[];
  newCustomerCount: number;
};

/** Every Growth figure for the trailing period, derived from the shared CRM dataset. */
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
    kpis: [
      { icon: UsersRound, value: String(joined.length), label: `New customers, last ${months} months` },
      { icon: Trophy, value: formatCurrency(revenue / wonDeals, { noDecimals: true }), label: "Average won deal" },
      { icon: Clock, value: String(Math.round(cycleDays)), label: "Average sales cycle, days" },
    ],
    segments: window.map((month) => ({
      month: formatMonth(month.month),
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
      month: formatMonth(month.month),
      customers: joined.filter((customer) => customer.customerSince.startsWith(month.month)).length,
    })),
    winRate: window.map((month) => ({
      month: formatMonth(month.month),
      rate: Math.round((month.wonDeals / (month.wonDeals + month.lostDeals)) * 100),
    })),
    leadSources: touches
      .map((item) => ({ ...item, share: totalTouches ? Math.round((item.customers / totalTouches) * 100) : 0 }))
      .sort((a, b) => b.customers - a.customers),
  };
}
