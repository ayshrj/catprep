"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical";

const API_URL = "/api/editor/state";
const SAVE_DEBOUNCE_MS = 500;

async function fetchEditorState(
  key: string,
): Promise<SerializedEditorState | null> {
  try {
    const response = await fetch(`${API_URL}?key=${encodeURIComponent(key)}`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => ({} as any))) as {
      payload?: SerializedEditorState | null;
    };

    return data?.payload && typeof data.payload === "object"
      ? (data.payload as SerializedEditorState)
      : null;
  } catch (error) {
    console.error("Failed to load editor state from Firebase", error);
    return null;
  }
}

async function persistEditorState(
  key: string,
  payload: SerializedEditorState,
) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, payload }),
    });

    if (!response.ok) {
      console.error("Failed to save editor state to Firebase", response.status);
    }
  } catch (error) {
    console.error("Failed to save editor state to Firebase", error);
  }
}

export function useFirebasePersistence(
  editor: LexicalEditor | null,
  storageKey: string,
) {
  const saveTimerRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  const hydrateFromServer = useCallback(async () => {
    if (!editor || hasHydratedRef.current) {
      return;
    }
    try {
      const saved = await fetchEditorState(storageKey);
      if (saved) {
        editor.update(() => {
          const parsed = editor.parseEditorState(saved);
          editor.setEditorState(parsed);
        });
      }
    } finally {
      hasHydratedRef.current = true;
    }
  }, [editor, storageKey]);

  const saveState = useCallback(
    async (editorState: EditorState) => {
      if (!editor) {
        return;
      }
      const serialized = editorState.toJSON() as SerializedEditorState;
      await persistEditorState(storageKey, serialized);
    },
    [editor, storageKey],
  );

  const debouncedSave = useMemo(() => {
    return (state: EditorState) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveState(state);
      }, SAVE_DEBOUNCE_MS);
    };
  }, [saveState]);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }
        debouncedSave(editorState);
      },
    );
  }, [debouncedSave, editor]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);
}
