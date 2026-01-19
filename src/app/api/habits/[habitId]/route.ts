import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type HabitRecord = {
  id: string;
  label: string;
  completions?: string[];
  doneOn?: string | null;
  createdAt: string;
  updatedAt: string;
};

type MemoryStore = Map<string, Map<string, HabitRecord>>;

const globalAny = globalThis as typeof globalThis & {
  __habitStore?: MemoryStore;
};

const padDate = (value: number) => String(value).padStart(2, "0");

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${padDate(now.getMonth() + 1)}-${padDate(now.getDate())}`;
};

function getMemoryStore(userId: string) {
  if (!globalAny.__habitStore) {
    globalAny.__habitStore = new Map();
  }
  if (!globalAny.__habitStore.has(userId)) {
    globalAny.__habitStore.set(userId, new Map());
  }
  return globalAny.__habitStore.get(userId)!;
}

type RouteContext = {
  params: Promise<{
    habitId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { habitId } = await params;
  if (!habitId) {
    return NextResponse.json({ error: "Habit id is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    dateKey?: unknown;
    completed?: unknown;
    doneOn?: unknown;
    label?: unknown;
  };
  let labelValue: string | undefined;
  if (body.label !== undefined) {
    if (typeof body.label !== "string") {
      return NextResponse.json({ error: "Provide label as a string." }, { status: 400 });
    }
    const trimmedLabel = body.label.trim();
    if (!trimmedLabel) {
      return NextResponse.json({ error: "Habit label cannot be empty." }, { status: 400 });
    }
    labelValue = trimmedLabel;
  }

  const hasCompletionPayload = body.completed !== undefined || body.dateKey !== undefined || body.doneOn !== undefined;
  let dateKey = "";
  let completed = typeof body.completed === "boolean" ? body.completed : undefined;

  if (hasCompletionPayload) {
    dateKey = typeof body.dateKey === "string" ? body.dateKey.trim() : "";
    if (!dateKey || completed === undefined) {
      const doneOnValue =
        typeof body.doneOn === "string" ? body.doneOn.trim() || null : body.doneOn === null ? null : undefined;

      if (doneOnValue === undefined) {
        return NextResponse.json(
          { error: "Provide dateKey and completed, or doneOn as a string/null." },
          { status: 400 }
        );
      }

      dateKey = typeof doneOnValue === "string" ? doneOnValue : getTodayKey();
      completed = Boolean(doneOnValue);
    }

    if (!dateKey) {
      return NextResponse.json({ error: "Provide a valid dateKey." }, { status: 400 });
    }
  }

  if (!hasCompletionPayload && !labelValue) {
    return NextResponse.json({ error: "Provide updates for label or completion." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    updatedAt: now,
  };
  if (labelValue) {
    updatePayload.label = labelValue;
  }
  if (hasCompletionPayload) {
    updatePayload.doneOn = completed ? dateKey : null;
    updatePayload.completions = completed ? FieldValue.arrayUnion(dateKey) : FieldValue.arrayRemove(dateKey);
  }
  const db = getAdminDb();

  if (db) {
    try {
      await db.collection("users").doc(userId).collection("habits").doc(habitId).set(updatePayload, { merge: true });

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Failed to update habit in Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  const existing = store.get(habitId);
  if (!existing) {
    return NextResponse.json({ error: "Habit not found." }, { status: 404 });
  }

  let updatedCompletions = new Set(existing.completions ?? []);
  if (hasCompletionPayload) {
    updatedCompletions = new Set(existing.completions ?? []);
    if (completed) {
      updatedCompletions.add(dateKey);
    } else {
      updatedCompletions.delete(dateKey);
    }
  }

  store.set(habitId, {
    ...existing,
    label: labelValue ?? existing.label,
    doneOn: hasCompletionPayload ? (completed ? dateKey : null) : existing.doneOn,
    completions: hasCompletionPayload ? Array.from(updatedCompletions) : existing.completions,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { habitId } = await params;
  if (!habitId) {
    return NextResponse.json({ error: "Habit id is required." }, { status: 400 });
  }

  const db = getAdminDb();
  if (db) {
    try {
      await db.collection("users").doc(userId).collection("habits").doc(habitId).delete();
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Failed to delete habit in Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  const existing = store.get(habitId);
  if (!existing) {
    return NextResponse.json({ error: "Habit not found." }, { status: 404 });
  }
  store.delete(habitId);

  return NextResponse.json({ ok: true });
}
