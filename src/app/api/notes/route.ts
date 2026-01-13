import { randomUUID } from "crypto";
import type { SerializedEditorState } from "lexical";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../auth/utils";

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

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getAdminDb();

  if (db) {
    try {
      const snapshot = await db
        .collection("users")
        .doc(userId)
        .collection("notes")
        .orderBy("updatedAt", "desc")
        .limit(50)
        .get();

      const notes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: typeof data.title === "string" ? data.title : null,
          preview: typeof data.preview === "string" ? data.preview : "",
          createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
          updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
        };
      });

      return NextResponse.json({ notes });
    } catch (error) {
      console.error("Failed to load rough notes from Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  const notes = Array.from(store.values())
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || b.createdAt.localeCompare(a.createdAt))
    .map(note => ({
      id: note.id,
      title: note.title,
      preview: note.preview,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));

  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getAdminDb();
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
  const preview = typeof body.preview === "string" ? body.preview.trim() : "";
  const payload = body.payload && typeof body.payload === "object" ? (body.payload as SerializedEditorState) : null;

  if (!payload) {
    return NextResponse.json({ error: "Provide a valid `payload`." }, { status: 400 });
  }

  if (!preview) {
    return NextResponse.json({ error: "Provide preview text for the note." }, { status: 400 });
  }

  const noteId = randomUUID();
  const now = new Date().toISOString();

  if (db) {
    try {
      await db.collection("users").doc(userId).collection("notes").doc(noteId).set(
        {
          title,
          preview,
          payload,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({ noteId });
    } catch (error) {
      console.error("Failed to persist rough note to Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  store.set(noteId, {
    id: noteId,
    title,
    preview,
    payload,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ noteId });
}
