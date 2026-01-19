import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../auth/utils";

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

function getMemoryStore(userId: string) {
  if (!globalAny.__habitStore) {
    globalAny.__habitStore = new Map();
  }
  if (!globalAny.__habitStore.has(userId)) {
    globalAny.__habitStore.set(userId, new Map());
  }
  return globalAny.__habitStore.get(userId)!;
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
        .collection("habits")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const habits = snapshot.docs.map(doc => {
        const data = doc.data();
        const rawCompletions = Array.isArray(data.completions)
          ? data.completions.filter((value): value is string => typeof value === "string")
          : [];
        const doneOn = typeof data.doneOn === "string" ? data.doneOn : null;
        const completions = Array.from(new Set([...rawCompletions, ...(doneOn ? [doneOn] : [])]));
        return {
          id: doc.id,
          label: typeof data.label === "string" ? data.label : "",
          completions,
          doneOn,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
          updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
        };
      });

      return NextResponse.json({ habits });
    } catch (error) {
      console.error("Failed to load habits from Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  const habits = Array.from(store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ habits });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getAdminDb();
  const body = (await request.json().catch(() => ({}))) as { label?: unknown };
  const label = typeof body.label === "string" ? body.label.trim() : "";

  if (!label) {
    return NextResponse.json({ error: "Provide a valid habit label." }, { status: 400 });
  }

  const habitId = randomUUID();
  const now = new Date().toISOString();

  if (db) {
    try {
      await db.collection("users").doc(userId).collection("habits").doc(habitId).set(
        {
          label,
          completions: [],
          doneOn: null,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({ habitId });
    } catch (error) {
      console.error("Failed to persist habit to Firestore", error);
    }
  }

  const store = getMemoryStore(userId);
  store.set(habitId, {
    id: habitId,
    label,
    completions: [],
    doneOn: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ habitId });
}
