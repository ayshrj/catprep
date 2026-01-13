import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type OpenRouterModelsResponse = {
  data?: Array<{
    id: string;
    name?: string;
    description?: string;
    context_length?: number | null;
  }>;
};

async function getUserOpenRouterKey(userId: string) {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection("users").doc(userId).collection("private").doc("settings").get();

  const data = (doc.data() ?? {}) as any;
  const key = typeof data.openRouterApiKey === "string" ? data.openRouterApiKey.trim() : "";
  return key || null;
}

export async function GET(req: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const apiKey = await getUserOpenRouterKey(userId);
  if (!apiKey) {
    return NextResponse.json({ error: "Add your OpenRouter API key in Settings first." }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": origin,
      "X-Title": "Chat App",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      {
        error: `OpenRouter error (${response.status})`,
        details: text.slice(0, 2000),
      },
      { status: response.status }
    );
  }

  const data = (await response.json()) as OpenRouterModelsResponse;
  const models = (data.data ?? []).map(model => ({
    id: model.id,
    name: model.name ?? model.id,
    description: model.description ?? "",
    contextLength: model.context_length ?? null,
  }));

  return NextResponse.json({ models });
}
