import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ paperId: string }> }) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const { paperId } = await params;
    const paperRef = db.collection("cat_papers").doc(paperId);
    const paperSnap = await paperRef.get();
    if (!paperSnap.exists) {
      return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    }

    const sectionsSnap = await paperRef.collection("sections").orderBy("index").get();
    const sections = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ paper: { id: paperSnap.id, ...paperSnap.data() }, sections });
  } catch (error) {
    console.error("Failed to load paper", error);
    return NextResponse.json({ error: "Unable to load paper." }, { status: 500 });
  }
}
