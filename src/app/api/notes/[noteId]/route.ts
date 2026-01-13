import { NextResponse, type NextRequest } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "../../auth/utils";
import type { SerializedEditorState } from "lexical";

export const runtime = "nodejs";

type StoredNote = {
  id: string;
  title: string | null;
  preview: string;
  payload: SerializedEditorState;
  createdAt: string;
  updatedAt: string;
};

type MemoryStore = Map<string, Map<string, StoredNote>>;

const globalAny = globalThis as typeof globalThis & {
  __roughNoteStore?: MemoryStore;
};

function getMemoryStore(userId: string) {
  if (!globalAny.__roughNoteStore) {
    globalAny.__roughNoteStore = new Map();
  }
  if (!globalAny.__roughNoteStore.has(userId)) {
    globalAny.__roughNoteStore.set(userId, new Map());
  }
  return globalAny.__roughNoteStore.get(userId)!;
}

function normalizeNoteId(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replaceAll("/", "");
  return sanitized.slice(0, 128);
}

async function loadFromFirestore(userId: string, noteId: string) {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const doc = await db
      .collection("users")
      .doc(userId)
      .collection("notes")
      .doc(noteId)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    const payload = data.payload as SerializedEditorState | undefined;
    if (!payload || typeof payload !== "object") return null;

    return {
      id: doc.id,
      title: typeof data.title === "string" ? data.title : null,
      preview: typeof data.preview === "string" ? data.preview : "",
      payload,
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
    } satisfies StoredNote;
  } catch (error) {
    console.error("Failed to load rough note from Firestore", error);
    return null;
  }
}

async function persistToFirestore(
  userId: string,
  noteId: string,
  payload: SerializedEditorState,
  preview: string,
  title: string | null,
) {
  const db = getAdminDb();
  if (!db) return false;

  try {
    const noteRef = db
      .collection("users")
      .doc(userId)
      .collection("notes")
      .doc(noteId);
    await noteRef.get().then(async (existing) => {
      const isNew = !existing.exists;
      await noteRef.set(
        {
          payload,
          preview,
          title,
          updatedAt: new Date().toISOString(),
          ...(isNew ? { createdAt: new Date().toISOString() } : {}),
        },
        { merge: true }
      );
    });

    return true;
  } catch (error) {
    console.error("Failed to persist rough note to Firestore", error);
    return false;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { noteId: rawNoteId } = await params;
  const noteId = normalizeNoteId(rawNoteId);
  if (!noteId) {
    return NextResponse.json(
      { error: "Invalid noteId." },
      { status: 400 }
    );
  }

  const note = await loadFromFirestore(userId, noteId);
  if (note) {
    return NextResponse.json({ note });
  }

  const store = getMemoryStore(userId);
  const stored = store.get(noteId);
  if (!stored) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ note: stored });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { noteId: rawNoteId } = await params;
  const noteId = normalizeNoteId(rawNoteId);
  if (!noteId) {
    return NextResponse.json(
      { error: "Invalid noteId." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const preview =
    typeof body.preview === "string" ? body.preview.trim() : "";
  const payload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as SerializedEditorState)
      : null;
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : null;

  if (!payload) {
    return NextResponse.json(
      { error: "Provide a valid `payload`." },
      { status: 400 }
    );
  }

  if (!preview) {
    return NextResponse.json(
      { error: "Provide preview text for the note." },
      { status: 400 }
    );
  }

  const stored = {
    id: noteId,
    title,
    preview,
    payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies StoredNote;

  const saved = await persistToFirestore(userId, noteId, payload, preview, title);
  if (saved) {
    return NextResponse.json({ noteId });
  }

  const store = getMemoryStore(userId);
  store.set(noteId, stored);
  return NextResponse.json({ noteId });
}
