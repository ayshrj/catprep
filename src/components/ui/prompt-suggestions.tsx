interface PromptSuggestionsProps {
  label: string;
  append: (message: { role: "user"; content: string }) => void;
  suggestions: string[];
  onSelect?: (suggestion: string) => void;
}

export function PromptSuggestions({ label, append, suggestions, onSelect }: PromptSuggestionsProps) {
  return (
    <div className="space-y-4 px-1 sm:px-0">
      <h2 className="text-center text-xl font-semibold tracking-tight">{label}</h2>
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            onClick={() => (onSelect ? onSelect(suggestion) : append({ role: "user", content: suggestion }))}
            className="group h-full rounded-2xl border bg-background/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-muted/60 hover:shadow-sm"
          >
            <p className="text-foreground">{suggestion}</p>
            <p className="mt-2 text-xs text-muted-foreground">Tap to start</p>
          </button>
        ))}
      </div>
    </div>
  );
}
