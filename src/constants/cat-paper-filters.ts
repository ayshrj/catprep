import type { CatPaperExam, CatPaperSection } from "@/types/cat-paper-firestore";

export const CAT_PAPER_EXAMS: CatPaperExam[] = ["CAT", "XAT"];

export const CAT_PAPER_SECTIONS: CatPaperSection[] = ["VARC", "DILR", "QUANT", "QADI", "VALR", "BDM", "GK", "UNKNOWN"];

export const CAT_PAPER_SECTION_LABELS: Record<CatPaperSection, string> = {
  VARC: "VARC",
  DILR: "DILR",
  QUANT: "Quant",
  QADI: "QADI",
  VALR: "VALR",
  BDM: "BDM",
  GK: "GK",
  UNKNOWN: "General",
};
