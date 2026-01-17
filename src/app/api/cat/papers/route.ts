import { FieldPath } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { tokenizeSearch } from "@/utils/cat-paper-utils";

export const runtime = "nodejs";

const MAX_LIMIT = 200;

type PaperRecord = {
  id: string;
  exam?: string;
  year?: number | null;
  slot?: number | null;
  paperSection?: string;
  searchTokens?: string[];
};

function encodeCursor(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  return encodeCursorFromValues(doc.get("year") ?? null, doc.id);
}

function encodeCursorFromValues(year: number | null, id: string) {
  const payload = { year: year ?? null, id };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeCursor(raw: string | null) {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as {
      year?: number | null;
      id?: string;
    };
    if (!decoded?.id) return null;
    return { year: decoded.year ?? null, id: decoded.id };
  } catch (error) {
    return null;
  }
}

function isMissingIndexError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: number }).code;
  return code === 9;
}

function normalizeYear(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

function applySearchFilter(paper: { searchTokens?: unknown }, searchTokens: string[]) {
  if (searchTokens.length <= 1) return true;
  const tokens = Array.isArray(paper.searchTokens) ? paper.searchTokens : [];
  return searchTokens.every(token => tokens.includes(token));
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const exam = searchParams.get("exam")?.toUpperCase() ?? "";
    const year = Number(searchParams.get("year")) || null;
    const slot = Number(searchParams.get("slot")) || null;
    const section = searchParams.get("section")?.toUpperCase() ?? "";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, MAX_LIMIT);
    const cursor = decodeCursor(searchParams.get("cursor"));
    const search = searchParams.get("search")?.trim() ?? "";
    const searchTokens = tokenizeSearch(search);

    let query: FirebaseFirestore.Query = db.collection("cat_papers");

    if (exam) query = query.where("exam", "==", exam);
    if (year) query = query.where("year", "==", year);
    if (slot) query = query.where("slot", "==", slot);
    if (section) query = query.where("paperSection", "==", section);
    if (searchTokens.length) query = query.where("searchTokens", "array-contains", searchTokens[0]);

    query = query.orderBy("year", "desc").orderBy(FieldPath.documentId());

    if (cursor) {
      query = query.startAfter(cursor.year, cursor.id);
    }

    try {
      const snapshot = await query.limit(limit + 1).get();
      const docs = snapshot.docs;
      const hasMore = docs.length > limit;
      const pageDocs = hasMore ? docs.slice(0, limit) : docs;

      const papers = pageDocs
        .map(doc => ({ id: doc.id, ...(doc.data() as Omit<PaperRecord, "id">) }))
        .filter(paper => applySearchFilter(paper, searchTokens));

      const nextCursor = hasMore && pageDocs.length ? encodeCursor(pageDocs[pageDocs.length - 1]) : null;

      return NextResponse.json({ papers, nextCursor });
    } catch (error) {
      if (!isMissingIndexError(error)) {
        throw error;
      }

      const snapshot = await db.collection("cat_papers").get();
      const papers = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<PaperRecord, "id">) }));

      const filtered = papers
        .filter(paper => (exam ? paper.exam === exam : true))
        .filter(paper => (year ? normalizeYear(paper.year) === year : true))
        .filter(paper => (slot ? normalizeYear(paper.slot) === slot : true))
        .filter(paper => (section ? paper.paperSection === section : true))
        .filter(paper => applySearchFilter(paper, searchTokens))
        .sort((a, b) => {
          const yearA = normalizeYear(a.year) ?? -1;
          const yearB = normalizeYear(b.year) ?? -1;
          if (yearA !== yearB) return yearB - yearA;
          return String(a.id).localeCompare(String(b.id));
        });

      let startIndex = 0;
      if (cursor) {
        const matchIndex = filtered.findIndex(
          item => normalizeYear(item.year) === cursor.year && String(item.id) === cursor.id
        );
        startIndex = matchIndex >= 0 ? matchIndex + 1 : 0;
      }

      const pageItems = filtered.slice(startIndex, startIndex + limit);
      const lastItem = pageItems[pageItems.length - 1];
      const nextCursor = lastItem ? encodeCursorFromValues(normalizeYear(lastItem.year), String(lastItem.id)) : null;

      return NextResponse.json({ papers: pageItems, nextCursor });
    }
  } catch (error) {
    console.error("Failed to load papers", error);
    return NextResponse.json({ error: "Unable to load papers." }, { status: 500 });
  }
}
