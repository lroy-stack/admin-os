import type { Party } from "@/modules/parties";

/** Fictitious fiscal directory (ADR 0019 §5): tax IDs that cannot be real and `.example` addresses. */
export const parties: Party[] = [
  {
    id: "hotel-spa",
    kind: "company",
    legalName: "Hotel Balneario Costa Azul S.L.",
    tradeName: "Spa Costa Azul",
    taxId: "B00000206",
    addressLines: ["Paseo Marítimo 20", "03503 Benidorm", "Spain"],
    countryCode: "ES",
    email: "administracion@balneario-costa-azul.example",
    roles: ["client"],
  },
  {
    id: "photo-studio",
    kind: "company",
    legalName: "Estudio Fotográfico Luz Norte S.L.",
    tradeName: "Luz Norte",
    taxId: "B00000207",
    addressLines: ["Calle de la Luz 7", "03002 Alicante", "Spain"],
    countryCode: "ES",
    email: "facturas@luz-norte.example",
    roles: ["client"],
  },
  {
    id: "cosmetics-distributor",
    kind: "company",
    legalName: "Distribuciones Cosméticas Profesionales S.L.",
    tradeName: "Cosméticas Profesionales",
    taxId: "B00000208",
    addressLines: ["Calle del Taller 15", "28045 Madrid", "Spain"],
    countryCode: "ES",
    email: "pedidos@cosmeticas-profesionales.example",
    roles: ["supplier"],
  },
];
