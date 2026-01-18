"use client";
import { motion } from "framer-motion";
import React from "react";

import { ChatMessage, type ChatMessageProps } from "@/components/ui/chat-message";
import { SCENARIO_COLORS } from "@/constants/llm-chat";
import { LlmMainAnswerTypeLabels } from "@/constants/llm-response";
import { CatCoachIntentLabels, CatCoachResponseModeLabels, CatScenarioCode } from "@/lib/cat-tools";
import { cn } from "@/lib/utils";
import { type LlmCatCoachResponse } from "@/types/llm-response";

import ConfidenceLine from "../confidence-line";

type LlmChatMessageProps = Omit<ChatMessageProps, "content"> & {
  content: LlmCatCoachResponse;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      variants={badgeVariants}
      whileHover={{ backgroundColor: "var(--hover-overlay)" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-4xl border bg-background/80 px-2 py-0.5 text-xs"
    >
      <span className="uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </motion.div>
  );
}

function getCheatsheetSection(content: LlmCatCoachResponse) {
  if (content.topicTag?.startsWith("QA")) {
    return { id: "qa-formulas", label: "Open cheatsheet" };
  }
  if (content.topicTag?.startsWith("DILR")) {
    return { id: "dilr-frameworks", label: "Open cheatsheet" };
  }
  if (content.topicTag?.startsWith("VARC")) {
    return { id: "varc-frameworks", label: "Open cheatsheet" };
  }
  if (content.scenario?.code && content.scenario.code !== "unknown") {
    return { id: "scenario-playbook", label: "Open playbook" };
  }
  return null;
}

function buildNotesHref(sectionId: string) {
  if (typeof window === "undefined") {
    return `/notes#${sectionId}`;
  }
  return `/notes#${sectionId}`;
}

function CompactList({ items }: { items: string[] }) {
  const filtered = items.filter(item => item?.trim());
  if (!filtered.length) return null;

  return (
    <ul className="list-disc space-y-0.5 wrap-break-word pl-4 text-sm leading-relaxed">
      {filtered.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: i * 0.03,
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  accent,
  className,
  children,
}: {
  title: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("rounded-3xl border border-foreground/10 bg-muted/20 p-2 sm:p-3", className)}
      style={{ borderColor: accent }}
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function renderTable(table: LlmCatCoachResponse["mainAnswer"]["table"], code: CatScenarioCode = "unknown") {
  if (
    !table?.headers?.length ||
    table.rows.length === 0 ||
    table.rows.every(row => row.every(cell => !cell || !String(cell).trim()))
  )
    return null;

  return (
    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-foreground/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-xs">
          <thead>
            <tr
              style={{
                backgroundColor: SCENARIO_COLORS[code]?.accent || SCENARIO_COLORS.unknown.accent,
              }}
            >
              {table.headers.map((h, i) => (
                <motion.th
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="border-b border-r border-foreground/20 px-2 py-1 text-left font-semibold last:border-r-0"
                >
                  {h}
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.15 + i * 0.02,
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="even:bg-muted/30"
              >
                {table.headers.map((_, j) => (
                  <td
                    key={j}
                    className="border-b border-r border-foreground/20 px-2 py-1 align-top last:border-r-0 [tr:last-child_&]:border-b-0"
                  >
                    {String(row[j] ?? "").trim()}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function renderLlmContent(content: LlmCatCoachResponse) {
  const scenarioColors = SCENARIO_COLORS[content.scenario.code] || SCENARIO_COLORS.unknown;
  const hasBullets = content.mainAnswer.bullets?.filter(b => b?.trim()).length > 0;
  const hasTable = content.mainAnswer.table?.headers?.length && content.mainAnswer.table?.headers?.length > 0;
  const hasNotes = content.mainAnswer.notes?.filter(n => n?.trim()).length > 0;
  const hasQuickQ = content.quickQuestions?.filter(q => q?.trim()).length > 0;
  const hasTodayActions = content.nextActions.today?.filter(a => a?.trim()).length > 0;
  const hasWeekActions = content.nextActions.thisWeek?.filter(a => a?.trim()).length > 0;
  const cheatsheet = getCheatsheetSection(content);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 text-sm sm:space-y-4"
    >
      {/* Scenario Header */}
      <motion.div
        variants={itemVariants}
        className="rounded-t-md border border-foreground/10 p-3 sm:p-4"
        style={{
          color: scenarioColors.bg,
          backgroundColor: scenarioColors.accent,
          borderColor: scenarioColors.accent,
        }}
      >
        <div className="mb-1 flex items-center gap-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="text-lg font-bold"
          >
            {content.scenario.code}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{
              delay: 0.2,
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="text-xs"
          >
            <ConfidenceLine size={16} confidence={content.scenario.confidence} />
          </motion.span>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-xs"
          style={{ color: scenarioColors.subtext }}
        >
          {content.scenario.reason.trim() || "No reason provided"}
        </motion.p>
      </motion.div>

      {/* Compact Badges */}
      <motion.div
        variants={itemVariants}
        className="flex flex-nowrap gap-1.5 overflow-x-auto px-3 pb-1 sm:flex-wrap sm:overflow-visible"
      >
        <Badge label="Intent" value={CatCoachIntentLabels[content.intent]} />
        <Badge label="Mode" value={CatCoachResponseModeLabels[content.responseMode]} />
        <Badge label="Type" value={LlmMainAnswerTypeLabels[content.mainAnswer.type]} />
        {content.topicTag && <Badge label="Topic" value={content.topicTag} />}
      </motion.div>

      {cheatsheet ? (
        <motion.div variants={itemVariants} className="px-3">
          <a
            href={buildNotesHref(cheatsheet.id)}
            className="inline-flex items-center rounded-4xl border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary/60 hover:bg-primary/20"
          >
            {cheatsheet.label}
          </a>
        </motion.div>
      ) : null}

      {/* Focus */}
      {content.whatUserNeedsNow?.trim() && (
        <motion.div variants={itemVariants} className="px-3">
          <div className="rounded-3xl border border-border-strong bg-muted/40 p-2">
            <p className="text-xs font-medium text-foreground">{content.whatUserNeedsNow.trim()}</p>
          </div>
        </motion.div>
      )}

      {/* Main Answer */}
      {hasBullets && (
        <motion.div variants={itemVariants} className="space-y-1 px-3">
          <CompactList items={content.mainAnswer.bullets} />
        </motion.div>
      )}

      {/* Table */}
      {hasTable && <div className="px-3">{renderTable(content.mainAnswer.table, content.scenario.code)}</div>}

      {/* Notes */}
      {hasNotes && (
        <motion.div variants={itemVariants} className="px-3">
          <SectionCard title="Notes" accent={scenarioColors.accent} className="bg-muted/30">
            <CompactList items={content.mainAnswer.notes} />
          </SectionCard>
        </motion.div>
      )}

      {/* Quick Questions */}
      {hasQuickQ && content.shouldAskQuickQuestions && (
        <motion.div variants={itemVariants} className="px-3">
          <SectionCard title="Questions" accent={scenarioColors.accent} className="bg-primary/5">
            <CompactList items={content.quickQuestions} />
          </SectionCard>
        </motion.div>
      )}

      {/* Next Actions */}
      {(hasTodayActions || hasWeekActions) && (
        <motion.div variants={itemVariants} className="px-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {hasTodayActions && (
              <SectionCard title="Today" accent={scenarioColors.accent} className="bg-muted/30">
                <CompactList items={content.nextActions.today} />
              </SectionCard>
            )}
            {hasWeekActions && (
              <SectionCard title="This Week" accent={scenarioColors.accent} className="bg-muted/30">
                <CompactList items={content.nextActions.thisWeek} />
              </SectionCard>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function LlmChatMessage({ content, ...rest }: LlmChatMessageProps) {
  return (
    <ChatMessage
      {...rest}
      content={content}
      renderContent={renderLlmContent(content)}
      paddingClassName="w-full p-0 pb-3 sm:w-auto"
    />
  );
}
