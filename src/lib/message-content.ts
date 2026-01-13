export type MessageContent = string | Record<string, unknown> | unknown[];

export function coerceStoredMessageContent(value: unknown): MessageContent | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

export function stringifyMessageContent(value: unknown, maxLength?: number): string {
  let text = "";
  if (typeof value === "string") {
    text = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    text = String(value);
  } else if (value && typeof value === "object") {
    try {
      text = JSON.stringify(value, null, 2);
    } catch {
      text = "";
    }
  }

  if (typeof maxLength === "number" && maxLength > 0 && text.length > maxLength) {
    return text.slice(0, maxLength);
  }
  return text;
}

export function previewMessageContent(value: unknown, maxLength: number): string {
  if (maxLength <= 0) return "";
  const text = stringifyMessageContent(value).trim();
  if (!text) return "";
  return text.slice(0, maxLength);
}

const FIRESTORE_ARRAY_MARKER = "fsArrayMarker";
const FIRESTORE_ARRAY_ITEMS = "fsArrayItems";
const LEGACY_FIRESTORE_ARRAY_MARKER = "__fs_array__";

function sanitizeArray(value: unknown[]): unknown[] {
  const result: unknown[] = [];
  for (const item of value) {
    if (item === undefined) continue;
    if (Array.isArray(item)) {
      result.push({
        [FIRESTORE_ARRAY_MARKER]: true,
        [FIRESTORE_ARRAY_ITEMS]: sanitizeArray(item),
      });
      continue;
    }
    result.push(sanitizeForFirestore(item));
  }
  return result;
}

function sanitizeObject(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    result[key] = sanitizeForFirestore(item);
  }
  return result;
}

export function sanitizeForFirestore(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return sanitizeArray(value);
  if (typeof value === "object") return sanitizeObject(value as Record<string, unknown>);
  return String(value);
}

function isFirestoreArrayMarker(value: unknown): value is { fsArrayMarker: true; fsArrayItems: unknown[] } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  return keys.length === 2 && obj[FIRESTORE_ARRAY_MARKER] === true && Array.isArray(obj[FIRESTORE_ARRAY_ITEMS]);
}

function isLegacyFirestoreArrayMarker(value: unknown): value is { __fs_array__: unknown } {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length === 1 &&
    LEGACY_FIRESTORE_ARRAY_MARKER in (value as Record<string, unknown>)
  );
}

export function restoreFromFirestore(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => restoreFromFirestore(item));
  }
  if (isFirestoreArrayMarker(value)) {
    const inner = (value as Record<string, unknown>)[FIRESTORE_ARRAY_ITEMS];
    return Array.isArray(inner) ? inner.map(item => restoreFromFirestore(item)) : [];
  }
  if (isLegacyFirestoreArrayMarker(value)) {
    const inner = (value as Record<string, unknown>)[LEGACY_FIRESTORE_ARRAY_MARKER];
    return Array.isArray(inner) ? inner.map(item => restoreFromFirestore(item)) : [];
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = restoreFromFirestore(item);
    }
    return result;
  }
  return value;
}
