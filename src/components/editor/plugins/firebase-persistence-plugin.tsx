"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useFirebasePersistence } from "@/components/editor/editor-hooks/use-firebase-persistence";

export function FirebasePersistencePlugin({ storageKey }: { storageKey: string }) {
  const [editor] = useLexicalComposerContext();

  useFirebasePersistence(editor, storageKey);

  return null;
}
