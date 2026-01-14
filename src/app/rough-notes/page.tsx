"use client";

import { $convertToMarkdownString } from "@lexical/markdown";
import { parseISO } from "date-fns";
import { $getRoot, CLEAR_EDITOR_COMMAND, type LexicalEditor, type SerializedEditorState } from "lexical";
import { MoreVertical, PanelLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavigationSelect } from "@/components/app-navigation-select";
import { AppSidebar } from "@/components/app-sidebar";
import { MARKDOWN_TRANSFORMERS } from "@/components/editor/markdown-transformers";
import { FullFeaturedEditor } from "@/components/full-featured-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [previewMarkdown, setPreviewMarkdown] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<RoughNote | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const noteEditorRef = useRef<LexicalEditor | null>(null);

  const fetchNotes = useCallback(async (options?: { skipLoading?: boolean }) => {
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

      const data = await response.json().catch(() => ({}) as any);
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      if (!options?.skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  const refreshPreview = useCallback(() => {
    const editor = noteEditorRef.current;
    if (!editor) return;
    const markdown = editor
      .getEditorState()
      .read(() => $convertToMarkdownString(MARKDOWN_TRANSFORMERS, undefined, true));
    setPreviewMarkdown(markdown);
  }, []);

  const openNote = useCallback(
    async (noteId: string) => {
      setLoadingNote(noteId);
      setError(null);
      setViewMode("view");
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

        const data = await response.json().catch(() => ({}) as any);
        const note = data?.note;
        if (!note?.payload) {
          throw new Error("Note payload is missing.");
        }

        const editor = noteEditorRef.current;
        if (editor) {
          editor.update(() => {
            const parsed = editor.parseEditorState(note.payload as SerializedEditorState);
            editor.setEditorState(parsed);
          });
          refreshPreview();
        }

        setCurrentNoteId(noteId);
        setNoteTitle(note.title ?? "");
        toast.success("Loaded note into the editor.");
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong.");
      } finally {
        setLoadingNote(null);
      }
    },
    [refreshPreview]
  );

  const openNoteFromSheet = useCallback(
    (noteId: string) => {
      void openNote(noteId);
      setHistorySheetOpen(false);
    },
    [openNote]
  );

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

  const renderHistoryList = (onOpenNote: (noteId: string) => void, options?: { ignoreCollapsed?: boolean }) => {
    if (!historyOpen && !options?.ignoreCollapsed) {
      return (
        <div className="rounded-2xl border border-dashed border-muted px-4 py-6 text-center text-xs text-muted-foreground">
          History hidden.
        </div>
      );
    }

    return (
      <>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading notes…</div>
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
              {sortedNotes.map(note => (
                <Card
                  key={note.id}
                  className={[
                    "rounded-2xl border bg-background shadow-sm",
                    note.id === currentNoteId ? "border-primary" : "border-transparent",
                  ].join(" ")}
                >
                  <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span>{note.title ?? "Untitled note"}</span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(note.updatedAt) ?? ""}</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                      {note.preview}
                    </CardDescription>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenNote(note.id)}
                        disabled={Boolean(loadingNote) || isDeletingNote}
                      >
                        {loadingNote === note.id ? "Loading..." : "View"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setNoteToDelete(note)}
                        disabled={isDeletingNote}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </>
    );
  };

  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    noteEditorRef.current = editor;
  }, []);

  const handleClearEditor = useCallback(() => {
    const editor = noteEditorRef.current;
    if (editor) {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    }
    setNoteTitle("");
    setCurrentNoteId(null);
    setPreviewMarkdown("");
    setViewMode("edit");
  }, []);

  const handleNewNote = useCallback(() => {
    handleClearEditor();
  }, [handleClearEditor]);

  const handleViewModeChange = useCallback(
    (next: "edit" | "view") => {
      setViewMode(next);
      if (next === "view") {
        refreshPreview();
      }
    },
    [refreshPreview]
  );

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
    const endpoint = currentNoteId ? `/api/notes/${encodeURIComponent(currentNoteId)}` : "/api/notes";

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
        const data = await response.json().catch(() => ({}) as any);
        throw new Error(data?.error ?? "Failed to save rough note.");
      }

      const data = await response.json().catch(() => ({}) as any);
      const savedId = data?.noteId ?? currentNoteId;

      toast.success(currentNoteId ? "Rough note updated." : "Rough note saved.");
      setCurrentNoteId(savedId ?? null);
      void fetchNotes({ skipLoading: true });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save rough note.");
    } finally {
      setIsSaving(false);
    }
  }, [currentNoteId, fetchNotes, noteTitle]);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      setIsDeletingNote(true);
      try {
        const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}) as any);
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to delete rough note.");
        }
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (currentNoteId === noteId) {
          handleClearEditor();
        }
        toast.success("Rough note deleted.");
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to delete rough note.");
      } finally {
        setIsDeletingNote(false);
        setNoteToDelete(null);
      }
    },
    [currentNoteId, handleClearEditor]
  );

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      setHistoryOpen(false);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Rough Notes"
        subtitle="Saved to your account."
        leading={
          <div className="md:hidden">
            <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="History">
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Rough notes history</SheetTitle>
                </SheetHeader>
                <AppSidebar
                  title="History"
                  actions={
                    <Button
                      size="sm"
                      onClick={() => {
                        handleNewNote();
                        setHistorySheetOpen(false);
                      }}
                    >
                      New note
                    </Button>
                  }
                  className="h-full w-full rounded-none border-0 shadow-none"
                  contentClassName="p-0"
                >
                  <div className="p-3">
                    {renderHistoryList(openNoteFromSheet, {
                      ignoreCollapsed: true,
                    })}
                  </div>
                </AppSidebar>
              </SheetContent>
            </Sheet>
          </div>
        }
        trailing={
          <>
            <div className="hidden items-center gap-2 md:flex">
              <AppNavigationSelect
                value="saved"
                onChange={next => {
                  if (next === "chat") {
                    window.location.href = "/";
                  } else if (next === "notes") {
                    window.location.href = "/notes";
                  } else if (next === "games") {
                    window.location.href = "/games";
                  }
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="Menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Pages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/")}>Chat</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/notes")}>Notes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/rough-notes")}>
                    Rough notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/games")}>Games</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void fetchNotes()}>Refresh</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="Menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Pages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/")}>Chat</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/notes")}>Notes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/rough-notes")}>
                    Rough notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/games")}>Games</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void fetchNotes()}>Refresh</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full py-3 sm:py-4">
          <main className="flex h-full min-h-0 flex-col gap-6">
            <div className="grid h-full min-h-0 gap-3 overflow-hidden md:grid-cols-[18rem_1fr] md:gap-4">
              <AppSidebar
                title="History"
                actions={
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleNewNote}>
                      New note
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setHistoryOpen(open => !open)}>
                      {historyOpen ? "Hide history" : "Show history"}
                    </Button>
                  </div>
                }
                className="hidden md:order-1 md:flex"
                contentClassName="p-0"
              >
                <div className="space-y-3 p-4">
                  <p className="text-xs text-muted-foreground">
                    Browse saved notes and load them into the editor for viewing or editing.
                  </p>
                  {renderHistoryList(openNote)}
                </div>
              </AppSidebar>

              <section className="order-1 flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm md:order-2 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {currentNoteId
                          ? viewMode === "view"
                            ? "View current note"
                            : "Edit current note"
                          : viewMode === "view"
                            ? "View rough notes"
                            : "Create new rough note"}
                      </p>
                      <p className="hidden text-xs text-muted-foreground sm:block">
                        Everything is saved to your account.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
                      <div className="inline-flex rounded-full border bg-background p-1">
                        <Button
                          size="sm"
                          variant={viewMode === "edit" ? "default" : "ghost"}
                          onClick={() => handleViewModeChange("edit")}
                          className="h-7 px-3"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === "view" ? "default" : "ghost"}
                          onClick={() => handleViewModeChange("view")}
                          className="h-7 px-3"
                        >
                          View
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleNewNote} disabled={isSaving}>
                        New note
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearEditor} disabled={isSaving}>
                        Clear
                      </Button>
                      <Button size="sm" onClick={handleSaveNote} disabled={isSaving}>
                        {isSaving ? "Saving..." : currentNoteId ? "Update note" : "Save note"}
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder="Title (optional)"
                    value={noteTitle}
                    onChange={event => setNoteTitle(event.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-muted/60 bg-background">
                  <div className={viewMode === "edit" ? "flex min-h-0 flex-1" : "hidden"}>
                    <FullFeaturedEditor enableIndexedDBPersistence={false} onEditorReady={handleEditorReady} />
                  </div>
                  <div className={viewMode === "view" ? "flex min-h-0 flex-1" : "hidden"}>
                    <ScrollArea className="h-full w-full">
                      <div className="p-4 sm:p-6">
                        {previewMarkdown.trim() ? (
                          <MarkdownRenderer>{previewMarkdown}</MarkdownRenderer>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nothing to view yet.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </AppContent>

      <AlertDialog
        open={Boolean(noteToDelete)}
        onOpenChange={open => {
          if (!open) setNoteToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rough note?</AlertDialogTitle>
            <AlertDialogDescription>
              {noteToDelete?.title
                ? `Delete "${noteToDelete.title}" and its Cloudinary images?`
                : "Delete this rough note and its Cloudinary images?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingNote}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => (noteToDelete ? handleDeleteNote(noteToDelete.id) : undefined)}
              disabled={isDeletingNote}
            >
              {isDeletingNote ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
