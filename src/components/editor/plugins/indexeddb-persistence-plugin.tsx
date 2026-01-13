"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useIndexedDBPersistence } from "@/components/editor/editor-hooks/use-indexeddb-persistence";

export function IndexedDBPersistencePlugin({ storageKey }: { storageKey: string }) {
  const [editor] = useLexicalComposerContext();

  useIndexedDBPersistence(editor, storageKey);

  return null;
}
