"use client";

import type { SerializedEditorState } from "lexical";
import {
  Archive,
  Check,
  Download,
  HelpCircle,
  Laptop,
  Moon,
  PanelLeft,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { AppSidebar } from "@/components/app-sidebar";
import { Notes } from "@/components/notes";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chat } from "@/components/ui/chat";
import { type Message } from "@/components/ui/chat-message";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogFooter, DialogShell } from "@/components/ui/dialog";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelIcon } from "@/components/ui/model-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CAT_KB_PARTS } from "@/lib/cat";
import { uploadImageToCloudinary } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import { type LlmCatCoachResponse } from "@/types/llm-response";
import { isLlmCatCoachResponse } from "@/utils/llm-response";
import { coerceStoredMessageContent, stringifyMessageContent } from "@/utils/message-content";

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

async function apiJson<TResponse>(input: RequestInfo, init?: RequestInit): Promise<TResponse> {
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
    throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Request failed.");
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

function isTextFile(file: File) {
  if (file.type.startsWith("text/")) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv");
}

async function prepareChatAttachments(files?: FileList): Promise<{
  attachments: Attachment[];
  extractedText: string;
}> {
  if (!files || files.length === 0) {
    return { attachments: [], extractedText: "" };
  }

  const extractedChunks: string[] = [];
  const attachments: Attachment[] = [];

  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) {
      try {
        const { url, text, ocr } = await uploadImageToCloudinary(file, {
          folder: "cat99/chat",
          ocr: true,
        });
        attachments.push({
          name: file.name,
          contentType: file.type,
          url,
        });
        if (ocr) {
          if (text?.trim()) {
            extractedChunks.push(`From ${file.name}:\n${text.trim()}`);
          } else {
            extractedChunks.push(`From ${file.name}:\n(no text detected)`);
          }
        }
      } catch (error: any) {
        console.error("Image upload failed", error);
        toast.error(error?.message ?? "Image upload failed.");
      }
      continue;
    }

    if (isTextFile(file)) {
      try {
        const text = await file.text();
        if (text.trim()) {
          extractedChunks.push(`From ${file.name}:\n${text.trim()}`);
        }
        const url = await fileToDataUrl(file);
        attachments.push({
          name: file.name,
          contentType: file.type || "text/plain",
          url,
        });
      } catch (error) {
        console.error("Failed to read text file", error);
      }
    }
  }

  return {
    attachments,
    extractedText: extractedChunks.join("\n\n"),
  };
}

function serializeMessageForStorage(message: Message) {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
    ...(message.experimental_attachments ? { experimental_attachments: message.experimental_attachments } : {}),
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
    createdAt: typeof message.createdAt === "string" ? new Date(message.createdAt) : undefined,
    experimental_attachments: Array.isArray(message.experimental_attachments)
      ? message.experimental_attachments
      : undefined,
  };
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const current = theme ?? "system";
  const next = current === "system" ? "light" : current === "light" ? "dark" : "system";

  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Laptop;

  return (
    <Button type="button" variant="outline" size="icon" aria-label={`Theme: ${current}`} onClick={() => setTheme(next)}>
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

  const initialMode = searchParams.get("view") === "notes" ? ("notes" as const) : ("chat" as const);
  const [homeMode, setHomeMode] = useState<"chat" | "notes">(initialMode);
  const [navigationValue, setNavigationValue] = useState<"chat" | "notes" | "saved" | "games">(initialMode);
  const handleNavigationChange = useCallback(
    (target: "chat" | "notes" | "saved" | "games") => {
      setNavigationValue(target);
      if (target === "chat") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("view");
        const suffix = params.toString();
        router.push(suffix ? `/chat?${suffix}` : "/chat");
        setHomeMode("chat");
      } else if (target === "notes") {
        router.push("/notes");
      } else if (target === "saved") {
        router.push("/rough-notes");
      } else if (target === "games") {
        router.push("/games");
      }
    },
    [router, searchParams]
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const pendingReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
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
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [starterDialog, setStarterDialog] = useState<"rescue" | "mock" | "rc" | null>(null);
  const [starterIntake, setStarterIntake] = useState({
    attempt: "",
    weekdayHours: "",
    weekendHours: "",
    levels: "",
    resources: "",
  });
  const [mockForm, setMockForm] = useState({
    overall: "",
    varc: "",
    dilr: "",
    qa: "",
    attempts: "",
    accuracy: "",
    timeLeftValue: "",
    timeLeftUnit: "weeks",
    mistakes: "",
  });
  const [setupKeyError, setSetupKeyError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [isSavingActionPlan, setIsSavingActionPlan] = useState(false);
  const [actionChecklist, setActionChecklist] = useState<Record<string, boolean>>({});
  const [isActionBoardOpen, setIsActionBoardOpen] = useState(false);
  const [missingSetupNoticeShown, setMissingSetupNoticeShown] = useState(false);

  const suggestions = useMemo(
    () => ["Give me a 14-day rescue plan.", "Diagnose my last mock.", "Fix RC accuracy."],
    []
  );

  const needsOpenRouterKey = Boolean(sessionUser && !openRouterStatus.hasKey);
  const needsOpenRouterModel = Boolean(sessionUser && !openRouterModel.trim());
  const missingSetupReason = useMemo(() => {
    if (!openRouterStatus.hasKey) return "key" as const;
    if (!openRouterModel.trim()) return "model" as const;
    return null;
  }, [openRouterModel, openRouterStatus.hasKey]);
  const needsSetup =
    Boolean(sessionUser) && !isSessionLoading && hasLoadedSettings && (needsOpenRouterKey || needsOpenRouterModel);
  const canGenerateResponses = missingSetupReason === null;
  const showChatControls = homeMode === "chat";
  const showNotesNavigation = homeMode === "notes";
  const hasPendingReply = messages.at(-1)?.role === "user";

  const buildQuickIntakeLines = useCallback(() => {
    const lines: string[] = [];
    const attempt = starterIntake.attempt.trim();
    const weekday = starterIntake.weekdayHours.trim();
    const weekend = starterIntake.weekendHours.trim();
    const levels = starterIntake.levels.trim();
    const resources = starterIntake.resources.trim();

    if (attempt) lines.push(`CAT attempt: ${attempt}`);
    if (levels) lines.push(`Current level by section: ${levels}`);
    if (weekday) lines.push(`Weekday study hours: ${weekday}`);
    if (weekend) lines.push(`Weekend study hours: ${weekend}`);
    if (resources) lines.push(`Mocks/resources: ${resources}`);

    return lines;
  }, [starterIntake]);

  const buildQuickIntakeBlock = useCallback(() => {
    const lines = buildQuickIntakeLines();
    if (lines.length === 0) return "";
    return lines.map(line => `- ${line}`).join("\n");
  }, [buildQuickIntakeLines]);

  const buildLexicalPayload = useCallback((lines: string[]): SerializedEditorState => {
    return {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: "ltr",
        children: lines.map(line => ({
          type: "paragraph",
          version: 1,
          format: "",
          indent: 0,
          direction: "ltr",
          children: [
            {
              type: "text",
              version: 1,
              text: line,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
            },
          ],
        })),
      },
    };
  }, []);

  const latestCoachResponse = useMemo<LlmCatCoachResponse | null>(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message?.role === "assistant" && isLlmCatCoachResponse(message.content)) {
        return message.content;
      }
    }
    return null;
  }, [messages]);

  const actionItems = useMemo(() => {
    if (!latestCoachResponse) return [];
    const today = latestCoachResponse.nextActions.today
      .filter(item => item?.trim())
      .map((item, index) => ({
        id: `today-${index}`,
        label: item,
        bucket: "Today",
      }));
    const thisWeek = latestCoachResponse.nextActions.thisWeek
      .filter(item => item?.trim())
      .map((item, index) => ({
        id: `week-${index}`,
        label: item,
        bucket: "This Week",
      }));
    return [...today, ...thisWeek];
  }, [latestCoachResponse]);

  const actionSignature = useMemo(() => actionItems.map(item => `${item.id}:${item.label}`).join("|"), [actionItems]);
  const actionBoardCountRef = useRef(0);

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const data = await apiJson<{ user: SessionUser | null }>("/api/auth/session");
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
      const data = await apiJson<{ messages: any[] }>(`/api/chat/history?chatId=${encodeURIComponent(activeChatId)}`, {
        method: "GET",
      });
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
      setHasLoadedSettings(true);
    }
  }, [sessionUser]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    setHasLoadedSettings(false);
  }, [sessionUser]);

  useEffect(() => {
    setMissingSetupNoticeShown(false);
  }, [openRouterModel, openRouterStatus.hasKey]);

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
    setActionChecklist({});
  }, [actionSignature]);

  useEffect(() => {
    if (actionItems.length === 0) {
      setIsActionBoardOpen(false);
    } else if (actionBoardCountRef.current === 0) {
      setIsActionBoardOpen(true);
    }
    actionBoardCountRef.current = actionItems.length;
  }, [actionItems.length]);

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
        await apiJson<{ ok: true }>(`/api/chat/history?chatId=${encodeURIComponent(chatId)}`, {
          method: "POST",
          body: JSON.stringify({
            messages: items.map(serializeMessageForStorage),
          }),
        });
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

  const notifyMissingSetup = useCallback(
    (reason: "key" | "model") => {
      if (missingSetupNoticeShown) return;
      const message =
        reason === "key"
          ? "OpenRouter key not set yet. Messages are saved, but replies need a key."
          : "No model selected yet. Messages are saved; pick a model when you want replies.";
      toast.info(message);
      setMissingSetupNoticeShown(true);
    },
    [missingSetupNoticeShown]
  );

  const generateAssistantMessage = useCallback(
    async (chatId: string) => {
      if (missingSetupReason) {
        notifyMissingSetup(missingSetupReason);
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
          throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Request failed.");
        }

        const content = coerceStoredMessageContent((data as any)?.message?.content);
        const contentText = stringifyMessageContent(content);
        if (!contentText.trim()) throw new Error("Empty response from model.");

        const assistant: Message = {
          id: createId(),
          role: "assistant",
          createdAt: new Date(),
          content: content ?? "",
        };

        setMessages(current => [...current, assistant]);
        await persistMessages(chatId, [assistant]);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        toast.error(error?.message ?? "Failed to generate response.");
      } finally {
        if (assistantAbortRef.current === controller) assistantAbortRef.current = null;
        setIsGenerating(false);
      }
    },
    [missingSetupReason, notifyMissingSetup, persistMessages]
  );

  const queueAssistantResponse = useCallback(
    (chatId: string) => {
      if (pendingReplyTimeoutRef.current) {
        clearTimeout(pendingReplyTimeoutRef.current);
        pendingReplyTimeoutRef.current = null;
      }
      setIsGenerating(true);
      pendingReplyTimeoutRef.current = setTimeout(() => {
        void generateAssistantMessage(chatId);
        pendingReplyTimeoutRef.current = null;
      }, 50);
    },
    [generateAssistantMessage]
  );

  const sendUserMessage = useCallback(
    async (content: string, files?: FileList) => {
      if (pendingReplyTimeoutRef.current) {
        clearTimeout(pendingReplyTimeoutRef.current);
        pendingReplyTimeoutRef.current = null;
      }

      const { attachments, extractedText } = await prepareChatAttachments(files);
      let nextContent = content.trim();
      if (extractedText.trim()) {
        nextContent = nextContent
          ? `${nextContent}\n\nExtracted text:\n${extractedText.trim()}`
          : `Extracted text:\n${extractedText.trim()}`;
      }
      if (!nextContent) {
        nextContent = "Attached files for review.";
      }

      const existingChatId = activeChatIdRef.current ?? chatIdFromUrl;
      const isNewSession = !existingChatId;
      const chatId = existingChatId ?? (await createChatSession(nextContent));

      const userMessage: Message = {
        id: createId(),
        role: "user",
        createdAt: new Date(),
        content: nextContent,

        experimental_attachments: attachments.length > 0 ? (attachments as any) : undefined,
      };

      setMessages(current => [...current, userMessage]);
      await persistMessages(chatId, [userMessage]);

      if (isNewSession) {
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);

        const params = new URLSearchParams(searchParams.toString());
        params.set("chatId", chatId);
        router.replace(`/chat?${params.toString()}`);
      }

      if (missingSetupReason) {
        notifyMissingSetup(missingSetupReason);
        return;
      }

      queueAssistantResponse(chatId);
    },
    [
      chatIdFromUrl,
      createChatSession,
      missingSetupReason,
      notifyMissingSetup,
      persistMessages,
      queueAssistantResponse,
      router,
      searchParams,
    ]
  );

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => {
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

  const handleGenerateReply = useCallback(() => {
    if (!activeChatId || isGenerating) return;
    if (missingSetupReason) {
      notifyMissingSetup(missingSetupReason);
      return;
    }
    queueAssistantResponse(activeChatId);
  }, [activeChatId, isGenerating, missingSetupReason, notifyMissingSetup, queueAssistantResponse]);

  const exportChat = useCallback(() => {
    if (typeof window === "undefined") return;
    if (messages.length === 0) {
      toast.info("No messages to export yet.");
      return;
    }

    const timestamp = new Date();
    const dateTag = timestamp.toISOString().slice(0, 10);
    const safeChatId = activeChatId ? activeChatId.slice(0, 8) : "new";
    const filename = `cat99-chat-${safeChatId}-${dateTag}.md`;

    const lines: string[] = [];
    lines.push("# Cat99 Chat Export");
    lines.push("");
    lines.push(`Chat ID: ${activeChatId ?? "new"}`);
    if (sessionUser?.email) {
      lines.push(`User: ${sessionUser.email}`);
    }
    lines.push(`Exported: ${timestamp.toLocaleString()}`);
    lines.push("");
    lines.push("---");
    lines.push("");

    messages.forEach(message => {
      const roleLabel = message.role === "assistant" ? "Assistant" : "User";
      const createdLabel = message.createdAt ? message.createdAt.toLocaleString() : "Unknown time";
      const body = stringifyMessageContent(message.content).trim();

      lines.push(`## ${roleLabel} (${createdLabel})`);
      lines.push(body || "_(empty message)_");

      const attachments = message.experimental_attachments ?? [];
      if (attachments.length > 0) {
        lines.push("");
        lines.push("Attachments:");
        attachments.forEach(attachment => {
          const name = attachment.name ?? "Attachment";
          const kind = attachment.contentType ?? "file";
          const url = attachment.url.startsWith("data:") ? "(embedded data url)" : attachment.url;
          lines.push(`- ${name} (${kind}): ${url}`);
        });
      }
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported.");
  }, [activeChatId, messages, sessionUser]);

  const saveActionPlan = useCallback(async () => {
    if (!latestCoachResponse || actionItems.length === 0) {
      toast.error("No actions to save yet.");
      return;
    }

    const todayItems = actionItems.filter(item => item.bucket === "Today");
    const weekItems = actionItems.filter(item => item.bucket === "This Week");
    const lines: string[] = [];

    if (todayItems.length > 0) {
      lines.push("Today:");
      todayItems.forEach(item => {
        const checked = actionChecklist[item.id];
        lines.push(`${checked ? "[x]" : "[ ]"} ${item.label}`);
      });
      lines.push("");
    }

    if (weekItems.length > 0) {
      lines.push("This Week:");
      weekItems.forEach(item => {
        const checked = actionChecklist[item.id];
        lines.push(`${checked ? "[x]" : "[ ]"} ${item.label}`);
      });
    }

    const preview = lines.join(" ").replace(/\s+/g, " ").trim();
    if (!preview) {
      toast.error("No actions to save yet.");
      return;
    }

    setIsSavingActionPlan(true);
    try {
      const payload = buildLexicalPayload(lines);
      const title = `Action plan - ${new Date().toLocaleDateString()}`;
      await apiJson<{ noteId: string }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title,
          preview: preview.slice(0, 240),
          payload,
        }),
      });
      toast.success("Saved to rough notes.");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save action plan.");
    } finally {
      setIsSavingActionPlan(false);
    }
  }, [actionChecklist, actionItems, buildLexicalPayload, latestCoachResponse]);

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    event => setInput(event.target.value),
    []
  );

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    if (suggestion === "Give me a 14-day rescue plan.") {
      setStarterDialog("rescue");
      return;
    }
    if (suggestion === "Diagnose my last mock.") {
      setStarterDialog("mock");
      return;
    }
    if (suggestion === "Fix RC accuracy.") {
      setStarterDialog("rc");
      return;
    }
  }, []);

  const sendQuickStarter = useCallback(
    async (basePrompt: string) => {
      const intake = buildQuickIntakeBlock();
      const message = intake ? `${basePrompt}\n\nQuick intake:\n${intake}` : basePrompt;
      await sendUserMessage(message, undefined);
    },
    [buildQuickIntakeBlock, sendUserMessage]
  );

  const handleRescueSubmit = useCallback(async () => {
    await sendQuickStarter("Give me a 14-day rescue plan.");
    setStarterDialog(null);
  }, [sendQuickStarter]);

  const handleRcSubmit = useCallback(async () => {
    await sendQuickStarter("Fix RC accuracy.");
    setStarterDialog(null);
  }, [sendQuickStarter]);

  const handleMockSubmit = useCallback(async () => {
    const lines: string[] = ["Diagnose my last mock."];
    if (mockForm.overall.trim()) lines.push(`Overall: ${mockForm.overall}`);
    if (mockForm.varc.trim()) lines.push(`VARC: ${mockForm.varc}`);
    if (mockForm.dilr.trim()) lines.push(`DILR: ${mockForm.dilr}`);
    if (mockForm.qa.trim()) lines.push(`QA: ${mockForm.qa}`);
    if (mockForm.attempts.trim()) lines.push(`Attempts: ${mockForm.attempts}`);
    if (mockForm.accuracy.trim()) {
      lines.push(`Accuracy: ${mockForm.accuracy}%`);
    }
    if (mockForm.timeLeftValue.trim()) {
      lines.push(`Time left: ${mockForm.timeLeftValue} ${mockForm.timeLeftUnit} left`);
    }
    if (mockForm.mistakes.trim()) {
      lines.push(`What went wrong: ${mockForm.mistakes.trim()}`);
    }

    const intake = buildQuickIntakeBlock();
    const message = intake ? `${lines.join("\n")}\n\nQuick intake:\n${intake}` : lines.join("\n");
    await sendUserMessage(message, undefined);
    setStarterDialog(null);
  }, [buildQuickIntakeBlock, mockForm, sendUserMessage]);

  const handleAuthSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsAuthSubmitting(true);
      try {
        const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

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
      await apiJson<{ ok: true }>(`/api/chat/history?chatId=${encodeURIComponent(chatId)}`, { method: "DELETE" });
      toast.success("Cleared chat history.");
      await loadSessions();
    },
    [loadSessions]
  );

  const handleNewChat = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("chatId");
    const suffix = params.toString();
    router.push(suffix ? `/chat?${suffix}` : "/chat");
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setMessages([]);
    setIsGenerating(false);
    setHomeMode("chat");
    setNavigationValue("chat");
  }, [router, searchParams]);

  const openChat = useCallback(
    (chatId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("chatId", chatId);
      router.push(`/chat?${params.toString()}`);
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

  const handleSetupSaveKey = useCallback(async () => {
    const key = openRouterKeyInput.trim();
    if (!key) {
      setSetupKeyError("OpenRouter key is required.");
      return;
    }
    setSetupKeyError("");
    await saveOpenRouterKey();
  }, [openRouterKeyInput, saveOpenRouterKey]);

  useEffect(() => {
    if (setupKeyError && openRouterKeyInput.trim()) {
      setSetupKeyError("");
    }
  }, [openRouterKeyInput, setupKeyError]);

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
        throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load models.");
      }

      const nextModels = Array.isArray((data as any).models) ? ((data as any).models as OpenRouterModel[]) : [];
      setModels(nextModels);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Unable to fetch models.";
      setModelsError(message);
      toast.error(message);
    } finally {
      setModelsLoading(false);
    }
  }, [canFetchModels, modelsLoading]);

  useEffect(() => {
    if (!guideOpen) return;
    if (!openRouterStatus.hasKey) return;
    if (models.length > 0 || modelsLoading) return;
    fetchModels();
  }, [fetchModels, guideOpen, models.length, modelsLoading, openRouterStatus.hasKey]);

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
      <Button type="button" variant="ghost" size="sm" onClick={() => setShowArchived(v => !v)}>
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

    return sessions.map(session => {
      const isActive = session.id === activeChatId;
      const label = session.title || session.preview || `Chat ${session.id.slice(0, 8)}`;

      return (
        <div
          key={session.id}
          className={[
            "group flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
            isActive ? "border-primary bg-primary/5" : "hover:bg-muted",
          ].join(" ")}
        >
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openChat(session.id)}>
            <div className="line-clamp-2">{label}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              {session.archived ? <span className="rounded border px-1 py-0.5">archived</span> : null}
              {session.updatedAt ? <span>{formatWhen(session.updatedAt)}</span> : null}
            </div>
          </button>

          <div
            className={[
              "flex shrink-0 gap-1 transition-opacity",
              opts?.compact ? "opacity-100" : "opacity-0 group-hover:opacity-100",
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

  const handleNotesSectionClick = useCallback((sectionId: string) => {
    if (typeof window !== "undefined") {
      const hash = sectionId.startsWith("#") ? sectionId : `#${sectionId}`;
      if (window.location.hash !== hash) {
        window.history.replaceState(null, "", hash);
        window.dispatchEvent(new Event("hashchange"));
      }
    }
    setHistoryOpen(false);
  }, []);

  const starterDialogTitle =
    starterDialog === "mock"
      ? "Mock diagnostic helper"
      : starterDialog === "rc"
        ? "Fix RC accuracy"
        : "14-day rescue plan";

  const starterDialogDescription =
    starterDialog === "mock"
      ? "Share any scores or notes you want. We'll build a clean diagnostic prompt."
      : "Answer any intake questions you want. Every field is optional.";

  const starterDialogFooter =
    starterDialog === "mock" ? (
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStarterDialog(null)}>
          Cancel
        </Button>
        <Button type="button" onClick={handleMockSubmit}>
          Send to coach
        </Button>
      </DialogFooter>
    ) : starterDialog ? (
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStarterDialog(null)}>
          Cancel
        </Button>
        <Button type="button" onClick={starterDialog === "rc" ? handleRcSubmit : handleRescueSubmit}>
          Send to coach
        </Button>
      </DialogFooter>
    ) : null;

  const navbarInlineExtras = showChatControls ? (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setModelPickerOpen(true)}
        disabled={isSettingsSaving}
        className="min-w-0 max-w-full shrink truncate md:max-w-[18rem]"
      >
        <ModelIcon model={openRouterModel} />
        {openRouterModel ? openRouterModel : "Select model"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Fetch models"
        onClick={fetchModels}
        disabled={modelsLoading || isSettingsSaving}
      >
        <RefreshCcw className={modelsLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </Button>
    </>
  ) : null;

  const navbarMenuExtras = (
    <>
      {showChatControls ? (
        <>
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setModelPickerOpen(true)} disabled={isSettingsSaving}>
            Select model
          </DropdownMenuItem>
          <DropdownMenuItem onClick={fetchModels} disabled={modelsLoading || isSettingsSaving}>
            {modelsLoading ? "Fetching models..." : "Fetch models"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}

      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
      <DropdownMenuItem onClick={handleNewChat}>New chat</DropdownMenuItem>
    </>
  );

  const keyStatusLabel = hasLoadedSettings
    ? openRouterStatus.hasKey
      ? openRouterStatus.last4
        ? `saved (last 4: ${openRouterStatus.last4})`
        : "saved"
      : "not set"
    : "loading...";
  const modelStatusLabel = hasLoadedSettings
    ? openRouterModel.trim()
      ? openRouterModel
      : "not selected"
    : "loading...";
  const setupSummary = !hasLoadedSettings
    ? "Loading setup status..."
    : canGenerateResponses
      ? "You're ready to chat. Everything below is optional."
      : missingSetupReason === "key"
        ? "Replies are off until you add an OpenRouter key. You can still draft messages."
        : "Replies are off until you pick a model. You can still draft messages.";
  const generateReplyHint = !activeChatId
    ? "Send a message first."
    : isGenerating
      ? "Generating a response..."
      : missingSetupReason === "key"
        ? "Add an OpenRouter key to generate replies."
        : missingSetupReason === "model"
          ? "Pick a model to generate replies."
          : "Generate a reply for the latest message.";
  const generateReplyDisabled = !activeChatId || isGenerating || Boolean(missingSetupReason);
  const canExport = messages.length > 0;
  const guideTitle = needsSetup ? "Guide (setup recommended)" : "Guide";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle={sessionUser ? (sessionUser.email ?? sessionUser.uid) : undefined}
        leading={
          sessionUser && (showChatControls || showNotesNavigation) ? (
            <div className="md:hidden">
              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={showNotesNavigation ? "Chapters" : "History"}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{showNotesNavigation ? "Chapters" : "History"}</SheetTitle>
                  </SheetHeader>
                  {showNotesNavigation ? (
                    <AppSidebar
                      title="Chapters"
                      className="h-full w-full rounded-none border-0 shadow-none"
                      contentClassName="p-0"
                    >
                      <ScrollArea className="h-full">
                        <div className="space-y-4 p-4">
                          {CAT_KB_PARTS.map(part => (
                            <div key={part.id} className="space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {part.title}
                              </p>
                              <div className="space-y-1">
                                {part.sections.map(section => (
                                  <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => handleNotesSectionClick(section.id)}
                                    className="w-full rounded-lg px-2 py-1 text-left text-xs text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                                  >
                                    {section.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AppSidebar>
                  ) : (
                    <AppSidebar
                      title="History"
                      actions={historyActions}
                      className="h-full w-full rounded-none border-0 shadow-none"
                      contentClassName="p-0"
                      footer={
                        <Button className="w-full" type="button" onClick={handleNewChat}>
                          New chat
                        </Button>
                      }
                    >
                      <ScrollArea className="h-full">
                        <div className="space-y-1 p-3 pr-2">{renderSessionItems({ compact: true })}</div>
                      </ScrollArea>
                    </AppSidebar>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          ) : null
        }
        trailing={
          sessionUser ? (
            <AppNavbarActions
              value={navigationValue}
              onChange={handleNavigationChange}
              inlineExtras={navbarInlineExtras}
              menuExtras={navbarMenuExtras}
              onLogout={handleLogout}
              onThemeToggle={() => <ThemeToggleButton />}
            />
          ) : null
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full py-3 sm:py-4">
          {isSessionLoading ? (
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[18rem_1fr] md:gap-4">
              <div className="hidden h-full flex-col gap-3 rounded-2xl border bg-background p-3 md:flex">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-full" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton key={`history-skel-${idx}`} className="h-8 w-full" />
                  ))}
                </div>
              </div>

              <div className="flex h-full flex-col gap-3 rounded-2xl border bg-background p-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-[45vh] w-full rounded-2xl" />
              </div>
            </div>
          ) : sessionUser ? (
            homeMode === "notes" ? (
              <div className="h-full min-h-0 overflow-hidden rounded-2xl border bg-background shadow-sm">
                <Notes />
              </div>
            ) : (
              <section className="grid h-full grid-cols-1 gap-3 overflow-hidden md:grid-cols-[18rem_1fr] md:gap-4">
                <AppSidebar
                  title="History"
                  actions={historyActions}
                  className="hidden h-full md:flex"
                  contentClassName="p-0"
                >
                  <ScrollArea className="h-full">
                    <div className="space-y-1 p-3 pr-2">{renderSessionItems()}</div>
                  </ScrollArea>
                </AppSidebar>

                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
                    <p className="truncate text-xs text-muted-foreground">
                      {activeChatId ? (
                        <>
                          Conversation <span className="font-mono">{activeChatId}</span>
                        </>
                      ) : (
                        "New conversation"
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      {actionItems.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsActionBoardOpen(open => !open)}
                          aria-expanded={isActionBoardOpen}
                        >
                          {isActionBoardOpen ? "Hide action board" : "Show action board"}
                        </Button>
                      ) : null}
                      {hasPendingReply ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateReply}
                          disabled={generateReplyDisabled}
                          title={generateReplyHint}
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate reply
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" size="sm" onClick={exportChat} disabled={!canExport}>
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuideOpen(true)}
                        aria-label={guideTitle}
                        title={guideTitle}
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Guide</span>
                      </Button>
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
                  </div>
                  <div className="min-h-0 flex-1">
                    <div className="flex h-full min-h-0 flex-col">
                      {actionItems.length > 0 && isActionBoardOpen ? (
                        <div className="flex-shrink-0 space-y-2 border-b bg-muted/20 px-3 pt-3 pb-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-foreground">Action board</p>
                              <p className="text-[11px] text-muted-foreground">
                                Track today and this week, then save to rough notes.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={saveActionPlan}
                                disabled={isSavingActionPlan}
                              >
                                {isSavingActionPlan ? "Saving..." : "Save to rough notes"}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 grid max-h-[min(28rem,35dvh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                            {["Today", "This Week"].map(bucket => {
                              const items = actionItems.filter(item => item.bucket === bucket);
                              if (items.length === 0) return null;
                              return (
                                <div key={bucket} className="rounded-xl border bg-background p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {bucket}
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {items.map(item => (
                                      <label key={item.id} className="flex items-start gap-2 text-xs text-foreground">
                                        <input
                                          type="checkbox"
                                          className="mt-0.5 h-4 w-4 rounded border"
                                          checked={Boolean(actionChecklist[item.id])}
                                          onChange={event => {
                                            setActionChecklist(current => ({
                                              ...current,
                                              [item.id]: event.target.checked,
                                            }));
                                          }}
                                        />
                                        <span>{item.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <Chat
                        className="flex-1 min-h-0 px-2 pt-2"
                        messages={messages}
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isGenerating={isGenerating}
                        stop={stop}
                        setMessages={setMessages}
                        append={append}
                        suggestions={suggestions}
                        onSuggestionSelect={handleSuggestionSelect}
                        allowAttachments
                        onRateResponse={(messageId, rating) => {
                          toast.success(`Rated ${rating} on ${messageId}`);
                        }}
                      />
                    </div>
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
                      <CardTitle>{authMode === "login" ? "Sign in" : "Create account"}</CardTitle>
                      <CardDescription>Email + password.</CardDescription>
                    </div>
                    <ThemeToggleButton />
                  </div>
                </CardHeader>

                <CardContent>
                  <form className="space-y-3" onSubmit={handleAuthSubmit}>
                    {authMode === "register" ? (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Display name</label>
                        <Input
                          value={authDisplayName}
                          onChange={e => setAuthDisplayName(e.target.value)}
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
                        onChange={e => setAuthEmail(e.target.value)}
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
                        onChange={e => setAuthPassword(e.target.value)}
                        autoComplete={authMode === "login" ? "current-password" : "new-password"}
                        required
                      />
                    </div>

                    <Button className="w-full" type="submit" disabled={isAuthSubmitting}>
                      {isAuthSubmitting ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
                    </Button>
                  </form>
                </CardContent>

                <CardFooter className="justify-between">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setAuthMode(m => (m === "login" ? "register" : "login"))}
                  >
                    {authMode === "login" ? "Need an account?" : "Already have an account?"}
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
      </AppContent>

      <Dialog
        open={starterDialog !== null}
        onOpenChange={open => {
          if (!open) setStarterDialog(null);
        }}
      >
        <DialogShell
          className="sm:max-w-2xl"
          title={starterDialogTitle}
          description={starterDialogDescription}
          footer={starterDialogFooter}
        >
          {starterDialog === "mock" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Overall</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.overall}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        overall: event.target.value,
                      }))
                    }
                    placeholder="e.g. 64"
                  />
                </div>
                <div className="space-y-1">
                  <Label>VARC</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.varc}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        varc: event.target.value,
                      }))
                    }
                    placeholder="e.g. 28"
                  />
                </div>
                <div className="space-y-1">
                  <Label>DILR</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.dilr}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        dilr: event.target.value,
                      }))
                    }
                    placeholder="e.g. 18"
                  />
                </div>
                <div className="space-y-1">
                  <Label>QA</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.qa}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        qa: event.target.value,
                      }))
                    }
                    placeholder="e.g. 18"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Attempts</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.attempts}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        attempts: event.target.value,
                      }))
                    }
                    placeholder="e.g. 48"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Accuracy %</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.accuracy}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        accuracy: event.target.value,
                      }))
                    }
                    placeholder="e.g. 78"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="space-y-1">
                  <Label>Time left</Label>
                  <Input
                    inputMode="numeric"
                    value={mockForm.timeLeftValue}
                    onChange={event =>
                      setMockForm(prev => ({
                        ...prev,
                        timeLeftValue: event.target.value,
                      }))
                    }
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Unit</Label>
                  <Select
                    value={mockForm.timeLeftUnit}
                    onValueChange={value =>
                      setMockForm(prev => ({
                        ...prev,
                        timeLeftUnit: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weeks">weeks</SelectItem>
                      <SelectItem value="months">months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>What went wrong</Label>
                <Textarea
                  value={mockForm.mistakes}
                  onChange={event =>
                    setMockForm(prev => ({
                      ...prev,
                      mistakes: event.target.value,
                    }))
                  }
                  placeholder="Time sinks, silly mistakes, panic, weak topics..."
                  rows={4}
                />
              </div>

              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Quick intake (optional)</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>CAT attempt</Label>
                    <Input
                      value={starterIntake.attempt}
                      onChange={event =>
                        setStarterIntake(prev => ({
                          ...prev,
                          attempt: event.target.value,
                        }))
                      }
                      placeholder="CAT 2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Current level by section</Label>
                    <Input
                      value={starterIntake.levels}
                      onChange={event =>
                        setStarterIntake(prev => ({
                          ...prev,
                          levels: event.target.value,
                        }))
                      }
                      placeholder="QA weak, VARC avg, DILR strong"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Weekday study hours</Label>
                    <Input
                      value={starterIntake.weekdayHours}
                      onChange={event =>
                        setStarterIntake(prev => ({
                          ...prev,
                          weekdayHours: event.target.value,
                        }))
                      }
                      placeholder="e.g. 1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Weekend study hours</Label>
                    <Input
                      value={starterIntake.weekendHours}
                      onChange={event =>
                        setStarterIntake(prev => ({
                          ...prev,
                          weekendHours: event.target.value,
                        }))
                      }
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Mock series / resources</Label>
                    <Input
                      value={starterIntake.resources}
                      onChange={event =>
                        setStarterIntake(prev => ({
                          ...prev,
                          resources: event.target.value,
                        }))
                      }
                      placeholder="e.g. IMS + Arun Sharma"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>CAT attempt</Label>
                  <Input
                    value={starterIntake.attempt}
                    onChange={event =>
                      setStarterIntake(prev => ({
                        ...prev,
                        attempt: event.target.value,
                      }))
                    }
                    placeholder="CAT 2026"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Current level by section</Label>
                  <Input
                    value={starterIntake.levels}
                    onChange={event =>
                      setStarterIntake(prev => ({
                        ...prev,
                        levels: event.target.value,
                      }))
                    }
                    placeholder="QA weak, VARC avg, DILR strong"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Weekday study hours</Label>
                  <Input
                    value={starterIntake.weekdayHours}
                    onChange={event =>
                      setStarterIntake(prev => ({
                        ...prev,
                        weekdayHours: event.target.value,
                      }))
                    }
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Weekend study hours</Label>
                  <Input
                    value={starterIntake.weekendHours}
                    onChange={event =>
                      setStarterIntake(prev => ({
                        ...prev,
                        weekendHours: event.target.value,
                      }))
                    }
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Mock series / resources</Label>
                  <Input
                    value={starterIntake.resources}
                    onChange={event =>
                      setStarterIntake(prev => ({
                        ...prev,
                        resources: event.target.value,
                      }))
                    }
                    placeholder="e.g. IMS + Arun Sharma"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogShell>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogShell
          className="sm:max-w-2xl"
          title="Chat guide"
          description="Optional setup and tips. Nothing here blocks chatting."
        >
          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-foreground">Status</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{setupSummary}</p>
              <div className="mt-2 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                <div className="space-y-1">
                  <p>OpenRouter key: {keyStatusLabel}</p>
                  <p>Model: {modelStatusLabel}</p>
                  <p>Replies: {canGenerateResponses ? "enabled" : "off"}</p>
                </div>
                <div className="space-y-1">
                  <p>Pending reply: {hasPendingReply ? "waiting" : "none"}</p>
                  <p>Messages: {messages.length}</p>
                </div>
              </div>
              {!canGenerateResponses ? (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Responses are optional. Add a key + model when you want replies.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-foreground">Quick tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                <li>Attach images or text files. Images can run OCR to extract text.</li>
                <li>Paste long text to turn it into a text attachment automatically.</li>
                <li>Use the mic button for voice dictation.</li>
                <li>Enter sends. Shift+Enter makes a new line.</li>
                <li>Use Generate reply after setup to answer the latest message.</li>
                <li>Export chats anytime from the top bar.</li>
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Upload note: images are sent to Cloudinary for OCR; text files stay as attachments in your chat history.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Setup checklist (optional)</p>
              {[
                { label: "Sign in", done: Boolean(sessionUser) },
                {
                  label: "Paste OpenRouter key",
                  done: openRouterStatus.hasKey,
                },
                {
                  label: "Pick a model (recommended below)",
                  done: Boolean(openRouterModel.trim()),
                },
              ].map(step => (
                <div key={step.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                      step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className={cn(step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="setup-key">OpenRouter API key</Label>
                  {openRouterStatus.hasKey ? (
                    <span className="text-xs text-muted-foreground">
                      saved
                      {openRouterStatus.last4 ? ` ••••${openRouterStatus.last4}` : ""}
                    </span>
                  ) : null}
                </div>
                <Input
                  id="setup-key"
                  type="password"
                  placeholder="sk-or-..."
                  value={openRouterKeyInput}
                  onChange={event => setOpenRouterKeyInput(event.target.value)}
                  className="mt-2"
                  disabled={openRouterStatus.hasKey || isSettingsSaving}
                />
                {setupKeyError ? <p className="mt-1 text-xs text-destructive">{setupKeyError}</p> : null}
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={handleSetupSaveKey}
                  disabled={openRouterStatus.hasKey || isSettingsSaving}
                >
                  {openRouterStatus.hasKey ? "Saved" : "Save key"}
                </Button>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Label>Model</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchModels}
                    disabled={!openRouterStatus.hasKey || modelsLoading}
                  >
                    {modelsLoading ? "Fetching..." : "Fetch models"}
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  <Select
                    value={openRouterModel}
                    onValueChange={value => void saveOpenRouterModel(value)}
                    disabled={!openRouterStatus.hasKey || models.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={models.length === 0 ? "No models loaded" : "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name || model.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {models[0]?.id && !openRouterModel.trim() ? (
                    <p className="text-xs text-muted-foreground">Recommended: {models[0].name || models[0].id}</p>
                  ) : null}
                  {modelsError ? <p className="text-xs text-destructive">{modelsError}</p> : null}
                  {needsOpenRouterModel && models.length > 0 ? (
                    <p className="text-xs text-muted-foreground">Pick a model to start chatting.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogShell>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogShell
          className="sm:max-w-xl"
          title="Settings"
          description="Optional: add your OpenRouter key to enable replies. Saved to your account."
          footer={
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
              <Button type="button" onClick={saveOpenRouterKey} disabled={isSettingsLoading || isSettingsSaving}>
                {isSettingsSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="openrouter-key">OpenRouter API key</Label>
              {openRouterStatus.hasKey ? (
                <span className="text-xs text-muted-foreground">
                  saved
                  {openRouterStatus.last4 ? ` ••••${openRouterStatus.last4}` : ""}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">not set</span>
              )}
            </div>

            <Input
              id="openrouter-key"
              type="password"
              placeholder="sk-or-..."
              value={openRouterKeyInput}
              onChange={e => setOpenRouterKeyInput(e.target.value)}
              disabled={isSettingsLoading || isSettingsSaving}
            />

            <Alert>
              <AlertDescription>Stored server-side. It is not displayed back in full.</AlertDescription>
            </Alert>
          </div>
        </DialogShell>
      </Dialog>

      <CommandDialog
        open={modelPickerOpen}
        onOpenChange={open => {
          setModelPickerOpen(open);
          if (!open) setModelSearch("");
        }}
        title="OpenRouter model"
        description="Search and select a model."
      >
        <CommandInput placeholder="Search models..." value={modelSearch} onValueChange={setModelSearch} />
        <CommandList>
          <CommandEmpty>
            {models.length === 0
              ? openRouterStatus.hasKey
                ? "No models loaded. Click Fetch models."
                : "No models loaded. Add a key and fetch models when you're ready."
              : "No models found."}
          </CommandEmpty>

          {modelsError ? <div className="px-3 py-2 text-xs text-destructive">{modelsError}</div> : null}

          <CommandGroup heading="Models">
            {models.map(model => {
              const description = typeof model.description === "string" ? model.description.trim() : "";
              return (
                <CommandItem
                  key={model.id}
                  value={`${model.name ?? ""} ${model.id}`}
                  onSelect={() => {
                    void saveOpenRouterModel(model.id);
                    setModelPickerOpen(false);
                  }}
                >
                  <Check className={model.id === openRouterModel ? "h-4 w-4" : "h-4 w-4 opacity-0"} />
                  <div className="ml-2 flex items-center gap-2 justify-between w-full">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{model.name || model.id}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {model.id}
                        {model.contextLength ? ` • ${model.contextLength.toLocaleString()} ctx` : ""}
                      </div>
                      {description ? (
                        <div className="truncate text-[11px] text-muted-foreground">{description}</div>
                      ) : null}
                    </div>
                    <ModelIcon model={model.id} />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={open => {
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
            <AlertDialogCancel disabled={isSettingsSaving}>Cancel</AlertDialogCancel>
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
