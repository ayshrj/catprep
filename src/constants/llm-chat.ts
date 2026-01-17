import type { CatScenarioCode } from "@/lib/cat-tools";

export interface ScenarioColors {
  bg: string; // Main background (pastel)
  text: string; // Primary text (dark)
  subtext: string; // Secondary text (muted 60% opacity equivalent)
  accent: string; // Hover/active state (slightly saturated)
}

export const SCENARIO_COLORS: Record<CatScenarioCode, ScenarioColors> = {
  // Greens - Fresh, growth, progress
  S1: { bg: "#D4F1E3", text: "#0D3B2F", subtext: "#2D5F4E", accent: "#5FD8A0" },
  S2: { bg: "#E8F5E0", text: "#2A4521", subtext: "#4A6B3F", accent: "#7BC862" },

  // Warm tones - Energy, action, urgency
  S3: { bg: "#FFE8D6", text: "#5C2E0D", subtext: "#8B5A3C", accent: "#FF9A56" },
  S4: { bg: "#FFE0E8", text: "#5C0D2E", subtext: "#8B3C5A", accent: "#FF6B9D" },

  // Blues - Calm, analytical, trust
  S5: { bg: "#E0EDFF", text: "#0D2E5C", subtext: "#3C5A8B", accent: "#5B9EFF" },
  S6: { bg: "#F0E0FF", text: "#3D0D5C", subtext: "#6B3C8B", accent: "#A56BFF" },

  // Teals/Cyans - Balance, clarity, focus
  S7: { bg: "#D6F5F5", text: "#0D4040", subtext: "#2D6B6B", accent: "#4DD4D4" },
  S8: { bg: "#FFF8E0", text: "#4A4510", subtext: "#7A7542", accent: "#E6D65C" },

  // Purples - Creativity, insight, wisdom
  S9: { bg: "#EFE0FF", text: "#3D0D5C", subtext: "#6B3C8B", accent: "#B47BFF" },
  S10: {
    bg: "#FFF0D6",
    text: "#5C4010",
    subtext: "#8B6B42",
    accent: "#FFB85C",
  },

  // Complex tones - Mixed states
  S11: {
    bg: "#F0FFD6",
    text: "#3D4510",
    subtext: "#6B7542",
    accent: "#C6E65C",
  },
  S12: {
    bg: "#D6FFF0",
    text: "#0D5C40",
    subtext: "#3C8B6B",
    accent: "#5CFFB8",
  },
  S13: {
    bg: "#FFD6F0",
    text: "#5C0D40",
    subtext: "#8B3C6B",
    accent: "#FF5CB8",
  },
  S14: {
    bg: "#E8D6FF",
    text: "#3D0D5C",
    subtext: "#6B3C8B",
    accent: "#C65CFF",
  },

  // Light blues/grays - Neutral, informational
  S15: {
    bg: "#D6F0FF",
    text: "#0D405C",
    subtext: "#3C6B8B",
    accent: "#5CB8FF",
  },
  S16: {
    bg: "#F5E8FF",
    text: "#4A2D5C",
    subtext: "#7A5A8B",
    accent: "#D4A3FF",
  },
  S17: {
    bg: "#E0F5F5",
    text: "#2D4A4A",
    subtext: "#5A7A7A",
    accent: "#A3D4D4",
  },
  S18: {
    bg: "#FFFAE0",
    text: "#4A4A2D",
    subtext: "#7A7A5A",
    accent: "#E6E6A3",
  },

  // Unknown/Default - Neutral gray
  unknown: {
    bg: "#F5F5F5",
    text: "#1A1A1A",
    subtext: "#666666",
    accent: "#999999",
  },
} as const;
