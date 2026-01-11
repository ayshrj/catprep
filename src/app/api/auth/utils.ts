import { cookies } from "next/headers"

const AUTH_COOKIE_NAME = "chat_auth"
const UID_COOKIE_NAME = "chat_uid"

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
}

export async function setAuthCookies({
  uid,
  email,
  displayName,
}: {
  uid: string
  email?: string
  displayName?: string
}) {
  const store = await cookies()
  store.set({ name: AUTH_COOKIE_NAME, value: "1", ...COOKIE_OPTIONS })
  store.set({ name: UID_COOKIE_NAME, value: uid, ...COOKIE_OPTIONS })
  if (email) {
    store.set({ name: "chat_email", value: email, ...COOKIE_OPTIONS })
  }
  if (displayName) {
    store.set({ name: "chat_name", value: displayName, ...COOKIE_OPTIONS })
  }
}

export async function clearAuthCookies() {
  const store = await cookies()
  store.set({ name: AUTH_COOKIE_NAME, value: "", ...COOKIE_OPTIONS, maxAge: 0 })
  store.set({ name: UID_COOKIE_NAME, value: "", ...COOKIE_OPTIONS, maxAge: 0 })
  store.set({ name: "chat_email", value: "", ...COOKIE_OPTIONS, maxAge: 0 })
  store.set({ name: "chat_name", value: "", ...COOKIE_OPTIONS, maxAge: 0 })
}

export async function getAuthCookies() {
  const store = await cookies()
  const authenticated = Boolean(store.get(AUTH_COOKIE_NAME)?.value)
  return {
    authenticated,
    uid: store.get(UID_COOKIE_NAME)?.value ?? null,
    email: store.get("chat_email")?.value ?? null,
    displayName: store.get("chat_name")?.value ?? null,
  }
}

export async function getAuthenticatedUserId() {
  const { authenticated, uid } = await getAuthCookies()
  if (!authenticated || !uid) return null
  return uid
}

