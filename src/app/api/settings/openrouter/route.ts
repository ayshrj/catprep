import { NextResponse } from "next/server"

import { getAdminDb } from "@/lib/firebase-admin"
import { getAuthenticatedUserId } from "../../auth/utils"

export const runtime = "nodejs"

type SettingsRecord = {
  openRouterApiKey?: string | null
  openRouterModel?: string | null
}

const globalAny = globalThis as unknown as {
  __chatUserSettings?: Map<string, SettingsRecord>
}

function getMemoryStore() {
  if (!globalAny.__chatUserSettings) {
    globalAny.__chatUserSettings = new Map()
  }
  return globalAny.__chatUserSettings
}

function last4(value: string) {
  return value.length <= 4 ? value : value.slice(-4)
}

export async function GET() {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const db = getAdminDb()
  if (!db) {
    const record = getMemoryStore().get(userId)
    const key =
      typeof record?.openRouterApiKey === "string" ? record.openRouterApiKey : ""
    const model =
      typeof record?.openRouterModel === "string" ? record.openRouterModel : ""
    return NextResponse.json({
      hasKey: Boolean(key.trim()),
      last4: key.trim() ? last4(key.trim()) : null,
      model: model.trim() ? model.trim() : null,
    })
  }

  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("private")
    .doc("settings")
    .get()
  const data = (doc.data() ?? {}) as SettingsRecord
  const key =
    typeof data.openRouterApiKey === "string" ? data.openRouterApiKey : ""
  const model = typeof data.openRouterModel === "string" ? data.openRouterModel : ""

  return NextResponse.json({
    hasKey: Boolean(key.trim()),
    last4: key.trim() ? last4(key.trim()) : null,
    model: model.trim() ? model.trim() : null,
  })
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const key = typeof body.key === "string" ? body.key.trim() : ""

  if (!key) {
    return NextResponse.json({ error: "OpenRouter key is required." }, { status: 400 })
  }

  const db = getAdminDb()
  const now = new Date().toISOString()

  if (!db) {
    getMemoryStore().set(userId, { openRouterApiKey: key })
    return NextResponse.json({ ok: true, updatedAt: now })
  }

  await db
    .collection("users")
    .doc(userId)
    .collection("private")
    .doc("settings")
    .set(
      {
        openRouterApiKey: key,
        updatedAt: now,
      },
      { merge: true }
    )

  return NextResponse.json({ ok: true, updatedAt: now })
}

export async function DELETE() {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const db = getAdminDb()
  const now = new Date().toISOString()

  if (!db) {
    const store = getMemoryStore()
    const record = store.get(userId) ?? {}
    store.set(userId, { ...record, openRouterApiKey: null, openRouterModel: null })
    return NextResponse.json({ ok: true, updatedAt: now })
  }

  await db
    .collection("users")
    .doc(userId)
    .collection("private")
    .doc("settings")
    .set(
      { openRouterApiKey: null, openRouterModel: null, updatedAt: now },
      { merge: true }
    )

  return NextResponse.json({ ok: true, updatedAt: now })
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const model = typeof body.model === "string" ? body.model.trim() : ""

  if (!model) {
    return NextResponse.json(
      { error: "OpenRouter model is required." },
      { status: 400 }
    )
  }

  const db = getAdminDb()
  const now = new Date().toISOString()

  if (!db) {
    const store = getMemoryStore()
    const record = store.get(userId) ?? {}
    store.set(userId, { ...record, openRouterModel: model })
    return NextResponse.json({ ok: true, updatedAt: now })
  }

  await db
    .collection("users")
    .doc(userId)
    .collection("private")
    .doc("settings")
    .set({ openRouterModel: model, updatedAt: now }, { merge: true })

  return NextResponse.json({ ok: true, updatedAt: now })
}
