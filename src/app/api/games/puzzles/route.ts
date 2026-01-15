import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

import { LLM_GAME_ID_LIST, LLM_GAME_IDS } from "@/games/core/game-generation";
import type { DICaseletPuzzle } from "@/games/di-caselet-trainer/types";
import type { InferenceJudgePuzzle } from "@/games/inference-judge/types";
import type { OddSentenceOutPuzzle } from "@/games/odd-sentence-out/types";
import type { ParaJumblePuzzle } from "@/games/para-jumble/types";
import type { ParaSummaryPuzzle } from "@/games/para-summary/types";
import type { RcDailyPuzzle } from "@/games/rc-daily/types";
import type { TwoLineSummaryPuzzle } from "@/games/two-line-summary/types";
import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type GamePuzzleRecord = {
  id: string;
  gameId: string;
  difficulty: number;
  createdAt: string;
  model: string;
  prompt: { system: string; user: string };
  rawResponse: string;
  puzzle: unknown;
};

type SettingsRecord = {
  openRouterApiKey?: string | null;
  openRouterModel?: string | null;
};

const globalAny = globalThis as unknown as {
  __gamePuzzleHistory?: Map<string, GamePuzzleRecord[]>;
  __chatUserSettings?: Map<string, SettingsRecord>;
};

function getHistoryStore() {
  if (!globalAny.__gamePuzzleHistory) {
    globalAny.__gamePuzzleHistory = new Map();
  }
  return globalAny.__gamePuzzleHistory;
}

function getSettingsStore() {
  if (!globalAny.__chatUserSettings) {
    globalAny.__chatUserSettings = new Map();
  }
  return globalAny.__chatUserSettings;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeStringArray(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => normalizeString(item)).filter(Boolean);
  }
  const single = normalizeString(value);
  return single ? [single] : [];
}

function extractFirstJsonObject(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return trimmed.slice(first, last + 1);
}

function buildPrompt(gameId: string, difficulty: number) {
  const common = "Return ONLY a valid JSON object. Do not include markdown or commentary. Use concise, clear language.";

  switch (gameId) {
    case "rcDaily":
      return {
        system: `${common} You are a CAT RC item writer.`,
        user: [
          `Generate 1 RC puzzle at difficulty ${difficulty} (1 easy, 2 medium, 3 hard) with 3 questions.`,
          "JSON schema:",
          "{",
          '  "id": "rc-unique-id",',
          '  "title": "short title",',
          '  "strategyNote": "1 short tip",',
          '  "passage": "120-180 word passage",',
          '  "questions": [',
          "    {",
          '      "id": "q1",',
          '      "prompt": "question text",',
          '      "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],',
          '      "correctOptionId": "a|b|c|d",',
          '      "explanation": "1-2 sentences"',
          "    }",
          "  ]",
          "}",
        ].join("\n"),
      };
    case "oddSentenceOut":
      return {
        system: `${common} You generate coherent paragraph logic questions.`,
        user: [
          `Generate 1 odd-sentence-out puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "oso-unique-id",',
          '  "prompt": "instruction",',
          '  "sentences": ["s1","s2","s3","s4","s5"],',
          '  "oddIndex": 0,',
          '  "rationale": "why this sentence is odd"',
          "}",
          "Constraints: 5 sentences. oddIndex is 0-based.",
        ].join("\n"),
      };
    case "paraJumble":
      return {
        system: `${common} You generate para-jumble items.`,
        user: [
          `Generate 1 para-jumble puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "pj-unique-id",',
          '  "title": "short title",',
          '  "sentences": ["s1","s2","s3","s4"],',
          '  "correctOrder": [0,1,2,3],',
          '  "explanation": "brief explanation"',
          "}",
          "Constraints: 4-5 sentences. correctOrder is 0-based indices.",
        ].join("\n"),
      };
    case "paraSummary":
      return {
        system: `${common} You generate paragraph summary MCQs.`,
        user: [
          `Generate 1 para-summary puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "ps-unique-id",',
          '  "title": "short title",',
          '  "passage": "90-140 word passage",',
          '  "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],',
          '  "correctOptionId": "a|b|c|d",',
          '  "explanation": "1-2 sentences"',
          "}",
        ].join("\n"),
      };
    case "twoLineSummary":
      return {
        system: `${common} You generate 2-line summary tasks.`,
        user: [
          `Generate 1 two-line summary puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "tls-unique-id",',
          '  "promptTitle": "short title",',
          '  "passage": "110-170 word passage",',
          '  "minWords": 22,',
          '  "maxWords": 38,',
          '  "requiredKeywords": ["k1","k2","k3"],',
          '  "sampleGoodSummary": "2 sentences"',
          "}",
        ].join("\n"),
      };
    case "inferenceJudge":
      return {
        system: `${common} You generate inference-judge items (must-be-true).`,
        user: [
          `Generate 1 inference-judge puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "inf-unique-id",',
          '  "passage": "90-140 word passage",',
          '  "question": "Which statement must be true?",',
          '  "options": [',
          '    {"id":"A","text":"...","why":"..."}',
          "  ],",
          '  "correctOptionId": "A|B|C|D"',
          "}",
          "Constraints: 4 options A-D.",
        ].join("\n"),
      };
    case "diCaseletTrainer":
      return {
        system: `${common} You generate DI caselets with numeric tables.`,
        user: [
          `Generate 1 DI caselet puzzle at difficulty ${difficulty}.`,
          "JSON schema:",
          "{",
          '  "id": "di-unique-id",',
          '  "title": "short title",',
          '  "caselet": "2-3 sentences",',
          '  "table": {',
          '    "headers": ["Label","Col A","Col B"],',
          '    "rows": [{"label":"Row 1","values":[10,20]}]',
          "  },",
          '  "questions": [',
          '    {"id":"q1","prompt":"...","answer":12.5,"tolerance":0.02,"unit":"%","solution":"..."}',
          "  ]",
          "}",
          "Constraints: 3-5 rows, 2-3 numeric columns, 2 questions. Use small integers.",
        ].join("\n"),
      };
    default:
      return null;
  }
}

function sanitizeRcDaily(raw: any, difficulty: number): RcDailyPuzzle | null {
  if (!isPlainObject(raw)) return null;
  const passage = normalizeString(raw.passage);
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsRaw
    .map((q: any, idx: number) => {
      if (!isPlainObject(q)) return null;
      const prompt = normalizeString(q.prompt);
      const optionsRaw = Array.isArray(q.options) ? q.options : [];
      const optionIds = ["a", "b", "c", "d"];
      const options = optionsRaw
        .slice(0, 4)
        .map((opt: any, optIdx: number) => {
          if (!isPlainObject(opt)) return null;
          const text = normalizeString(opt.text);
          const id = normalizeString(opt.id).toLowerCase() || optionIds[optIdx];
          if (!text) return null;
          return { id, text };
        })
        .filter(Boolean) as Array<{ id: string; text: string }>;
      if (!prompt || options.length < 4) return null;
      const correctRaw = normalizeString(q.correctOptionId).toLowerCase();
      const correctOptionId = options.some(o => o.id === correctRaw) ? correctRaw : (options[0]?.id ?? "a");
      return {
        id: normalizeString(q.id) || `q${idx + 1}`,
        prompt,
        options,
        correctOptionId,
        explanation: normalizeString(q.explanation) || "Review the passage for the exact claim.",
      };
    })
    .filter(Boolean) as RcDailyPuzzle["questions"];

  if (!passage || questions.length < 1) return null;

  return {
    id: normalizeString(raw.id) || `rc-${Date.now()}`,
    title: normalizeString(raw.title) || "Reading Comprehension",
    passage,
    questions,
    difficulty,
    strategyNote: normalizeString(raw.strategyNote) || "Track the main claim and eliminate scope shifts.",
  };
}

function sanitizeOddSentenceOut(raw: any, difficulty: number): OddSentenceOutPuzzle | null {
  if (!isPlainObject(raw)) return null;
  const sentences = normalizeStringArray(raw.sentences);
  if (sentences.length < 4) return null;
  const trimmedSentences = sentences.slice(0, 6);
  const oddIndex = Math.max(0, Math.min(trimmedSentences.length - 1, normalizeNumber(raw.oddIndex, 0)));
  return {
    id: normalizeString(raw.id) || `oso-${Date.now()}`,
    prompt: normalizeString(raw.prompt) || "Pick the odd sentence out.",
    sentences: trimmedSentences,
    oddIndex,
    rationale: normalizeString(raw.rationale) || "This sentence breaks the logical flow.",
    difficulty,
  };
}

function sanitizeParaJumble(raw: any): ParaJumblePuzzle | null {
  if (!isPlainObject(raw)) return null;
  const sentences = normalizeStringArray(raw.sentences);
  if (sentences.length < 4) return null;
  const trimmed = sentences.slice(0, 6);
  const orderRaw = Array.isArray(raw.correctOrder) ? raw.correctOrder : [];
  const order = orderRaw.map((v: any) => normalizeNumber(v, -1)).filter((v: number) => v >= 0);
  const normalizedOrder =
    order.length === trimmed.length && new Set(order).size === trimmed.length ? order : trimmed.map((_, idx) => idx);
  return {
    id: normalizeString(raw.id) || `pj-${Date.now()}`,
    title: normalizeString(raw.title) || "Para-jumble",
    sentences: trimmed,
    correctOrder: normalizedOrder,
    explanation: normalizeString(raw.explanation) || "Use connectors and logical flow to order sentences.",
  };
}

function sanitizeParaSummary(raw: any): ParaSummaryPuzzle | null {
  if (!isPlainObject(raw)) return null;
  const passage = normalizeString(raw.passage);
  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const optionIds = ["a", "b", "c", "d"];
  const options = optionsRaw
    .slice(0, 4)
    .map((opt: any, idx: number) => {
      if (!isPlainObject(opt)) return null;
      const text = normalizeString(opt.text);
      if (!text) return null;
      const id = normalizeString(opt.id).toLowerCase() || optionIds[idx];
      return { id, text };
    })
    .filter(Boolean) as Array<{ id: string; text: string }>;

  if (!passage || options.length < 4) return null;

  const correctRaw = normalizeString(raw.correctOptionId).toLowerCase();
  const correctOptionId = options.some(o => o.id === correctRaw) ? correctRaw : (options[0]?.id ?? "a");
  return {
    id: normalizeString(raw.id) || `ps-${Date.now()}`,
    title: normalizeString(raw.title) || "Summary",
    passage,
    options,
    correctOptionId,
    explanation: normalizeString(raw.explanation) || "Choose the option that best captures the main idea.",
  };
}

function sanitizeTwoLineSummary(raw: any): TwoLineSummaryPuzzle | null {
  if (!isPlainObject(raw)) return null;
  const passage = normalizeString(raw.passage);
  if (!passage) return null;
  let minWords = normalizeNumber(raw.minWords, 22);
  let maxWords = normalizeNumber(raw.maxWords, 38);
  if (minWords >= maxWords) {
    minWords = 22;
    maxWords = 38;
  }
  const requiredKeywords = normalizeStringArray(raw.requiredKeywords).slice(0, 6);
  return {
    id: normalizeString(raw.id) || `tls-${Date.now()}`,
    promptTitle: normalizeString(raw.promptTitle) || "Two-line summary",
    passage,
    minWords,
    maxWords,
    requiredKeywords: requiredKeywords.length ? requiredKeywords : ["main", "idea", "reason"],
    sampleGoodSummary: normalizeString(raw.sampleGoodSummary) || "Summarize the core idea in two concise sentences.",
  };
}

function sanitizeInferenceJudge(raw: any, difficulty: number): InferenceJudgePuzzle | null {
  if (!isPlainObject(raw)) return null;
  const passage = normalizeString(raw.passage);
  const question = normalizeString(raw.question);
  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const optionIds = ["A", "B", "C", "D"];
  const options = optionsRaw
    .slice(0, 4)
    .map((opt: any, idx: number) => {
      if (!isPlainObject(opt)) return null;
      const text = normalizeString(opt.text);
      if (!text) return null;
      const id = normalizeString(opt.id).toUpperCase() || optionIds[idx];
      return {
        id: optionIds.includes(id) ? (id as "A" | "B" | "C" | "D") : optionIds[idx],
        text,
        why: normalizeString(opt.why) || "This option is directly supported by the passage.",
      };
    })
    .filter(Boolean) as InferenceJudgePuzzle["options"];

  if (!passage || !question || options.length < 4) return null;

  const correctRaw = normalizeString(raw.correctOptionId).toUpperCase();
  const correctOptionId = options.some(o => o.id === correctRaw) ? (correctRaw as "A" | "B" | "C" | "D") : "A";

  return {
    id: normalizeString(raw.id) || `inf-${Date.now()}`,
    passage,
    question,
    options,
    correctOptionId,
    difficulty,
  };
}

function sanitizeDiCaselet(raw: any, difficulty: number): DICaseletPuzzle | null {
  if (!isPlainObject(raw)) return null;
  const title = normalizeString(raw.title) || "DI Caselet";
  const caselet = normalizeString(raw.caselet);
  if (!caselet) return null;

  const tableRaw = isPlainObject(raw.table) ? raw.table : null;
  if (!tableRaw) return null;

  const headers = normalizeStringArray(tableRaw.headers);
  if (headers.length < 2) return null;

  const rowsRaw = Array.isArray(tableRaw.rows) ? tableRaw.rows : [];
  const rows = rowsRaw
    .map((row: any, idx: number) => {
      if (!isPlainObject(row)) return null;
      const label = normalizeString(row.label) || `Row ${idx + 1}`;
      const valuesRaw = Array.isArray(row.values) ? row.values : [];
      const values = valuesRaw.slice(0, headers.length - 1).map((v: any) => normalizeNumber(v, 0));
      if (values.length < headers.length - 1) return null;
      return { label, values };
    })
    .filter(Boolean) as DICaseletPuzzle["table"]["rows"];

  if (rows.length < 2) return null;

  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsRaw
    .slice(0, 3)
    .map((q: any, idx: number) => {
      if (!isPlainObject(q)) return null;
      const prompt = normalizeString(q.prompt);
      const answer = normalizeNumber(q.answer, NaN);
      if (!prompt || !Number.isFinite(answer)) return null;
      return {
        id: normalizeString(q.id) || `q${idx + 1}`,
        prompt,
        answer,
        tolerance: normalizeNumber(q.tolerance, 0.01),
        unit: normalizeString(q.unit),
        solution: normalizeString(q.solution) || "Compute from the table.",
      };
    })
    .filter(Boolean) as DICaseletPuzzle["questions"];

  if (questions.length < 1) return null;

  return {
    id: normalizeString(raw.id) || `di-${Date.now()}`,
    title,
    caselet,
    table: { headers, rows },
    questions,
    difficulty,
  };
}

function sanitizePuzzle(gameId: string, raw: any, difficulty: number) {
  switch (gameId) {
    case "rcDaily":
      return sanitizeRcDaily(raw, difficulty);
    case "oddSentenceOut":
      return sanitizeOddSentenceOut(raw, difficulty);
    case "paraJumble":
      return sanitizeParaJumble(raw);
    case "paraSummary":
      return sanitizeParaSummary(raw);
    case "twoLineSummary":
      return sanitizeTwoLineSummary(raw);
    case "inferenceJudge":
      return sanitizeInferenceJudge(raw, difficulty);
    case "diCaseletTrainer":
      return sanitizeDiCaselet(raw, difficulty);
    default:
      return null;
  }
}

async function getUserSettings(userId: string) {
  const db = getAdminDb();
  if (!db) {
    const record = getSettingsStore().get(userId);
    const apiKey = typeof record?.openRouterApiKey === "string" ? record.openRouterApiKey : "";
    const model = typeof record?.openRouterModel === "string" ? record.openRouterModel : "";
    return {
      apiKey: apiKey || null,
      model: model || null,
    };
  }

  const doc = await db.collection("users").doc(userId).collection("private").doc("settings").get();
  const data = (doc.data() ?? {}) as any;
  const apiKey = typeof data.openRouterApiKey === "string" ? data.openRouterApiKey.trim() : "";
  const model = typeof data.openRouterModel === "string" ? data.openRouterModel.trim() : "";

  return {
    apiKey: apiKey || null,
    model: model || null,
  };
}

async function callOpenRouter({
  apiKey,
  model,
  origin,
  prompt,
}: {
  apiKey: string;
  model: string;
  origin: string;
  prompt: { system: string; user: string };
}) {
  const body: any = {
    model,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "CAT Games",
    },
    body: JSON.stringify(body),
  });

  let data = await response.json().catch(() => ({}) as any);

  if (!response.ok) {
    const message = String(data?.error?.message ?? data?.error ?? `OpenRouter error (${response.status})`);
    if (message.toLowerCase().includes("response_format")) {
      body.response_format = undefined;
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": origin,
          "X-Title": "CAT Games",
        },
        body: JSON.stringify(body),
      });
      data = await response.json().catch(() => ({}) as any);
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error?.message ?? data?.error ?? `OpenRouter error (${response.status})`;
    const error = new Error(String(errorMessage));
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}

function extractContent(data: any) {
  const content = normalizeString(data?.choices?.[0]?.message?.content);
  if (!content) return null;
  const candidate = extractFirstJsonObject(content);
  return candidate ?? content;
}

async function storePuzzle(userId: string, record: GamePuzzleRecord) {
  const db = getAdminDb();
  if (!db) {
    const store = getHistoryStore();
    const existing = store.get(userId) ?? [];
    existing.unshift(record);
    store.set(userId, existing.slice(0, 50));
    return;
  }

  await db.collection("users").doc(userId).collection("game_puzzles").doc(record.id).set(record, { merge: true });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const gameId = normalizeString(body.gameId);
  const difficulty = normalizeNumber(body.difficulty, 1);

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required." }, { status: 400 });
  }

  if (!LLM_GAME_IDS.has(gameId)) {
    return NextResponse.json({ error: "Game does not use LLM generation." }, { status: 400 });
  }

  const prompt = buildPrompt(gameId, difficulty);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not configured for this game." }, { status: 500 });
  }

  const settings = await getUserSettings(userId);
  if (!settings?.apiKey) {
    return NextResponse.json({ error: "Add your OpenRouter API key in Settings first." }, { status: 400 });
  }
  if (!settings.model) {
    return NextResponse.json({ error: "Select an OpenRouter model first." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  let rawContent = "";
  try {
    const data = await callOpenRouter({
      apiKey: settings.apiKey,
      model: settings.model,
      origin,
      prompt,
    });
    rawContent = extractContent(data) ?? "";
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate puzzle.",
        details: (error as any)?.details ?? null,
      },
      { status: (error as any)?.status ?? 500 }
    );
  }

  let parsed: any = null;
  if (rawContent) {
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = null;
    }
  }

  const puzzle = sanitizePuzzle(gameId, parsed, difficulty);
  if (!puzzle) {
    return NextResponse.json({ error: "Model returned invalid puzzle JSON." }, { status: 502 });
  }

  const now = new Date().toISOString();
  const record: GamePuzzleRecord = {
    id: randomUUID(),
    gameId,
    difficulty,
    createdAt: now,
    model: settings.model,
    prompt,
    rawResponse: rawContent,
    puzzle,
  };

  await storePuzzle(userId, record);

  return NextResponse.json({
    puzzle,
    recordId: record.id,
    createdAt: now,
  });
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = normalizeString(searchParams.get("gameId"));
  const limit = Math.min(50, Math.max(1, normalizeNumber(searchParams.get("limit"), 20)));

  if (gameId && !LLM_GAME_IDS.has(gameId)) {
    return NextResponse.json({ error: "Game does not use LLM generation." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    const store = getHistoryStore();
    const records = (store.get(userId) ?? [])
      .filter(record => (gameId ? record.gameId === gameId : true))
      .slice(0, limit);
    return NextResponse.json({ puzzles: records });
  }

  let query: FirebaseFirestore.Query = db.collection("users").doc(userId).collection("game_puzzles");
  if (gameId) {
    query = query.where("gameId", "==", gameId);
  }

  const snapshot = await query.get();
  const records = snapshot.docs
    .map(doc => doc.data() as GamePuzzleRecord)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);

  return NextResponse.json({ puzzles: records, games: LLM_GAME_ID_LIST });
}
