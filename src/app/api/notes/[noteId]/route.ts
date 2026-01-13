import { NextResponse, type NextRequest } from "next/server";

import cloudinary from "@/lib/cloudinary";
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

const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_NOTES_PREFIX = "cat99/notes";

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

function collectImageSources(payload: SerializedEditorState): string[] {
  const sources = new Set<string>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    if (record.type === "image" && typeof record.src === "string") {
      sources.add(record.src);
    }

    Object.values(record).forEach(visit);
  };

  visit(payload);
  return Array.from(sources);
}

function extractCloudinaryPublicId(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname !== CLOUDINARY_HOST) return null;

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 4) return null;

    const [cloudName, resourceType, uploadType, ...rest] = segments;
    if (CLOUDINARY_CLOUD_NAME && cloudName !== CLOUDINARY_CLOUD_NAME) {
      return null;
    }
    if (resourceType !== "image" || uploadType !== "upload") {
      return null;
    }
    if (rest.length === 0) return null;

    const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
    const publicParts = versionIndex >= 0 ? rest.slice(versionIndex + 1) : rest;
    if (publicParts.length === 0) return null;

    let publicId = decodeURIComponent(publicParts.join("/"));
    const lastSlash = publicId.lastIndexOf("/");
    const lastDot = publicId.lastIndexOf(".");
    if (lastDot > lastSlash) {
      publicId = publicId.slice(0, lastDot);
    }

    if (!publicId.startsWith(CLOUDINARY_NOTES_PREFIX)) {
      return null;
    }

    return publicId;
  } catch {
    return null;
  }
}

function extractNoteImagePublicIds(payload: SerializedEditorState): string[] {
  const publicIds = new Set<string>();
  collectImageSources(payload).forEach((src) => {
    const publicId = extractCloudinaryPublicId(src);
    if (publicId) {
      publicIds.add(publicId);
    }
  });
  return Array.from(publicIds);
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

export async function DELETE(
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
    return NextResponse.json({ error: "Invalid noteId." }, { status: 400 });
  }

  const store = getMemoryStore(userId);
  const fallbackNote = store.get(noteId) ?? null;
  const note = (await loadFromFirestore(userId, noteId)) ?? fallbackNote;
  if (!note) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  const publicIds = extractNoteImagePublicIds(note.payload);
  if (publicIds.length > 0) {
    try {
      await Promise.allSettled(
        publicIds.map((publicId) =>
          cloudinary.uploader.destroy(publicId, { invalidate: true })
        )
      );
    } catch (error) {
      console.error("Failed to delete Cloudinary images for note", error);
    }
  }

  const db = getAdminDb();
  if (db) {
    try {
      await db
        .collection("users")
        .doc(userId)
        .collection("notes")
        .doc(noteId)
        .delete();
    } catch (error) {
      console.error("Failed to delete rough note from Firestore", error);
      return NextResponse.json(
        { error: "Failed to delete rough note." },
        { status: 500 }
      );
    }
  }

  store.delete(noteId);
  return NextResponse.json({
    ok: true,
    noteId,
    deletedImages: publicIds.length,
  });
}
