import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../../../auth/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const uid = await getAuthenticatedUserId();
    if (!uid) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const snapshot = await db.collection("users").doc(uid).collection("paper_favorites").get();
    const favorites = snapshot.docs.map(doc => doc.id);

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Failed to load favorites", error);
    return NextResponse.json({ error: "Unable to load favorites." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore is not configured." }, { status: 500 });
    }

    const uid = await getAuthenticatedUserId();
    if (!uid) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paperId = typeof body.paperId === "string" ? body.paperId.trim() : "";
    const favorite = typeof body.favorite === "boolean" ? body.favorite : null;

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required." }, { status: 400 });
    }

    const favoriteRef = db.collection("users").doc(uid).collection("paper_favorites").doc(paperId);

    if (favorite === false) {
      await favoriteRef.delete();
      return NextResponse.json({ favorite: false });
    }

    if (favorite === true) {
      await favoriteRef.set({ paperId, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ favorite: true });
    }

    const existing = await favoriteRef.get();
    if (existing.exists) {
      await favoriteRef.delete();
      return NextResponse.json({ favorite: false });
    }

    await favoriteRef.set({ paperId, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ favorite: true });
  } catch (error) {
    console.error("Failed to update favorite", error);
    return NextResponse.json({ error: "Unable to update favorite." }, { status: 500 });
  }
}
