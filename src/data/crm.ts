/**
 * Mock CRM dataset shared by the Overview, Pipeline, Customers and Growth screens.
 * Every screen derives its figures from these records, so totals agree across screens.
 * Dates are fixed against CRM_AS_OF to keep server and client renders identical.
 */

export const CRM_AS_OF = "2026-10-31";

export type Segment = "Enterprise" | "Mid-market" | "SMB";

export type TeamMember = { id: string; name: string; initials: string };

export const team = [
  { id: "iv", name: "Iris Vega", initials: "IV" },
  { id: "km", name: "Kofi Mensah", initials: "KM" },
  { id: "lb", name: "Lea Brun", initials: "LB" },
  { id: "as", name: "Aditya Shah", initials: "AS" },
  { id: "th", name: "Tom Halden", initials: "TH" },
] as const satisfies readonly TeamMember[];

export type TeamMemberId = (typeof team)[number]["id"];

export const leadChannels = ["Website", "Referral", "LinkedIn", "Email", "Events", "WhatsApp"] as const;

export type LeadChannel = (typeof leadChannels)[number];

export type Customer = {
  id: string;
  name: string;
  title: string;
  company: string;
  segment: Segment;
  lastContact: string;
  score: number;
  starred: boolean;
  customerSince: string;
  /** Every channel the customer came through before signing; one customer can have several. */
  leadSources: LeadChannel[];
};

export const customers: Customer[] = [
  {
    id: "c01",
    name: "Freya Lindqvist",
    title: "Facilities Director",
    company: "Northgate Cold Chain",
    segment: "Enterprise",
    lastContact: "2026-10-29T10:00:00Z",
    score: 86,
    starred: true,
    customerSince: "2024-03-12",
    leadSources: ["Referral"],
  },
  {
    id: "c02",
    name: "Daniel Mensah",
    title: "Head of Estates",
    company: "Riverside Academies Trust",
    segment: "Enterprise",
    lastContact: "2026-10-28T09:30:00Z",
    score: 92,
    starred: true,
    customerSince: "2023-09-04",
    leadSources: ["Events", "Email"],
  },
  {
    id: "c03",
    name: "Lucas Moreau",
    title: "Owner",
    company: "Atlas Surf Lodge",
    segment: "SMB",
    lastContact: "2026-10-30T13:00:00Z",
    score: 68,
    starred: false,
    customerSince: "2026-10-27",
    leadSources: ["Website", "WhatsApp"],
  },
  {
    id: "c04",
    name: "Priya Nair",
    title: "Energy Manager",
    company: "Helix Data Centres",
    segment: "Enterprise",
    lastContact: "2026-10-30T08:15:00Z",
    score: 63,
    starred: false,
    customerSince: "2026-06-18",
    leadSources: ["LinkedIn", "Website", "Email"],
  },
  {
    id: "c05",
    name: "Yusuf Kaya",
    title: "Chief Operating Officer",
    company: "Meridian Logistics",
    segment: "Mid-market",
    lastContact: "2026-10-25T16:40:00Z",
    score: 74,
    starred: false,
    customerSince: "2025-02-20",
    leadSources: ["Referral", "Website"],
  },
  {
    id: "c06",
    name: "Carmen Ortega",
    title: "Operations Lead",
    company: "Alameda Hotels",
    segment: "Mid-market",
    lastContact: "2026-10-21T11:20:00Z",
    score: 57,
    starred: false,
    customerSince: "2026-07-02",
    leadSources: ["Website", "Email"],
  },
  {
    id: "c07",
    name: "Rina Sato",
    title: "Plant Manager",
    company: "Kumo Precision",
    segment: "Mid-market",
    lastContact: "2026-10-27T15:05:00Z",
    score: 81,
    starred: true,
    customerSince: "2026-05-11",
    leadSources: ["LinkedIn", "Events"],
  },
  {
    id: "c08",
    name: "Jonas Weber",
    title: "Managing Director",
    company: "Weber Bakery Group",
    segment: "SMB",
    lastContact: "2026-10-12T09:00:00Z",
    score: 44,
    starred: false,
    customerSince: "2026-10-26",
    leadSources: ["WhatsApp", "Website"],
  },
  {
    id: "c09",
    name: "Amara Obi",
    title: "Sustainability Lead",
    company: "Brightwell Retail",
    segment: "Enterprise",
    lastContact: "2026-10-30T17:30:00Z",
    score: 89,
    starred: false,
    customerSince: "2025-11-03",
    leadSources: ["Referral", "LinkedIn"],
  },
  {
    id: "c10",
    name: "Elena Petrova",
    title: "Facilities Manager",
    company: "Vela Clinics",
    segment: "Mid-market",
    lastContact: "2026-10-18T10:45:00Z",
    score: 52,
    starred: false,
    customerSince: "2026-08-21",
    leadSources: ["Website"],
  },
  {
    id: "c11",
    name: "Marco Bianchi",
    title: "Owner",
    company: "Bianchi Auto Service",
    segment: "SMB",
    lastContact: "2026-10-26T12:10:00Z",
    score: 61,
    starred: false,
    customerSince: "2026-10-28",
    leadSources: ["WhatsApp", "Referral"],
  },
  {
    id: "c12",
    name: "Hana Novak",
    title: "Procurement Lead",
    company: "Cedar Park Council",
    segment: "Enterprise",
    lastContact: "2026-10-29T14:25:00Z",
    score: 77,
    starred: false,
    customerSince: "2026-09-15",
    leadSources: ["Email", "Website", "LinkedIn"],
  },
];

export type OpenStage = "qualification" | "proposal" | "negotiation" | "closing";

export type DealStage = OpenStage | "won" | "lost";

export type Deal = {
  id: string;
  title: string;
  customerId: string;
  stage: DealStage;
  value: number;
  /** Expected close date for open deals, actual close date for won/lost deals. */
  closeDate: string;
  ownerIds: TeamMemberId[];
};

export const stageProbability: Record<OpenStage, number> = {
  qualification: 0.2,
  proposal: 0.4,
  negotiation: 0.65,
  closing: 0.9,
};

export const deals: Deal[] = [
  {
    id: "d01",
    title: "Solar carport canopy",
    customerId: "c01",
    stage: "qualification",
    value: 12290,
    closeDate: "2026-12-06",
    ownerIds: ["iv", "km", "lb"],
  },
  {
    id: "d02",
    title: "Multi-site rollout",
    customerId: "c02",
    stage: "qualification",
    value: 62310,
    closeDate: "2026-12-25",
    ownerIds: ["iv", "km", "th"],
  },
  {
    id: "d03",
    title: "Inverter replacement",
    customerId: "c05",
    stage: "qualification",
    value: 18640,
    closeDate: "2026-11-20",
    ownerIds: ["lb", "as"],
  },
  {
    id: "d04",
    title: "LED lighting upgrade",
    customerId: "c08",
    stage: "qualification",
    value: 9870,
    closeDate: "2027-01-14",
    ownerIds: ["th"],
  },
  {
    id: "d05",
    title: "Energy audit & design",
    customerId: "c10",
    stage: "qualification",
    value: 7450,
    closeDate: "2026-11-28",
    ownerIds: ["as", "iv"],
  },
  {
    id: "d06",
    title: "Rooftop array, 90 kW",
    customerId: "c12",
    stage: "qualification",
    value: 88200,
    closeDate: "2027-01-30",
    ownerIds: ["km", "lb"],
  },
  {
    id: "d07",
    title: "Battery storage retrofit",
    customerId: "c01",
    stage: "proposal",
    value: 45210,
    closeDate: "2026-12-01",
    ownerIds: ["iv", "as", "lb"],
  },
  {
    id: "d08",
    title: "Ground mount, 1.2 MW",
    customerId: "c01",
    stage: "proposal",
    value: 155930,
    closeDate: "2026-12-20",
    ownerIds: ["iv", "lb", "km"],
  },
  {
    id: "d09",
    title: "Multi-site rollout",
    customerId: "c09",
    stage: "proposal",
    value: 71400,
    closeDate: "2026-12-29",
    ownerIds: ["as", "th"],
  },
  {
    id: "d10",
    title: "Heat pump retrofit",
    customerId: "c06",
    stage: "proposal",
    value: 33760,
    closeDate: "2026-11-18",
    ownerIds: ["lb"],
  },
  {
    id: "d11",
    title: "EV charging, 6 bays",
    customerId: "c11",
    stage: "proposal",
    value: 14980,
    closeDate: "2026-11-26",
    ownerIds: ["th", "km"],
  },
  {
    id: "d12",
    title: "Service contract, 3 yr",
    customerId: "c07",
    stage: "proposal",
    value: 21500,
    closeDate: "2027-01-08",
    ownerIds: ["as"],
  },
  {
    id: "d13",
    title: "Rooftop array, 240 kW",
    customerId: "c01",
    stage: "negotiation",
    value: 51350,
    closeDate: "2026-12-19",
    ownerIds: ["iv", "th", "lb"],
  },
  {
    id: "d14",
    title: "Ground mount, 1.2 MW",
    customerId: "c07",
    stage: "negotiation",
    value: 134290,
    closeDate: "2027-01-09",
    ownerIds: ["iv", "as", "th"],
  },
  {
    id: "d15",
    title: "Battery storage retrofit",
    customerId: "c02",
    stage: "negotiation",
    value: 39870,
    closeDate: "2026-11-27",
    ownerIds: ["km", "lb"],
  },
  {
    id: "d16",
    title: "Energy audit & design",
    customerId: "c05",
    stage: "negotiation",
    value: 51680,
    closeDate: "2027-01-10",
    ownerIds: ["iv", "as", "th"],
  },
  {
    id: "d17",
    title: "Solar carport, 40 bays",
    customerId: "c09",
    stage: "negotiation",
    value: 68120,
    closeDate: "2026-12-12",
    ownerIds: ["th", "km"],
  },
  {
    id: "d18",
    title: "LED lighting upgrade",
    customerId: "c06",
    stage: "negotiation",
    value: 12400,
    closeDate: "2026-11-21",
    ownerIds: ["lb"],
  },
  {
    id: "d19",
    title: "EV charging hub, 12 bays",
    customerId: "c01",
    stage: "closing",
    value: 46430,
    closeDate: "2027-01-09",
    ownerIds: ["iv", "lb", "th"],
  },
  {
    id: "d20",
    title: "Solar carport canopy",
    customerId: "c02",
    stage: "closing",
    value: 34020,
    closeDate: "2027-01-06",
    ownerIds: ["iv", "lb", "as"],
  },
  {
    id: "d21",
    title: "Maintenance plan, 5 yr",
    customerId: "c02",
    stage: "closing",
    value: 59510,
    closeDate: "2026-12-10",
    ownerIds: ["iv", "th", "lb"],
  },
  {
    id: "d22",
    title: "Inverter replacement",
    customerId: "c04",
    stage: "closing",
    value: 55850,
    closeDate: "2026-12-08",
    ownerIds: ["as", "km", "th"],
  },
  {
    id: "d23",
    title: "Energy audit & design",
    customerId: "c02",
    stage: "closing",
    value: 47070,
    closeDate: "2026-11-28",
    ownerIds: ["km", "th"],
  },
  {
    id: "d24",
    title: "Rooftop array, 60 kW",
    customerId: "c03",
    stage: "closing",
    value: 17040,
    closeDate: "2026-11-14",
    ownerIds: ["th"],
  },
  {
    id: "d25",
    title: "Battery backup system",
    customerId: "c04",
    stage: "closing",
    value: 29330,
    closeDate: "2026-11-24",
    ownerIds: ["as", "iv"],
  },
  {
    id: "d26",
    title: "Rooftop array, 120 kW",
    customerId: "c09",
    stage: "won",
    value: 31200,
    closeDate: "2026-10-06",
    ownerIds: ["as", "th"],
  },
  {
    id: "d27",
    title: "Energy audit & design",
    customerId: "c12",
    stage: "won",
    value: 21400,
    closeDate: "2026-10-14",
    ownerIds: ["km"],
  },
  {
    id: "d28",
    title: "Heat pump retrofit",
    customerId: "c06",
    stage: "won",
    value: 27200,
    closeDate: "2026-10-21",
    ownerIds: ["lb", "iv"],
  },
  {
    id: "d29",
    title: "Solar carport canopy",
    customerId: "c08",
    stage: "won",
    value: 18400,
    closeDate: "2026-10-27",
    ownerIds: ["th"],
  },
  {
    id: "d30",
    title: "EV charging, 4 bays",
    customerId: "c10",
    stage: "lost",
    value: 11200,
    closeDate: "2026-10-09",
    ownerIds: ["as"],
  },
  {
    id: "d31",
    title: "Rooftop array, 45 kW",
    customerId: "c11",
    stage: "lost",
    value: 14600,
    closeDate: "2026-10-16",
    ownerIds: ["th"],
  },
  {
    id: "d32",
    title: "Battery storage retrofit",
    customerId: "c05",
    stage: "lost",
    value: 38900,
    closeDate: "2026-10-23",
    ownerIds: ["lb", "km"],
  },
];

export type MonthlyWon = {
  month: string;
  enterprise: number;
  midMarket: number;
  smb: number;
  wonDeals: number;
  lostDeals: number;
  /** Average days from first contact to close for deals won that month. */
  salesCycleDays: number;
};

/** Won revenue by segment and deal outcomes per month, oldest first. The last entry is the current month. */
export const monthlyWon: MonthlyWon[] = [
  { month: "2025-11", enterprise: 48200, midMarket: 14300, smb: 6100, wonDeals: 4, lostDeals: 3, salesCycleDays: 32 },
  { month: "2025-12", enterprise: 71500, midMarket: 15900, smb: 5200, wonDeals: 5, lostDeals: 2, salesCycleDays: 29 },
  { month: "2026-01", enterprise: 82400, midMarket: 19800, smb: 7300, wonDeals: 5, lostDeals: 4, salesCycleDays: 30 },
  { month: "2026-02", enterprise: 60100, midMarket: 16700, smb: 9400, wonDeals: 4, lostDeals: 3, salesCycleDays: 28 },
  { month: "2026-03", enterprise: 52300, midMarket: 18200, smb: 6800, wonDeals: 3, lostDeals: 4, salesCycleDays: 27 },
  { month: "2026-04", enterprise: 94600, midMarket: 17500, smb: 8900, wonDeals: 5, lostDeals: 3, salesCycleDays: 26 },
  { month: "2026-05", enterprise: 24800, midMarket: 9600, smb: 4300, wonDeals: 2, lostDeals: 3, salesCycleDays: 27 },
  { month: "2026-06", enterprise: 51900, midMarket: 7400, smb: 3100, wonDeals: 3, lostDeals: 2, salesCycleDays: 25 },
  { month: "2026-07", enterprise: 79300, midMarket: 21600, smb: 9800, wonDeals: 5, lostDeals: 2, salesCycleDays: 24 },
  { month: "2026-08", enterprise: 44700, midMarket: 4200, smb: 18600, wonDeals: 3, lostDeals: 3, salesCycleDays: 23 },
  { month: "2026-09", enterprise: 63500, midMarket: 22900, smb: 13700, wonDeals: 4, lostDeals: 2, salesCycleDays: 24 },
  { month: "2026-10", enterprise: 52600, midMarket: 27200, smb: 18400, wonDeals: 4, lostDeals: 3, salesCycleDays: 22 },
];

export const MONTHLY_REVENUE_TARGET = 156700;
