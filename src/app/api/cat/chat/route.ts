import { NextResponse, type NextRequest } from "next/server";

import { PROMPT_CAT } from "@/lib/cat";
import { CAT_COACH_TOOLS, executeCatTool } from "@/lib/cat-tools";
import { getAdminDb } from "@/lib/firebase-admin";
import { parseAssistantJsonOrThrow } from "@/lib/llm-response-parser";
import { MessageContent, stringifyMessageContent } from "@/lib/message-content";
import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | (string & {});
  content: MessageContent;
  createdAt?: string;
};

type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

const TOOLING_INSTRUCTIONS = `You have tool access.

Rules:
- Always call tool "cat_intake" first (forced by backend).
- If "cat_intake.intent" is "mock_review" and scores are present:
  - Call "cat_mock_diagnose" using extracted scores + any notes text.
- If user asks for "formula/shortcut/trick/revision sheet" OR asks a concept-heavy question:
  - Call "cat_formula_lookup" with the topic tag (preferred) or a query (fallback).
- Use "cat_extract_mock_scores" when user provides scores in free text.
- Use "cat_detect_topic" when user asks about a topic/question and you need section/tag hints.
- Follow tool results strictly.

Response rules (STRICT):
- Your FINAL assistant message MUST be EXACTLY ONE valid JSON object (no markdown/code fences).
- It MUST match the JSON schema described in the system prompt (PROMPT_CAT).
- Include tool-derived fields in the JSON (intent/responseMode/scenario/section/topicTag/etc).
- If responseMode is "onboarding_questions": ask ONLY quickQuestions (inside JSON). No long plan.
`;

function normalizeChatId(raw: string) {
  const trimmed = raw.trim();
  const sanitized = trimmed.replaceAll("/", "");
  if (!sanitized) return null;
  return sanitized.slice(0, 128);
}

async function getUserSettings(userId: string) {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("private")
    .doc("settings")
    .get();

  const data = (doc.data() ?? {}) as any;
  const apiKey =
    typeof data.openRouterApiKey === "string"
      ? data.openRouterApiKey.trim()
      : "";
  const model =
    typeof data.openRouterModel === "string" ? data.openRouterModel.trim() : "";

  return {
    apiKey: apiKey || null,
    model: model || null,
  };
}

async function readChatMessages(userId: string, chatId: string) {
  const db = getAdminDb();
  if (!db) return [];

  const sessionRef = db
    .collection("users")
    .doc(userId)
    .collection("chat_sessions")
    .doc(chatId);

  const snapshot = await sessionRef
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as StoredMessage);
}

function buildContextMessages(allMessages: StoredMessage[]) {
  const maxMessages = 24;
  const recent = allMessages.slice(-maxMessages);

  const openRouterMessages: OpenRouterChatMessage[] = [
    { role: "system", content: TOOLING_INSTRUCTIONS },
    { role: "system", content: PROMPT_CAT },
  ];

  for (const message of recent) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = stringifyMessageContent(message.content).trim();
    if (!content) continue;
    const role: "user" | "assistant" =
      message.role === "assistant" ? "assistant" : "user";
    openRouterMessages.push({ role, content });
  }

  return openRouterMessages;
}

function toolSafeJson(value: unknown) {
  const MAX = 10_000;
  let text = "";
  try {
    text = JSON.stringify(value);
  } catch {
    text = JSON.stringify({ error: "Failed to serialize tool result." });
  }
  if (text.length <= MAX) return text;
  return `${text.slice(0, MAX)}...(truncated, ${text.length} chars total)`;
}

function parseToolArgs(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}


async function callOpenRouterChatCompletions({
  apiKey,
  model,
  origin,
  messages,
  tools,
  toolChoice,
  jsonMode,
}: {
  apiKey: string;
  model: string;
  origin: string;
  messages: OpenRouterChatMessage[];
  tools?: unknown;
  toolChoice?: unknown;
  jsonMode?: boolean;
}) {
  const body: any = {
    model,
    messages,
    temperature: 0.3,
    ...(tools ? { tools } : {}),
    ...(toolChoice ? { tool_choice: toolChoice } : {}),
  };

  // Best-effort JSON mode (some providers/models support this; if not, we fallback)
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "CAT Coach",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json().catch(() => ({} as any));
  if (!response.ok) {
    const errorMessage =
      data?.error?.message ??
      data?.error ??
      `OpenRouter error (${response.status})`;
    const error = new Error(String(errorMessage));
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}

async function generateCatCoachReply({
  apiKey,
  model,
  origin,
  baseMessages,
}: {
  apiKey: string;
  model: string;
  origin: string;
  baseMessages: OpenRouterChatMessage[];
}) {
  let history: OpenRouterChatMessage[] = baseMessages;
  const maxSteps = 4;

  const forceIntakeChoice = {
    type: "function",
    function: { name: "cat_intake" },
  };

  for (let step = 0; step < maxSteps; step += 1) {
    const toolChoice = step === 0 ? forceIntakeChoice : undefined;

    let data: any;
    try {
      data = await callOpenRouterChatCompletions({
        apiKey,
        model,
        origin,
        messages: history,
        tools: CAT_COACH_TOOLS,
        toolChoice,
        jsonMode: true,
      });
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      const lowered = msg.toLowerCase();

      const looksLikeToolSupportIssue =
        lowered.includes("tool") ||
        lowered.includes("tool_calls") ||
        lowered.includes("function calling") ||
        lowered.includes("tools are not supported");

      const looksLikeJsonModeIssue =
        lowered.includes("response_format") ||
        lowered.includes("json_object") ||
        lowered.includes("json mode");

      // If tools or json-mode not supported, retry without those features.
      if (looksLikeToolSupportIssue) {
        data = await callOpenRouterChatCompletions({
          apiKey,
          model,
          origin,
          messages: history,
          jsonMode: true,
        });
      } else if (looksLikeJsonModeIssue) {
        data = await callOpenRouterChatCompletions({
          apiKey,
          model,
          origin,
          messages: history,
          tools: CAT_COACH_TOOLS,
          toolChoice,
          jsonMode: false,
        });
      } else {
        throw error;
      }
    }

    const message = data?.choices?.[0]?.message ?? null;
    const content =
      typeof message?.content === "string"
        ? message.content
        : typeof message?.delta?.content === "string"
        ? message.delta.content
        : "";

    const rawToolCalls = Array.isArray(message?.tool_calls)
      ? message.tool_calls
      : [];

    if (rawToolCalls.length === 0) {
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("Empty response from model.");
      }
      return content;
    }

    const normalizedToolCalls = rawToolCalls
      .map((call: any) => {
        const id =
          typeof call?.id === "string" && call.id.trim()
            ? call.id
            : `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const name =
          typeof call?.function?.name === "string" ? call.function.name : "";
        const args =
          typeof call?.function?.arguments === "string"
            ? call.function.arguments
            : "";
        if (!name.trim()) return null;
        return {
          id,
          type: "function" as const,
          function: { name, arguments: args },
        };
      })
      .filter(Boolean) as OpenRouterChatMessage["tool_calls"];

    history = [
      ...history,
      {
        role: "assistant",
        content: typeof content === "string" ? content : null,
        tool_calls: normalizedToolCalls ?? [],
      },
    ];

    for (const toolCall of normalizedToolCalls ?? []) {
      const args = parseToolArgs(toolCall.function.arguments);
      const result = await executeCatTool(toolCall.function.name, args);
      history = [
        ...history,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolSafeJson(result),
        },
      ];
    }
  }

  throw new Error("Tool loop exceeded max steps.");
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawChatId = typeof body.chatId === "string" ? body.chatId : "";
  const chatId = normalizeChatId(rawChatId);

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required." }, { status: 400 });
  }

  const settings = await getUserSettings(userId);
  if (!settings?.apiKey) {
    return NextResponse.json(
      { error: "Add your OpenRouter API key in Settings first." },
      { status: 400 }
    );
  }
  if (!settings.model) {
    return NextResponse.json(
      { error: "Select an OpenRouter model first." },
      { status: 400 }
    );
  }

  const stored = await readChatMessages(userId, chatId);
  const messages = buildContextMessages(stored);

  if (messages.length < 2) {
    return NextResponse.json(
      { error: "No user message found for this chat yet." },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  let content = "";
  try {
    content = await generateCatCoachReply({
      apiKey: settings.apiKey,
      model: settings.model,
      origin,
      baseMessages: messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate response.",
        details: (error as any)?.details ?? null,
      },
      { status: (error as any)?.status ?? 500 }
    );
  }

  // ✅ Parse + validate JSON response from model
  let parsed: any;
  try {
    parsed = parseAssistantJsonOrThrow(content);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: String(e?.message ?? "Model did not return valid JSON."),
        raw: content,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: {
      role: "assistant",
      content: parsed,
      model: settings.model,
    },
  });
}
