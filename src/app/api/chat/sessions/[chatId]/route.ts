import { NextResponse, type NextRequest } from "next/server"

import { getAdminDb } from "@/lib/firebase-admin"
import { getAuthenticatedUserId } from "../../../auth/utils"

export const runtime = "nodejs"

type MemoryStore = Map<string, Map<string, any[]>>

const globalAny = globalThis as unknown as {
  __chatHistoryStore?: MemoryStore
  __chatArchivedSessions?: Map<string, Set<string>>
}

function getArchivedSet(userId: string) {
  if (!globalAny.__chatArchivedSessions) {
    globalAny.__chatArchivedSessions = new Map()
  }
  if (!globalAny.__chatArchivedSessions.has(userId)) {
    globalAny.__chatArchivedSessions.set(userId, new Set())
  }
  return globalAny.__chatArchivedSessions.get(userId)!
}

function normalizeChatId(raw: string) {
  const trimmed = raw.trim()
  const sanitized = trimmed.replaceAll("/", "")
  if (!sanitized) return null
  return sanitized.slice(0, 128)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { chatId: rawChatId } = await params
  const chatId = normalizeChatId(rawChatId)
  if (!chatId) {
    return NextResponse.json({ error: "Invalid chatId." }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const archived =
    typeof body.archived === "boolean"
      ? body.archived
      : body.action === "archive"
        ? true
        : body.action === "unarchive"
          ? false
          : null

  if (archived === null) {
    return NextResponse.json(
      { error: "Provide `archived: boolean`." },
      { status: 400 }
    )
  }

  const db = getAdminDb()
  const now = new Date().toISOString()

  if (!db) {
    const set = getArchivedSet(userId)
    if (archived) set.add(chatId)
    else set.delete(chatId)
    return NextResponse.json({ ok: true, archived })
  }

  const sessionRef = db
    .collection("users")
    .doc(userId)
    .collection("chat_sessions")
    .doc(chatId)

  await sessionRef.set(
    {
      archived,
      archivedAt: archived ? now : null,
      updatedAt: now,
    },
    { merge: true }
  )

  return NextResponse.json({ ok: true, archived })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { chatId: rawChatId } = await params
  const chatId = normalizeChatId(rawChatId)
  if (!chatId) {
    return NextResponse.json({ error: "Invalid chatId." }, { status: 400 })
  }

  const db = getAdminDb()

  if (!db) {
    const store = globalAny.__chatHistoryStore
    store?.get(userId)?.delete(chatId)
    getArchivedSet(userId).delete(chatId)
    return NextResponse.json({ ok: true })
  }

  const sessionRef = db
    .collection("users")
    .doc(userId)
    .collection("chat_sessions")
    .doc(chatId)

  const docs = await sessionRef.collection("messages").listDocuments()
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch()
    for (const ref of docs.slice(i, i + 400)) {
      batch.delete(ref)
    }
    await batch.commit()
  }

  await sessionRef.delete().catch(() => null)
  return NextResponse.json({ ok: true })
}

