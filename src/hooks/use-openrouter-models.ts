"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type OpenRouterModel = {
  id: string;
  name?: string;
  contextLength?: number | null;
};

type UseOpenRouterModelsOptions = {
  enabled?: boolean;
};

export function useOpenRouterModels({ enabled = true }: UseOpenRouterModelsOptions = {}) {
  const [openRouterModel, setOpenRouterModel] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!enabled) return;
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/settings/openrouter", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load settings.");
      }

      setHasKey(Boolean((data as any)?.hasKey));
      setOpenRouterModel(typeof (data as any)?.model === "string" ? (data as any).model : "");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load OpenRouter settings.");
    } finally {
      setSettingsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void loadSettings();
  }, [enabled, loadSettings]);

  const saveOpenRouterModel = useCallback(
    async (model: string) => {
      const trimmed = model.trim();
      if (!trimmed) return;

      setSettingsSaving(true);
      try {
        const response = await fetch("/api/settings/openrouter", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: trimmed }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to save model.");
        }
        setOpenRouterModel(trimmed);
        toast.success("Model saved.");
        await loadSettings();
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to save model.");
      } finally {
        setSettingsSaving(false);
      }
    },
    [loadSettings]
  );

  const fetchModels = useCallback(async () => {
    if (modelsLoading || !enabled) return;
    if (!hasKey) {
      setModelsError("Add your OpenRouter API key in Settings first.");
      toast.error("Add your OpenRouter API key in Settings first.");
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

      const nextModels = Array.isArray((data as any)?.models) ? ((data as any).models as OpenRouterModel[]) : [];
      setModels(nextModels);

      if (!openRouterModel && nextModels[0]?.id) {
        await saveOpenRouterModel(nextModels[0].id);
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unable to fetch models.";
      setModelsError(message);
      toast.error(message);
    } finally {
      setModelsLoading(false);
    }
  }, [enabled, hasKey, modelsLoading, openRouterModel, saveOpenRouterModel]);

  return {
    openRouterModel,
    hasKey,
    models,
    modelsLoading,
    modelsError,
    settingsLoading,
    settingsSaving,
    fetchModels,
    saveOpenRouterModel,
  };
}
