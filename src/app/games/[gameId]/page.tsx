"use client";

import { Check, RefreshCcw, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ModelIcon } from "@/components/ui/model-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { isLlmGame } from "@/games/core/game-generation";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { useOpenRouterModels } from "@/hooks/use-openrouter-models";

const GameRunner = dynamic(() => import("@/games/game-runner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[32vh] w-full rounded-2xl" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ),
});

export default function GamePage() {
  const params = useParams<{ gameId?: string | string[] }>();
  const raw = params?.gameId;
  const gameId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const showModelPicker = isLlmGame(gameId);

  const {
    openRouterModel,
    hasKey,
    models,
    modelsLoading,
    modelsError,
    settingsSaving,
    fetchModels,
    saveOpenRouterModel,
  } = useOpenRouterModels({ enabled: showModelPicker });
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();

  useEffect(() => {
    if (!showModelPicker) return;
    if (!modelPickerOpen) return;
    if (models.length > 0 || modelsLoading || !hasKey) return;
    void fetchModels();
  }, [fetchModels, hasKey, modelPickerOpen, models.length, modelsLoading, showModelPicker]);

  if (!gameId) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Missing game id.</div>
    );
  }

  const modelLabel = hasKey ? (openRouterModel ? openRouterModel : "Select model") : "Add key in Settings";

  const inlineModelControls = showModelPicker ? (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setModelPickerOpen(true)}
        disabled={!hasKey || settingsSaving}
        className="min-w-0 max-w-[16rem] gap-2 truncate"
      >
        {openRouterModel ? <ModelIcon model={openRouterModel} /> : <Sparkles className="h-4 w-4" />}
        <span className="truncate">{modelLabel}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Fetch models"
        onClick={fetchModels}
        disabled={!hasKey || modelsLoading || settingsSaving}
      >
        <RefreshCcw className={modelsLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </Button>
    </>
  ) : null;

  const menuExtras = showModelPicker ? (
    <>
      <DropdownMenuLabel>Model</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setModelPickerOpen(true)} disabled={!hasKey || settingsSaving}>
        {hasKey ? "Select model" : "Add OpenRouter key in Settings"}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={fetchModels} disabled={!hasKey || modelsLoading || settingsSaving}>
        {modelsLoading ? "Fetching models..." : "Fetch models"}
      </DropdownMenuItem>
    </>
  ) : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Games"
        trailing={
          <AppNavbarActions
            value="games"
            onChange={next => {
              if (next === "chat") {
                window.location.href = "/chat";
              } else if (next === "notes") {
                window.location.href = "/notes";
              } else if (next === "saved") {
                window.location.href = "/rough-notes";
              } else if (next === "games") {
                window.location.href = "/games";
              }
            }}
            inlineExtras={inlineModelControls}
            menuExtras={menuExtras}
            onLogout={handleLogout}
            onThemeToggle={handleThemeToggle}
          />
        }
      />

      <GameRunner gameId={gameId} />

      {showModelPicker ? (
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
              {models.length === 0 ? "No models loaded. Click Fetch models." : "No models found."}
            </CommandEmpty>

            {modelsError ? <div className="px-3 py-2 text-xs text-destructive">{modelsError}</div> : null}

            <CommandGroup heading="Models">
              {models.map(model => {
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
                    <div className="ml-2 flex w-full items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{model.name || model.id}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {model.id}
                          {model.contextLength ? ` • ${model.contextLength.toLocaleString()} ctx` : ""}
                        </div>
                      </div>
                      <ModelIcon model={model.id} />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      ) : null}
    </div>
  );
}
