import type { CatPaperExam, CatPaperSection } from "@/types/cat-paper-firestore";

const SECTION_ALIASES: Array<{ match: RegExp; section: CatPaperSection }> = [
  { match: /VARC/i, section: "VARC" },
  { match: /DILR/i, section: "DILR" },
  { match: /QUANT/i, section: "QUANT" },
  { match: /QUANTS/i, section: "QUANT" },
  { match: /QADI/i, section: "QADI" },
  { match: /VALR/i, section: "VALR" },
  { match: /BDM/i, section: "BDM" },
  { match: /GK/i, section: "GK" },
];

export type ParsedPaperMeta = {
  exam: CatPaperExam;
  year: number | null;
  slot: number | null;
  paperSection: CatPaperSection;
};

export function parsePaperMeta(topic: string, pageTitle: string): ParsedPaperMeta {
  const combined = `${topic} ${pageTitle}`.trim();
  const exam: CatPaperExam = /XAT/i.test(combined) ? "XAT" : "CAT";

  const yearMatch = combined.match(/(20\d{2})/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  const slotMatch = combined.match(/SLOT\s*([1-3])/i);
  const slot = slotMatch ? Number(slotMatch[1]) : null;

  const paperSection = SECTION_ALIASES.find(entry => entry.match.test(combined))?.section ?? "UNKNOWN";

  return { exam, year, slot, paperSection };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function tokenizeSearch(value: string): string[] {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];

  const tokens = normalized.split(" ").filter(token => token.length > 1);
  return Array.from(new Set(tokens));
}

export function buildSearchTokens(value: string, extraTokens: string[] = []): string[] {
  const tokens = new Set(tokenizeSearch(value));
  for (const token of extraTokens) {
    const normalized = token.toLowerCase().trim();
    if (normalized) tokens.add(normalized);
  }
  return Array.from(tokens);
}
