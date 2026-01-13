import type { SerializedEditorState } from "lexical";
import { NextResponse, type NextRequest } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type MemoryStore = Map<string, Map<string, SerializedEditorState | null>>;

const globalAny = globalThis as typeof globalThis & {
  __editorStateStore?: MemoryStore;
};

function normalizeKey(raw?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replaceAll("/", "");
  return sanitized.slice(0, 128);
}

function getMemoryStore(userId: string) {
  if (!globalAny.__editorStateStore) {
    globalAny.__editorStateStore = new Map();
  }
  if (!globalAny.__editorStateStore.has(userId)) {
    globalAny.__editorStateStore.set(userId, new Map());
  }
  return globalAny.__editorStateStore.get(userId)!;
}

async function fetchFromFirestore(userId: string, key: string) {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const doc = await db
      .collection("users")
      .doc(userId)
      .collection("editor_states")
      .doc(key)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()?.payload;
    if (!data || typeof data !== "object") {
      return null;
    }

    return data as SerializedEditorState;
  } catch (error) {
    console.error("Failed to load editor state from Firestore", error);
    return null;
  }
}

async function persistToFirestore(
  userId: string,
  key: string,
  payload: SerializedEditorState
) {
  const db = getAdminDb();
  if (!db) return false;

  try {
    await db
      .collection("users")
      .doc(userId)
      .collection("editor_states")
      .doc(key)
      .set(
        {
          payload,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return true;
  } catch (error) {
    console.error("Failed to persist editor state to Firestore", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = normalizeKey(searchParams.get("key"));
  if (!key) {
    return NextResponse.json(
      { error: "Provide a `key` query parameter." },
      { status: 400 }
    );
  }

  const serialized = await fetchFromFirestore(userId, key);
  if (serialized) {
    return NextResponse.json({ payload: serialized });
  }

  const memoryStore = getMemoryStore(userId);
  return NextResponse.json({ payload: memoryStore.get(key) ?? null });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawKey =
    typeof body.key === "string" ? normalizeKey(body.key) : null;
  const payload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as SerializedEditorState)
      : null;

  if (!rawKey) {
    return NextResponse.json(
      { error: "Provide a valid `key` in the request body." },
      { status: 400 }
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: "Provide a `payload` in the request body." },
      { status: 400 }
    );
  }

  const saved = await persistToFirestore(userId, rawKey, payload);
  if (saved) {
    return NextResponse.json({ ok: true });
  }

  const memoryStore = getMemoryStore(userId);
  memoryStore.set(rawKey, payload);
  return NextResponse.json({ ok: true });
}
