import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string; sectionId: string; questionId: string }> }
) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const includeSolution = searchParams.get("includeSolution") === "1";

    const { paperId, sectionId, questionId } = await params;
    const questionRef = db
      .collection("cat_papers")
      .doc(paperId)
      .collection("sections")
      .doc(sectionId)
      .collection("questions")
      .doc(questionId);

    const questionSnap = await questionRef.get();
    if (!questionSnap.exists) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    let solution = null;
    if (includeSolution && questionSnap.get("hasSolution")) {
      const solutionSnap = await questionRef.collection("solutions").doc("main").get();
      if (solutionSnap.exists) {
        solution = { id: solutionSnap.id, ...solutionSnap.data() };
      }
    }

    return NextResponse.json({ question: { id: questionSnap.id, ...questionSnap.data() }, solution });
  } catch (error) {
    console.error("Failed to load question", error);
    return NextResponse.json({ error: "Unable to load question." }, { status: 500 });
  }
}
