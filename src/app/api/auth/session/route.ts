import { NextResponse } from "next/server";

import { getAuthCookies } from "../utils";

export const runtime = "nodejs";

export async function GET() {
  const { authenticated, uid, email, displayName } = await getAuthCookies();

  if (!authenticated || !uid) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      uid,
      email,
      displayName,
    },
  });
}
