"use client";

import "katex/dist/katex.min.css";

import React from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={COMPONENTS}>
        {children}
      </Markdown>
    </div>
  );
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
  className?: string;
  language: string;
}

const CodeBlock = ({
  children,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language,
  ...restProps
}: CodeBlockProps) => {
  const code = typeof children === "string" ? children : childrenTakeAllStringContents(children);

  const preClass = cn(
    "overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]",
    className
  );

  return (
    <div className="group/code relative mb-4">
      <pre className={preClass} {...restProps}>
        <code>{code}</code>
      </pre>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  );
};

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") return element;

  if (element?.props?.children) {
    const children = element.props.children;
    if (Array.isArray(children)) {
      return children.map(childrenTakeAllStringContents).join("");
    }
    return childrenTakeAllStringContents(children);
  }

  return "";
}

// Make TS happy: always return a React component (not void), and merge className safely.
function withClass(tag: keyof React.JSX.IntrinsicElements, classes: string): React.FC<any> {
  const Component: React.FC<any> =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ node, className, ...props }) =>
      React.createElement(tag, {
        ...props,
        className: cn(classes, className),
      });

  Component.displayName = `MD.${String(tag)}`;
  return Component;
}

const COMPONENTS: Components = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),

  strong: withClass("strong", "font-semibold"),
  a: withClass("a", "text-primary underline underline-offset-2"),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),

  // Important: use `inline` to distinguish inline code vs fenced code blocks.

  code: ({ inline, children, className, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    if (!inline && match) {
      return (
        <CodeBlock className={className} language={match[1]} {...rest}>
          {children}
        </CodeBlock>
      );
    }

    return (
      <code className={cn("font-mono rounded-md bg-background/50 px-1 py-0.5", className)} {...rest}>
        {children}
      </code>
    );
  },

  // unwrap pre because CodeBlock already renders <pre>

  pre: ({ children }: any) => <>{children}</>,

  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),

  table: withClass("table", "w-full border-collapse overflow-y-auto rounded-md border border-foreground/20"),
  th: withClass(
    "th",
    "border border-foreground/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border border-foreground/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "m-0 border-t p-0 even:bg-muted"),

  p: withClass("p", "whitespace-pre-wrap"),
  hr: withClass("hr", "border-foreground/20"),
};

export default MarkdownRenderer;
