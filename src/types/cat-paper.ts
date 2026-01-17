export type ColOneSixthLink = {
  href: string;
  label: string;
};

export type QuestionLink = {
  text: string;
  href: string;
};

export type ContentBlock = { type: "text"; text: string } | { type: "image"; url: string; alt: string };

export type ScrapedSolution = {
  url: string;
  explanationContent?: ContentBlock[];
  explanationText: string;
  explanationImages: string[];
  explanationImagesOriginal?: string[];
  youtubeEmbedUrl: string;
  youtubeWatchUrl: string;
};

export type ScrapedQuestion = {
  title: string;
  prompt: string;
  choices: string[];
  correctAnswerRaw: string;
  correctAnswerChoice: string;
  correctAnswerText: string;
  links: QuestionLink[];
  images: string[];
  imagesOriginal?: string[];
  solution?: ScrapedSolution;
};

export type ScrapedSection = {
  heading: string;
  content?: ContentBlock[];
  passageOrSetText: string;
  images: string[];
  imagesOriginal?: string[];
  questions: ScrapedQuestion[];
};

export type ScrapedPaperPage = {
  url: string;
  pageTitle: string;
  topic: string;
  sections: ScrapedSection[];
};

export type CatPaper = {
  generatedAt: string;
  papers: ScrapedPaperPage[];
};
