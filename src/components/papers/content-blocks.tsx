import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/types/cat-paper";
import { normalizeMathDelimiters } from "@/utils/markdown-math";

export function ContentBlocks({ blocks, className }: { blocks?: ContentBlock[]; className?: string }) {
  if (!blocks?.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          const text = block.text?.trim();
          if (!text) return null;
          const normalized = normalizeMathDelimiters(text);
          return (
            <div key={`text-${index}`} className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
              <MarkdownRenderer>{normalized}</MarkdownRenderer>
            </div>
          );
        }

        return (
          <figure key={`image-${index}`} className="overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-3">
            <img
              src={block.url}
              alt={block.alt || "Section visual"}
              loading="lazy"
              className="h-auto w-full rounded-lg"
            />
            {block.alt ? <figcaption className="mt-2 text-xs text-muted-foreground">{block.alt}</figcaption> : null}
          </figure>
        );
      })}
    </div>
  );
}
