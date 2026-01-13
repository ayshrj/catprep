import type { IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface EditorDocumentRecord {
  id: string;
  payload: SerializedEditorState;
  updatedAt: number;
}

interface EditorDatabase {
  documents: EditorDocumentRecord;
}

const DB_NAME = "notepad-offline";
const DB_VERSION = 1;
const STORE_NAME = "documents";
const SAVE_DEBOUNCE_MS = 500;

export function useIndexedDBPersistence(editor: LexicalEditor | null, key: string) {
  const dbRef = useRef<IDBPDatabase<EditorDatabase> | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  const openDatabase = useCallback(async () => {
    if (dbRef.current) {
      return dbRef.current;
    }

    dbRef.current = await openDB<EditorDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });

    return dbRef.current;
  }, []);

  const saveState = useCallback(
    async (editorState: EditorState) => {
      if (!editor) {
        return;
      }

      const db = await openDatabase();
      const serialized = editorState.toJSON() as SerializedEditorState;
      await db.put(STORE_NAME, {
        id: key,
        payload: serialized,
        updatedAt: Date.now(),
      });
    },
    [editor, key, openDatabase]
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

  const hydrateFromStorage = useCallback(async () => {
    if (!editor || hasHydratedRef.current) {
      return;
    }

    const db = await openDatabase();
    const record = await db.get(STORE_NAME, key);

    if (record) {
      editor.update(() => {
        const parsed = editor.parseEditorState(record.payload);
        editor.setEditorState(parsed);
      });
    }

    hasHydratedRef.current = true;
  }, [editor, key, openDatabase]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }
      debouncedSave(editorState);
    });
  }, [debouncedSave, editor]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);
}
