import { NextResponse } from "next/server";

import { clearAuthCookies } from "../utils";

export const runtime = "nodejs";

export async function POST() {
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
