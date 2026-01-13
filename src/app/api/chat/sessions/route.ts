import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { MessageContent, previewMessageContent } from "@/lib/message-content";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type ChatSession = {
  id: string;
  title?: string | null;
  preview?: string | null;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  createdAt?: string;
};

type MemoryStore = Map<string, Map<string, StoredMessage[]>>;

const globalAny = globalThis as unknown as {
  __chatHistoryStore?: MemoryStore;
  __chatArchivedSessions?: Map<string, Set<string>>;
};

function getArchivedSet(userId: string) {
  if (!globalAny.__chatArchivedSessions) {
    globalAny.__chatArchivedSessions = new Map();
  }
  if (!globalAny.__chatArchivedSessions.has(userId)) {
    globalAny.__chatArchivedSessions.set(userId, new Set());
  }
  return globalAny.__chatArchivedSessions.get(userId)!;
}

function sessionsFromMemory(userId: string, includeArchived: boolean) {
  const store = globalAny.__chatHistoryStore;
  const sessions = store?.get(userId);
  if (!sessions) return [];

  const archivedSet = getArchivedSet(userId);
  const result: ChatSession[] = [];
  for (const [id, messages] of sessions.entries()) {
    const isArchived = archivedSet.has(id);
    if (!includeArchived && isArchived) continue;
    const last = messages.at(-1);
    const preview = last ? previewMessageContent(last.content, 120) : "";
    result.push({
      id,
      title: null,
      preview: preview ? preview : null,
      archived: isArchived,
      createdAt: messages.at(0)?.createdAt,
      updatedAt: last?.createdAt,
    });
  }

  result.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  return result;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({
      sessions: sessionsFromMemory(userId, includeArchived),
    });
  }

  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("chat_sessions")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  const sessions = snapshot.docs
    .map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : null,
        preview: typeof data.preview === "string" ? data.preview : null,
        archived: Boolean(data.archived),
        createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
        updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
      } satisfies ChatSession;
    })
    .filter(session => includeArchived || session.archived !== true);

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getAdminDb();
  const now = new Date().toISOString();

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const preview = typeof body.preview === "string" ? body.preview.trim() : "";

  const chatId = randomUUID();

  if (db) {
    await db
      .collection("users")
      .doc(userId)
      .collection("chat_sessions")
      .doc(chatId)
      .set(
        {
          createdAt: now,
          updatedAt: now,
          archived: false,
          ...(title ? { title: title.slice(0, 80) } : {}),
          ...(preview ? { preview: preview.slice(0, 200) } : {}),
        },
        { merge: true }
      );
  } else {
    // Ensure it shows up in the in-memory list immediately (even before messages).
    if (!globalAny.__chatHistoryStore) {
      globalAny.__chatHistoryStore = new Map();
    }
    const store = globalAny.__chatHistoryStore;
    if (!store.has(userId)) store.set(userId, new Map());
    store.get(userId)!.set(chatId, []);
    getArchivedSet(userId).delete(chatId);
  }

  return NextResponse.json({ chatId });
}
