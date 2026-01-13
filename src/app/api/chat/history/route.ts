import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  coerceStoredMessageContent,
  MessageContent,
  previewMessageContent,
  restoreFromFirestore,
  sanitizeForFirestore,
} from "@/lib/message-content";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type StoredAttachment = {
  name?: string;
  contentType?: string;
  url: string;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  createdAt?: string;
  experimental_attachments?: StoredAttachment[];
};

type MemoryStore = Map<string, Map<string, StoredMessage[]>>;

const globalAny = globalThis as unknown as {
  __chatHistoryStore?: MemoryStore;
};

const memoryStore: MemoryStore = globalAny.__chatHistoryStore ?? (globalAny.__chatHistoryStore = new Map());

function getSessionId(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("chatId") ?? searchParams.get("sessionId"))?.trim();

  if (!raw) return "default";

  // Firestore doc IDs cannot contain slashes.
  const sanitized = raw.replaceAll("/", "");
  return sanitized.slice(0, 128) || "default";
}

function getMemorySession(userId: string, sessionId: string) {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, new Map());
  }
  const sessions = memoryStore.get(userId)!;
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  return sessions.get(sessionId)!;
}

function sanitizeMessage(message: StoredMessage, now: string): StoredMessage {
  const id = typeof message.id === "string" ? message.id.trim() : "";
  const role = message.role === "assistant" ? "assistant" : "user";
  const content = sanitizeForFirestore(coerceStoredMessageContent(message.content) ?? "") as MessageContent;

  const attachments = Array.isArray(message.experimental_attachments)
    ? message.experimental_attachments
        .filter(
          (item): item is StoredAttachment =>
            item && typeof item === "object" && typeof (item as any).url === "string" && Boolean((item as any).url)
        )
        .map(item => ({
          url: item.url,
          ...(typeof item.name === "string" ? { name: item.name } : {}),
          ...(typeof item.contentType === "string" ? { contentType: item.contentType } : {}),
        }))
    : undefined;

  return {
    id,
    role,
    content,
    createdAt: typeof message.createdAt === "string" && message.createdAt ? message.createdAt : now,
    ...(attachments && attachments.length > 0 ? { experimental_attachments: attachments } : {}),
  };
}

async function readMessages(userId: string, sessionId: string) {
  const db = getAdminDb();
  if (!db) {
    return getMemorySession(userId, sessionId).map(message => ({
      ...message,
      content: restoreFromFirestore(message.content) as MessageContent,
    }));
  }

  const sessionRef = db.collection("users").doc(userId).collection("chat_sessions").doc(sessionId);

  const snapshot = await sessionRef.collection("messages").orderBy("createdAt", "asc").get();

  return snapshot.docs.map(doc => {
    const data = doc.data() as StoredMessage;
    return {
      ...data,
      content: restoreFromFirestore(data.content) as MessageContent,
    };
  });
}

async function appendMessages(userId: string, sessionId: string, messages: StoredMessage[]) {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (!db) {
    const session = getMemorySession(userId, sessionId);
    messages.forEach(message => {
      const clean = sanitizeMessage(message, now);
      if (!clean.id) return;
      const existingIndex = session.findIndex(item => item.id === clean.id);
      if (existingIndex >= 0) {
        session[existingIndex] = clean;
      } else {
        session.push(clean);
      }
    });
    session.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
    return;
  }

  const sessionRef = db.collection("users").doc(userId).collection("chat_sessions").doc(sessionId);

  await sessionRef.set({ updatedAt: now, createdAt: now }, { merge: true });

  const latestMessage = messages.at(-1);
  const preview = latestMessage ? previewMessageContent(latestMessage.content, 200) : "";

  if (preview) {
    await sessionRef.set({ preview }, { merge: true });
  }

  const writes = messages
    .map(message => sanitizeMessage(message, now))
    .filter(message => Boolean(message.id))
    .map(message =>
      sessionRef.collection("messages").doc(message.id).set(message, {
        merge: true,
      })
    );

  await Promise.all(writes);
}

async function clearMessages(userId: string, sessionId: string) {
  const db = getAdminDb();
  if (!db) {
    const session = getMemorySession(userId, sessionId);
    session.splice(0, session.length);
    return;
  }

  const sessionRef = db.collection("users").doc(userId).collection("chat_sessions").doc(sessionId);

  const docs = await sessionRef.collection("messages").listDocuments();
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const ref of docs.slice(i, i + 400)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const sessionId = getSessionId(request);
  const messages = await readMessages(userId, sessionId);
  return NextResponse.json({ sessionId, messages });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const sessionId = getSessionId(request);
  const body = await request.json().catch(() => ({}));

  const rawMessages = Array.isArray(body.messages)
    ? (body.messages as StoredMessage[])
    : body.message
      ? [body.message as StoredMessage]
      : [];

  if (rawMessages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  await appendMessages(userId, sessionId, rawMessages);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const sessionId = getSessionId(request);
  await clearMessages(userId, sessionId);
  return NextResponse.json({ ok: true });
}
