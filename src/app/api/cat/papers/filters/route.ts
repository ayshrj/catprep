import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const doc = await db.doc("cat_papers_meta/summary").get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Paper metadata not found." }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Failed to load paper filters", error);
    return NextResponse.json({ error: "Unable to load filters." }, { status: 500 });
  }
}
