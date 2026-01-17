import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paperId: string; sectionId: string }> }
) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const { paperId, sectionId } = await params;
    const sectionRef = db.collection("cat_papers").doc(paperId).collection("sections").doc(sectionId);
    const sectionSnap = await sectionRef.get();
    if (!sectionSnap.exists) {
      return NextResponse.json({ error: "Section not found." }, { status: 404 });
    }

    return NextResponse.json({ section: { id: sectionSnap.id, ...sectionSnap.data() } });
  } catch (error) {
    console.error("Failed to load section", error);
    return NextResponse.json({ error: "Unable to load section." }, { status: 500 });
  }
}
