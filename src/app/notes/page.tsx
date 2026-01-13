"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import {
  $getRoot,
  CLEAR_EDITOR_COMMAND,
  type LexicalEditor,
  type SerializedEditorState,
} from "lexical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FullFeaturedEditor } from "@/components/full-featured-editor";
import { parseISO } from "date-fns";
import { AppNavigationSelect } from "@/components/app-navigation-select";
import Logo from "@/lib/logo";

type RoughNote = {
  id: string;
  title?: string | null;
  preview: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<RoughNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loadingNote, setLoadingNote] = useState<string | null>(null);

  const noteEditorRef = useRef<LexicalEditor | null>(null);

  const fetchNotes = useCallback(
    async (options?: { skipLoading?: boolean }) => {
      if (!options?.skipLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetch("/api/notes", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sign in to access your rough notes.");
          }
          throw new Error("Unable to load rough notes.");
        }

        const data = await response.json().catch(() => ({} as any));
        setNotes(Array.isArray(data?.notes) ? data.notes : []);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong.");
      } finally {
        if (!options?.skipLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  const openNote = useCallback(async (noteId: string) => {
    setLoadingNote(noteId);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated.");
        }
        throw new Error("Failed to load the selected note.");
      }

      const data = await response.json().catch(() => ({} as any));
      const note = data?.note;
      if (!note?.payload) {
        throw new Error("Note payload is missing.");
      }

      const editor = noteEditorRef.current;
      if (editor) {
        editor.update(() => {
          const parsed = editor.parseEditorState(
            note.payload as SerializedEditorState,
          );
          editor.setEditorState(parsed);
        });
      }

      setCurrentNoteId(noteId);
      setNoteTitle(note.title ?? "");
      toast.success("Loaded note into the editor.");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoadingNote(null);
    }
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const updatedA = a.updatedAt ?? a.createdAt ?? "";
      const updatedB = b.updatedAt ?? b.createdAt ?? "";
      if (updatedA === updatedB) return 0;
      return updatedB.localeCompare(updatedA);
    });
  }, [notes]);

  const formatTimestamp = (value?: string) => {
    if (!value) return null;
    try {
      const parsed = parseISO(value);
      return parsed.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    noteEditorRef.current = editor;
  }, []);

  const handleClearEditor = useCallback(() => {
    const editor = noteEditorRef.current;
    if (!editor) return;
    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    setNoteTitle("");
    setCurrentNoteId(null);
  }, []);

  const handleSaveNote = useCallback(async () => {
    const editor = noteEditorRef.current;
    if (!editor) return;
    const editorState = editor.getEditorState();
    const preview = editorState.read(() => $getRoot().getTextContent()).trim();
    if (!preview) {
      toast.error("Add some content before saving.");
      return;
    }

    const method = currentNoteId ? "PATCH" : "POST";
    const endpoint = currentNoteId
      ? `/api/notes/${encodeURIComponent(currentNoteId)}`
      : "/api/notes";

    setIsSaving(true);
    try {
      const serialized = editorState.toJSON() as SerializedEditorState;
      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: noteTitle.trim() || null,
          preview,
          payload: serialized,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({} as any));
        throw new Error(data?.error ?? "Failed to save rough note.");
      }

      const data = await response.json().catch(() => ({} as any));
      const savedId = data?.noteId ?? currentNoteId;

      toast.success(
        currentNoteId ? "Rough note updated." : "Rough note saved."
      );
      setCurrentNoteId(savedId ?? null);
      void fetchNotes({ skipLoading: true });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save rough note.");
    } finally {
      setIsSaving(false);
    }
  }, [currentNoteId, fetchNotes, noteTitle]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="sticky top-0 z-40 h-12 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-14">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Logo className="h-5 w-5" />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight">
                Rough Notes
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Saved to your Firebase account.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppNavigationSelect
              value="saved"
              onChange={(next) => {
                if (next === "chat") {
                  window.location.href = "/";
                } else if (next === "notes") {
                  window.location.href = "/?view=notes";
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchNotes()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
        <section className="space-y-4 rounded-2xl border bg-card/70 p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {currentNoteId ? "Edit current note" : "Create new rough note"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Everything is saved to your Firebase account.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearEditor}
                  disabled={isSaving}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={handleSaveNote} disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : currentNoteId
                    ? "Update note"
                    : "Save note"}
                </Button>
              </div>
            </div>
            <Input
              placeholder="Title (optional)"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="flex-1 min-h-[480px] rounded-2xl border border-muted/60 bg-background">
            <FullFeaturedEditor
              enableIndexedDBPersistence={false}
              onEditorReady={handleEditorReady}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-muted/50 bg-card/70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">History</p>
              <p className="text-xs text-muted-foreground">
                Browse saved notes and load them into the editor for viewing
                or editing.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHistoryOpen((open) => !open)}
            >
              {historyOpen ? "Hide history" : "Show history"}
            </Button>
          </div>

          {historyOpen && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  Loading notes…
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-dashed border-muted px-4 py-6 text-center text-sm text-muted-foreground">
                  {error}
                </div>
              ) : sortedNotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-muted px-4 py-8 text-center text-sm text-muted-foreground">
                  No rough notes yet.
                </div>
              ) : (
                <ScrollArea className="h-full max-h-[60vh] space-y-3">
                  <div className="space-y-3">
                    {sortedNotes.map((note) => (
                      <Card
                        key={note.id}
                        className={[
                          "rounded-2xl border bg-background shadow-sm",
                          note.id === currentNoteId
                            ? "border-primary"
                            : "border-transparent",
                        ].join(" ")}
                      >
                        <CardHeader className="space-y-1">
                          <CardTitle className="flex items-center justify-between gap-2 text-base">
                            <span>{note.title ?? "Untitled note"}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(note.updatedAt) ?? ""}
                            </span>
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                            {note.preview}
                          </CardDescription>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openNote(note.id)}
                              disabled={Boolean(loadingNote)}
                            >
                              {loadingNote === note.id
                                ? "Loading..."
                                : "Open in editor"}
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
