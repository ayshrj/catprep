import type { ContentBlock } from "@/types/cat-paper";

export type CatPaperExam = "CAT" | "XAT";

export type CatPaperSection = "VARC" | "DILR" | "QUANT" | "QADI" | "VALR" | "BDM" | "GK" | "UNKNOWN";

export type CatPaperDoc = {
  url: string;
  pageTitle: string;
  topic: string;
  exam: CatPaperExam;
  year: number | null;
  slot: number | null;
  paperSection: CatPaperSection;
  generatedAt: string;
  sectionsCount: number;
  questionsCount: number;
  hasSolutions: boolean;
  searchTokens: string[];
};

export type CatPaperSectionDoc = {
  index: number;
  heading: string;
  content?: ContentBlock[];
  passageOrSetText: string;
  images: string[];
  imagesOriginal?: string[];
  questionCount: number;
};

export type CatPaperQuestionDoc = {
  index: number;
  title: string;
  prompt: string;
  choices: string[];
  correctAnswerRaw: string;
  correctAnswerChoice: string;
  correctAnswerText: string;
  links: { text: string; href: string }[];
  images: string[];
  imagesOriginal?: string[];
  hasSolution: boolean;
  questionHash: string;
};

export type CatPaperSolutionDoc = {
  url: string;
  explanationContent?: ContentBlock[];
  explanationText: string;
  explanationImages: string[];
  explanationImagesOriginal?: string[];
  youtubeEmbedUrl: string;
  youtubeWatchUrl: string;
  solutionHash: string;
};

export type CatPaperSummary = CatPaperDoc & {
  id: string;
};

export type CatPaperSectionSummary = CatPaperSectionDoc & {
  id: string;
};

export type CatPaperQuestionSummary = CatPaperQuestionDoc & {
  id: string;
};

export type CatPaperMetaDoc = {
  generatedAt: string;
  paperCount: number;
  sectionCount: number;
  questionCount: number;
  years: number[];
  slots: number[];
  sections: CatPaperSection[];
  exams: CatPaperExam[];
};

export type CatPaperListResponse = {
  papers: CatPaperSummary[];
  nextCursor: string | null;
};

export type CatPaperFilters = {
  exam?: CatPaperExam;
  year?: number;
  slot?: number;
  section?: CatPaperSection;
  search?: string;
  limit?: number;
  cursor?: string;
};
