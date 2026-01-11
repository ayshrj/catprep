import { NextResponse, type NextRequest } from "next/server"

import { setAuthCookies } from "../utils"

export const runtime = "nodejs"

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "Firebase API key missing." },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? "Unable to sign in." },
        { status: response.status }
      )
    }

    const uid = data.localId as string
    await setAuthCookies({
      uid,
      email: data.email,
      displayName: data.displayName,
    })

    return NextResponse.json({
      user: {
        uid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
      },
    })
  } catch (error) {
    console.error("Auth login failed", error)
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 }
    )
  }
}

