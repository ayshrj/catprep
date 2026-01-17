import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const MAX_LIMIT = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string; sectionId: string }> }
) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, MAX_LIMIT);
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam !== null ? Number(cursorParam) : null;

    const { paperId, sectionId } = await params;
    let query: FirebaseFirestore.Query = db
      .collection("cat_papers")
      .doc(paperId)
      .collection("sections")
      .doc(sectionId)
      .collection("questions")
      .orderBy("index");

    if (cursor !== null && !Number.isNaN(cursor)) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.limit(limit + 1).get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;
    const questions = pageDocs.map(doc => ({ id: doc.id, ...doc.data() }));

    const nextCursor = hasMore && pageDocs.length ? pageDocs[pageDocs.length - 1].get("index") : null;

    return NextResponse.json({ questions, nextCursor });
  } catch (error) {
    console.error("Failed to load questions", error);
    return NextResponse.json({ error: "Unable to load questions." }, { status: 500 });
  }
}
