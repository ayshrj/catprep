"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Check,
  Laptop,
  MessageSquare,
  Moon,
  Notebook,
  RefreshCcw,
  RotateCcw,
  Settings,
  Sun,
  Trash2,
  PanelLeft,
  X,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Chat } from "@/components/ui/chat";
import { type Message } from "@/components/ui/chat-message";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Notes } from "@/components/notes";
import Logo from "@/lib/logo";

import {
  coerceStoredMessageContent,
  stringifyMessageContent,
} from "@/lib/message-content";
import { cn } from "@/lib/utils";

type Attachment = {
  name?: string;
  contentType?: string;
  url: string;
};

type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type ChatSessionSummary = {
  id: string;
  title?: string | null;
  preview?: string | null;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  contextLength: number | null;
};

type ConfirmAction =
  | { type: "delete-chat"; chatId: string }
  | { type: "clear-chat"; chatId: string }
  | { type: "remove-openrouter-key" };

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function apiJson<TResponse>(
  input: RequestInfo,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof (data as any)?.error === "string"
        ? (data as any).error
        : "Request failed."
    );
  }

  return data as TResponse;
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

async function filesToAttachments(files?: FileList): Promise<Attachment[]> {
  if (!files || files.length === 0) return [];
  const attachments = await Promise.all(
    Array.from(files).map(async (file) => ({
      name: file.name,
      contentType: file.type,
      url: await fileToDataUrl(file),
    }))
  );
  return attachments;
}

function serializeMessageForStorage(message: Message) {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
    ...(message.experimental_attachments
      ? { experimental_attachments: message.experimental_attachments }
      : {}),
  };
}

function hydrateMessageFromStorage(message: any): Message | null {
  if (!message || typeof message !== "object") return null;
  if (typeof message.id !== "string") return null;
  if (typeof message.role !== "string") return null;
  const content = coerceStoredMessageContent(message.content);
  if (content === null) return null;

  return {
    id: message.id,
    role: message.role,
    content,
    createdAt:
      typeof message.createdAt === "string"
        ? new Date(message.createdAt)
        : undefined,
    experimental_attachments: Array.isArray(message.experimental_attachments)
      ? message.experimental_attachments
      : undefined,
  };
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const current = theme ?? "system";
  const next =
    current === "system" ? "light" : current === "light" ? "dark" : "system";

  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Laptop;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Theme: ${current}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function formatWhen(updatedAt?: string) {
  if (!updatedAt) return "";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chatIdFromUrl = searchParams.get("chatId")?.trim() || null;

  const [showNotes, setShowNotes] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const pendingReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const assistantAbortRef = useRef<AbortController | null>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const confirmOpen = confirmAction !== null;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openRouterStatus, setOpenRouterStatus] = useState<{
    hasKey: boolean;
    last4: string | null;
  }>({ hasKey: false, last4: null });
  const [openRouterModel, setOpenRouterModel] = useState("");
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);

  const suggestions = useMemo(
    () => [
      "Summarize what this UI can do.",
      "Write a short markdown message with a code block.",
      "Pretend you are a helpful assistant for this chat app.",
    ],
    []
  );

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const data = await apiJson<{ user: SessionUser | null }>(
        "/api/auth/session"
      );
      setSessionUser(data.user);
    } catch (error) {
      console.error(error);
      setSessionUser(null);
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!sessionUser) return;
    if (!activeChatId) return;
    try {
      const data = await apiJson<{ messages: any[] }>(
        `/api/chat/history?chatId=${encodeURIComponent(activeChatId)}`,
        { method: "GET" }
      );
      const hydrated = (data.messages ?? [])
        .map(hydrateMessageFromStorage)
        .filter((message): message is Message => message !== null);
      setMessages(hydrated);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? "Failed to load chat history.");
    }
  }, [activeChatId, sessionUser]);

  const loadSessions = useCallback(async () => {
    if (!sessionUser) return;
    try {
      const data = await apiJson<{ sessions: ChatSessionSummary[] }>(
        `/api/chat/sessions${showArchived ? "?includeArchived=1" : ""}`,
        { method: "GET" }
      );
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (error) {
      console.error(error);
      setSessions([]);
    }
  }, [sessionUser, showArchived]);

  const loadOpenRouterSettings = useCallback(async () => {
    if (!sessionUser) return;
    setIsSettingsLoading(true);
    try {
      const data = await apiJson<{
        hasKey: boolean;
        last4: string | null;
        model: string | null;
      }>("/api/settings/openrouter", { method: "GET" });
      setOpenRouterStatus({
        hasKey: Boolean(data.hasKey),
        last4: typeof data.last4 === "string" ? data.last4 : null,
      });
      setOpenRouterModel(typeof data.model === "string" ? data.model : "");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? "Failed to load settings.");
    } finally {
      setIsSettingsLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionUser) {
      setMessages([]);
      setActiveChatId(null);
      activeChatIdRef.current = null;
      return;
    }
    loadSessions();
    loadOpenRouterSettings();
  }, [loadOpenRouterSettings, loadSessions, sessionUser]);

  useEffect(() => {
    if (chatIdFromUrl === activeChatIdRef.current) return;

    setActiveChatId(chatIdFromUrl);
    activeChatIdRef.current = chatIdFromUrl;

    setMessages([]);
    setIsGenerating(false);
    if (pendingReplyTimeoutRef.current) {
      clearTimeout(pendingReplyTimeoutRef.current);
      pendingReplyTimeoutRef.current = null;
    }
  }, [chatIdFromUrl]);

  useEffect(() => {
    if (!sessionUser) return;
    if (!activeChatId) return;
    loadHistory();
  }, [activeChatId, loadHistory, sessionUser]);

  useEffect(() => {
    if (!settingsOpen) return;
    if (!sessionUser) return;
    loadOpenRouterSettings();
  }, [loadOpenRouterSettings, sessionUser, settingsOpen]);

  const stop = useCallback(() => {
    if (pendingReplyTimeoutRef.current) {
      clearTimeout(pendingReplyTimeoutRef.current);
      pendingReplyTimeoutRef.current = null;
    }
    if (assistantAbortRef.current) {
      assistantAbortRef.current.abort();
      assistantAbortRef.current = null;
    }
    setIsGenerating(false);
    toast.info("Stopped generating.");
  }, []);

  const persistMessages = useCallback(
    async (chatId: string, items: Message[]) => {
      if (!sessionUser) return;
      try {
        await apiJson<{ ok: true }>(
          `/api/chat/history?chatId=${encodeURIComponent(chatId)}`,
          {
            method: "POST",
            body: JSON.stringify({
              messages: items.map(serializeMessageForStorage),
            }),
          }
        );
        await loadSessions();
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message ?? "Failed to persist chat history.");
      }
    },
    [loadSessions, sessionUser]
  );

  const createChatSession = useCallback(async (firstUserText: string) => {
    const title = firstUserText.trim().slice(0, 80);
    const data = await apiJson<{ chatId: string }>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title, preview: firstUserText }),
    });

    const chatId = data.chatId;
    if (!chatId) {
      throw new Error("Failed to create chat session.");
    }

    return chatId;
  }, []);

  const generateAssistantMessage = useCallback(
    async (chatId: string) => {
      if (!openRouterStatus.hasKey) {
        toast.error("Add your OpenRouter API key in Settings first.");
        setIsGenerating(false);
        return;
      }
      if (!openRouterModel.trim()) {
        toast.error("Select an OpenRouter model first.");
        setIsGenerating(false);
        return;
      }

      if (assistantAbortRef.current) assistantAbortRef.current.abort();
      const controller = new AbortController();
      assistantAbortRef.current = controller;

      try {
        const response = await fetch("/api/cat/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof (data as any)?.error === "string"
              ? (data as any).error
              : "Request failed."
          );
        }

        const content = coerceStoredMessageContent(
          (data as any)?.message?.content
        );
        const contentText = stringifyMessageContent(content);
        if (!contentText.trim()) throw new Error("Empty response from model.");

        const assistant: Message = {
          id: createId(),
          role: "assistant",
          createdAt: new Date(),
          content: content ?? "",
        };

        setMessages((current) => [...current, assistant]);
        await persistMessages(chatId, [assistant]);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        toast.error(error?.message ?? "Failed to generate response.");
      } finally {
        if (assistantAbortRef.current === controller)
          assistantAbortRef.current = null;
        setIsGenerating(false);
      }
    },
    [openRouterModel, openRouterStatus.hasKey, persistMessages]
  );

  const sendUserMessage = useCallback(
    async (content: string, files?: FileList) => {
      if (pendingReplyTimeoutRef.current) {
        clearTimeout(pendingReplyTimeoutRef.current);
        pendingReplyTimeoutRef.current = null;
      }

      const attachments = await filesToAttachments(files);
      const existingChatId = activeChatIdRef.current ?? chatIdFromUrl;
      const isNewSession = !existingChatId;
      const chatId = existingChatId ?? (await createChatSession(content));

      const userMessage: Message = {
        id: createId(),
        role: "user",
        createdAt: new Date(),
        content,
        experimental_attachments:
          attachments.length > 0 ? (attachments as any) : undefined,
      };

      setMessages((current) => [...current, userMessage]);
      await persistMessages(chatId, [userMessage]);

      if (isNewSession) {
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);

        const params = new URLSearchParams(searchParams.toString());
        params.set("chatId", chatId);
        router.replace(`/?${params.toString()}`);
      }

      setIsGenerating(true);
      pendingReplyTimeoutRef.current = setTimeout(() => {
        void generateAssistantMessage(chatId);
        pendingReplyTimeoutRef.current = null;
      }, 50);
    },
    [
      chatIdFromUrl,
      createChatSession,
      generateAssistantMessage,
      persistMessages,
      router,
      searchParams,
    ]
  );

  const handleSubmit = useCallback(
    async (
      event?: { preventDefault?: () => void },
      options?: { experimental_attachments?: FileList }
    ) => {
      event?.preventDefault?.();
      const text = input.trim();
      const files = options?.experimental_attachments;
      if (!text && (!files || files.length === 0)) return;
      setInput("");
      await sendUserMessage(text, files);
    },
    [input, sendUserMessage]
  );

  const append = useCallback(
    async (message: { role: "user"; content: string }) => {
      if (message.role !== "user") return;
      setInput("");
      await sendUserMessage(message.content, undefined);
    },
    [sendUserMessage]
  );

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> =
    useCallback((event) => setInput(event.target.value), []);

  const handleAuthSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsAuthSubmitting(true);
      try {
        const endpoint =
          authMode === "login" ? "/api/auth/login" : "/api/auth/register";

        const payload =
          authMode === "login"
            ? { email: authEmail, password: authPassword }
            : {
                email: authEmail,
                password: authPassword,
                displayName: authDisplayName,
              };

        const data = await apiJson<{ user: SessionUser }>(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSessionUser(data.user);
        await loadSessions();
        toast.success(authMode === "login" ? "Signed in." : "Account created.");
      } catch (error: any) {
        toast.error(error?.message ?? "Authentication failed.");
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [authDisplayName, authEmail, authMode, authPassword, loadSessions]
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiJson<{ ok: true }>("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    } finally {
      setSessionUser(null);
      setMessages([]);
      toast.success("Signed out.");
    }
  }, []);

  const clearHistory = useCallback(
    async (chatId: string) => {
      setMessages([]);
      await apiJson<{ ok: true }>(
        `/api/chat/history?chatId=${encodeURIComponent(chatId)}`,
        { method: "DELETE" }
      );
      toast.success("Cleared chat history.");
      await loadSessions();
    },
    [loadSessions]
  );

  const handleNewChat = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("chatId");
    const suffix = params.toString();
    router.push(suffix ? `/?${suffix}` : "/");
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setMessages([]);
    setIsGenerating(false);
  }, [router, searchParams]);

  const openChat = useCallback(
    (chatId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("chatId", chatId);
      router.push(`/?${params.toString()}`);
      setHistoryOpen(false);
    },
    [router, searchParams]
  );

  const saveOpenRouterKey = useCallback(async () => {
    const key = openRouterKeyInput.trim();
    if (!key) {
      toast.error("OpenRouter key is required.");
      return;
    }

    setIsSettingsSaving(true);
    try {
      await apiJson<{ ok: true }>("/api/settings/openrouter", {
        method: "POST",
        body: JSON.stringify({ key }),
      });
      setOpenRouterKeyInput("");
      toast.success("OpenRouter key saved.");
      await loadOpenRouterSettings();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save key.");
    } finally {
      setIsSettingsSaving(false);
    }
  }, [loadOpenRouterSettings, openRouterKeyInput]);

  const removeOpenRouterKey = useCallback(async () => {
    setIsSettingsSaving(true);
    try {
      await apiJson<{ ok: true }>("/api/settings/openrouter", {
        method: "DELETE",
      });
      toast.success("OpenRouter key removed.");
      await loadOpenRouterSettings();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to remove key.");
    } finally {
      setIsSettingsSaving(false);
    }
  }, [loadOpenRouterSettings]);

  const saveOpenRouterModel = useCallback(
    async (model: string) => {
      const trimmed = model.trim();
      if (!trimmed) return;

      setIsSettingsSaving(true);
      try {
        await apiJson<{ ok: true }>("/api/settings/openrouter", {
          method: "PATCH",
          body: JSON.stringify({ model: trimmed }),
        });
        setOpenRouterModel(trimmed);
        toast.success("Model saved.");
        await loadOpenRouterSettings();
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to save model.");
      } finally {
        setIsSettingsSaving(false);
      }
    },
    [loadOpenRouterSettings]
  );

  const canFetchModels = openRouterStatus.hasKey;

  const fetchModels = useCallback(async () => {
    if (modelsLoading) return;
    if (!canFetchModels) {
      setModelsError("Add your OpenRouter API key first.");
      return;
    }

    setModelsError("");
    setModelsLoading(true);
    try {
      const response = await fetch("/api/openrouter/models", {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof (data as any)?.error === "string"
            ? (data as any).error
            : "Failed to load models."
        );
      }

      const nextModels = Array.isArray((data as any).models)
        ? ((data as any).models as OpenRouterModel[])
        : [];
      setModels(nextModels);

      if (!openRouterModel && nextModels[0]?.id) {
        await saveOpenRouterModel(nextModels[0].id);
      }
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : "Unable to fetch models.";
      setModelsError(message);
      toast.error(message);
    } finally {
      setModelsLoading(false);
    }
  }, [canFetchModels, modelsLoading, openRouterModel, saveOpenRouterModel]);

  const setArchived = useCallback(
    async (chatId: string, archived: boolean) => {
      try {
        await apiJson<{ ok: true }>(`/api/chat/sessions/${chatId}`, {
          method: "PATCH",
          body: JSON.stringify({ archived }),
        });

        toast.success(archived ? "Chat archived." : "Chat restored.");
        await loadSessions();

        if (archived && chatId === activeChatId && !showArchived) {
          handleNewChat();
        }
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to update chat.");
      }
    },
    [activeChatId, handleNewChat, loadSessions, showArchived]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await apiJson<{ ok: true }>(`/api/chat/sessions/${chatId}`, {
          method: "DELETE",
        });
        toast.success("Chat deleted.");
        await loadSessions();
        if (chatId === activeChatId) handleNewChat();
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to delete chat.");
      }
    },
    [activeChatId, handleNewChat, loadSessions]
  );

  const onConfirm = useCallback(async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === "delete-chat") {
        await deleteChat(confirmAction.chatId);
      } else if (confirmAction.type === "clear-chat") {
        await clearHistory(confirmAction.chatId);
      } else if (confirmAction.type === "remove-openrouter-key") {
        await removeOpenRouterKey();
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Action failed.");
    } finally {
      setConfirmAction(null);
    }
  }, [clearHistory, confirmAction, deleteChat, removeOpenRouterKey]);

  const historyActions = (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowArchived((v) => !v)}
      >
        {showArchived ? "Hide archived" : "Show archived"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={loadSessions}>
        Refresh
      </Button>
    </div>
  );

  const renderSessionItems = (opts?: { compact?: boolean }) => {
    if (sessions.length === 0) {
      return <p className="text-xs text-muted-foreground">No chats yet.</p>;
    }

    return sessions.map((session) => {
      const isActive = session.id === activeChatId;
      const label =
        session.title || session.preview || `Chat ${session.id.slice(0, 8)}`;

      return (
        <div
          key={session.id}
          className={[
            "group flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
            isActive ? "border-primary bg-primary/5" : "hover:bg-muted",
          ].join(" ")}
        >
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => openChat(session.id)}
          >
            <div className="line-clamp-2">{label}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              {session.archived ? (
                <span className="rounded border px-1 py-0.5">archived</span>
              ) : null}
              {session.updatedAt ? (
                <span>{formatWhen(session.updatedAt)}</span>
              ) : null}
            </div>
          </button>

          <div
            className={[
              "flex shrink-0 gap-1 transition-opacity",
              opts?.compact
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
          >
            {session.archived ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Restore chat"
                onClick={() => setArchived(session.id, false)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Archive chat"
                onClick={() => setArchived(session.id, true)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete chat"
              onClick={() =>
                setConfirmAction({
                  type: "delete-chat",
                  chatId: session.id,
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    });
  };

  const CONTENT_H = "h-[calc(100dvh-49px)] md:h-[calc(100dvh-57px)]";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="sticky top-0 z-40 h-12 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-14">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {sessionUser ? (
              <div className="md:hidden">
                <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="History"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[92vw] max-w-[22rem] p-0"
                  >
                    <div className="flex h-dvh flex-col">
                      <SheetHeader className="border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-base">History</SheetTitle>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {historyActions}
                        </div>
                      </SheetHeader>

                      <div className="min-h-0 flex-1 px-3 py-3">
                        <ScrollArea className="h-full">
                          <div className="space-y-1 pr-2">
                            {renderSessionItems({ compact: true })}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="border-t p-3">
                        <Button
                          className="w-full"
                          type="button"
                          onClick={handleNewChat}
                        >
                          New chat
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ) : null}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Logo className="h-5 w-5" />
                <div className="truncate text-base font-semibold tracking-tight">
                  Cat99
                </div>
              </div>
              {sessionUser ? (
                <div className="truncate text-[11px] text-muted-foreground">
                  {sessionUser.email ?? sessionUser.uid}
                </div>
              ) : null}
            </div>
          </div>

          {sessionUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModelPickerOpen(true)}
                  disabled={models.length === 0 || isSettingsSaving}
                  className="min-w-0 max-w-full shrink truncate md:max-w-[18rem]"
                >
                  {openRouterModel ? openRouterModel : "Select Model"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchModels}
                  disabled={modelsLoading || isSettingsSaving}
                >
                  <RefreshCcw
                    className={
                      modelsLoading
                        ? "mr-2 h-4 w-4 animate-spin"
                        : "mr-2 h-4 w-4"
                    }
                  />
                  Select
                </Button>

                <Button
                  onClick={() => setShowNotes((notes) => !notes)}
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={showNotes ? "Show chat" : "Show notes"}
                >
                  {!showNotes ? (
                    <Notebook className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>

                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                      <DialogDescription>
                        Saved to your Firebase account.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="openrouter-key">
                          OpenRouter API key
                        </Label>
                        {openRouterStatus.hasKey ? (
                          <span className="text-xs text-muted-foreground">
                            saved
                            {openRouterStatus.last4
                              ? ` ••••${openRouterStatus.last4}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            not set
                          </span>
                        )}
                      </div>

                      <Input
                        id="openrouter-key"
                        type="password"
                        placeholder="sk-or-..."
                        value={openRouterKeyInput}
                        onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                        disabled={isSettingsLoading || isSettingsSaving}
                      />

                      <Alert>
                        <AlertDescription>
                          Stored server-side. It is not displayed back in full.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <DialogFooter>
                      {openRouterStatus.hasKey ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSettingsOpen(false);
                            setConfirmAction({ type: "remove-openrouter-key" });
                          }}
                          disabled={isSettingsSaving}
                        >
                          Remove key
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        onClick={saveOpenRouterKey}
                        disabled={isSettingsLoading || isSettingsSaving}
                      >
                        {isSettingsSaving ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <ThemeToggleButton />
                <Button type="button" variant="outline" onClick={handleNewChat}>
                  New chat
                </Button>
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setModelPickerOpen(true)}
                      disabled={models.length === 0 || isSettingsSaving}
                    >
                      Select model
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={fetchModels}
                      disabled={modelsLoading || isSettingsSaving}
                    >
                      {modelsLoading ? "Fetching models..." : "Fetch models"}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setShowNotes((v) => !v)}>
                      {showNotes ? "Show chat" : "Show notes"}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleNewChat}>
                      New chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <div className="flex w-full items-center justify-between">
                        <span>Theme</span>
                        <ThemeToggleButton />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                      <DialogDescription>
                        Saved to your Firebase account.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="openrouter-key-mobile">
                          OpenRouter API key
                        </Label>
                        {openRouterStatus.hasKey ? (
                          <span className="text-xs text-muted-foreground">
                            saved
                            {openRouterStatus.last4
                              ? ` ••••${openRouterStatus.last4}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            not set
                          </span>
                        )}
                      </div>

                      <Input
                        id="openrouter-key-mobile"
                        type="password"
                        placeholder="sk-or-..."
                        value={openRouterKeyInput}
                        onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                        disabled={isSettingsLoading || isSettingsSaving}
                      />

                      <Alert>
                        <AlertDescription>
                          Stored server-side. It is not displayed back in full.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <DialogFooter>
                      {openRouterStatus.hasKey ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSettingsOpen(false);
                            setConfirmAction({ type: "remove-openrouter-key" });
                          }}
                          disabled={isSettingsSaving}
                        >
                          Remove key
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        onClick={saveOpenRouterKey}
                        disabled={isSettingsLoading || isSettingsSaving}
                      >
                        {isSettingsSaving ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("mx-auto w-full max-w-7xl px-3 sm:px-6", CONTENT_H)}>
        <div className="h-full py-3 sm:py-4">
          {isSessionLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : sessionUser ? (
            showNotes ? (
              <div className="h-full min-h-0 overflow-hidden rounded-2xl border bg-background shadow-sm">
                <Notes />
              </div>
            ) : (
              <section className="grid h-full grid-cols-1 gap-3 overflow-hidden md:grid-cols-[18rem_1fr] md:gap-4">
                <aside className="hidden h-full flex-col gap-2 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm md:flex">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      History
                    </p>
                    {historyActions}
                  </div>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-1 pr-2">{renderSessionItems()}</div>
                  </ScrollArea>
                </aside>

                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
                    <p className="truncate text-xs text-muted-foreground">
                      {activeChatId ? (
                        <>
                          Conversation{" "}
                          <span className="font-mono">{activeChatId}</span>
                        </>
                      ) : (
                        "New conversation"
                      )}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!activeChatId) return;
                        setConfirmAction({
                          type: "clear-chat",
                          chatId: activeChatId,
                        });
                      }}
                      disabled={!activeChatId}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1">
                    <Chat
                      className="h-full px-2 pt-2"
                      messages={messages}
                      input={input}
                      handleInputChange={handleInputChange}
                      handleSubmit={handleSubmit}
                      isGenerating={isGenerating}
                      stop={stop}
                      setMessages={setMessages}
                      append={append}
                      suggestions={suggestions}
                      onRateResponse={(messageId, rating) => {
                        toast.success(`Rated ${rating} on ${messageId}`);
                      }}
                    />
                  </div>
                </div>
              </section>
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle>
                        {authMode === "login" ? "Sign in" : "Create account"}
                      </CardTitle>
                      <CardDescription>
                        Email + password (Firebase Auth).
                      </CardDescription>
                    </div>
                    <ThemeToggleButton />
                  </div>
                </CardHeader>

                <CardContent>
                  <form className="space-y-3" onSubmit={handleAuthSubmit}>
                    {authMode === "register" ? (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Display name
                        </label>
                        <Input
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName(e.target.value)}
                          placeholder="Ayush"
                          autoComplete="name"
                        />
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        autoComplete={
                          authMode === "login"
                            ? "current-password"
                            : "new-password"
                        }
                        required
                      />
                    </div>

                    <Button
                      className="w-full"
                      type="submit"
                      disabled={isAuthSubmitting}
                    >
                      {isAuthSubmitting
                        ? "Please wait..."
                        : authMode === "login"
                        ? "Sign in"
                        : "Create account"}
                    </Button>
                  </form>
                </CardContent>

                <CardFooter className="justify-between">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAuthMode((m) => (m === "login" ? "register" : "login"))
                    }
                  >
                    {authMode === "login"
                      ? "Need an account?"
                      : "Already have an account?"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={loadSession}
                  >
                    Refresh
                  </button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CommandDialog
        open={modelPickerOpen}
        onOpenChange={(open) => {
          setModelPickerOpen(open);
          if (!open) setModelSearch("");
        }}
        title="OpenRouter model"
        description="Search and select a model."
      >
        <CommandInput
          placeholder="Search models..."
          value={modelSearch}
          onValueChange={setModelSearch}
        />
        <CommandList>
          <CommandEmpty>
            {models.length === 0
              ? "No models loaded. Click Fetch models."
              : "No models found."}
          </CommandEmpty>

          {modelsError ? (
            <div className="px-3 py-2 text-xs text-destructive">
              {modelsError}
            </div>
          ) : null}

          <CommandGroup heading="Models">
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={`${model.name ?? ""} ${model.id}`}
                onSelect={() => {
                  void saveOpenRouterModel(model.id);
                  setModelPickerOpen(false);
                }}
              >
                <Check
                  className={
                    model.id === openRouterModel
                      ? "h-4 w-4"
                      : "h-4 w-4 opacity-0"
                  }
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {model.name || model.id}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {model.id}
                    {model.contextLength
                      ? ` • ${model.contextLength.toLocaleString()} ctx`
                      : ""}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete-chat"
                ? "Delete chat?"
                : confirmAction?.type === "clear-chat"
                ? "Clear chat history?"
                : "Remove OpenRouter key?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete-chat"
                ? "This deletes the chat session and all messages permanently."
                : confirmAction?.type === "clear-chat"
                ? "This deletes all messages in this chat permanently."
                : "This removes the stored key from your account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettingsSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={onConfirm}
              disabled={isSettingsSaving}
            >
              {confirmAction?.type === "delete-chat"
                ? "Delete"
                : confirmAction?.type === "clear-chat"
                ? "Clear"
                : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
