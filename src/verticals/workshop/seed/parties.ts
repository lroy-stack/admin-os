import type { Party } from "@/modules/parties";

/** Fictitious fiscal directory (ADR 0019 §5): tax IDs that cannot be real and `.example` addresses. */
export const parties: Party[] = [
  {
    id: "fleet-company",
    kind: "company",
    legalName: "Transportes Rápidos del Sur S.L.",
    tradeName: "Rápidos del Sur",
    taxId: "B00000209",
    addressLines: ["Polígono Las Salinas 4", "30169 San Ginés", "Spain"],
    countryCode: "ES",
    email: "flota@rapidos-del-sur.example",
    roles: ["client"],
  },
  {
    id: "insurer",
    kind: "company",
    legalName: "Aseguradora Mediterránea S.A.",
    taxId: "A00000210",
    addressLines: ["Avenida de la Constitución 30", "46009 Valencia", "Spain"],
    countryCode: "ES",
    email: "siniestros@aseguradora-mediterranea.example",
    roles: ["client"],
  },
  {
    id: "distribuciones-levante",
    kind: "company",
    legalName: "Distribuciones Levante",
    taxId: "B00000211",
    addressLines: ["Calle del Recambio 9", "46013 Valencia", "Spain"],
    countryCode: "ES",
    email: "pedidos@distribuciones-levante.example",
    roles: ["supplier"],
  },
  {
    id: "recambios-norte",
    kind: "company",
    legalName: "Recambios Norte",
    taxId: "B00000212",
    addressLines: ["Polígono Industrial Ebro 21", "50014 Zaragoza", "Spain"],
    countryCode: "ES",
    email: "ventas@recambios-norte.example",
    roles: ["supplier"],
  },
];
