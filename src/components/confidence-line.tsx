import React from "react";

import { LlmConfidence } from "@/types/llm-response";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const label: Record<LlmConfidence, string> = {
  high: "High Confidence",
  med: "Medium Confidence",
  low: "Low Confidence",
};

export default function ConfidenceLine(
  props: React.SVGProps<SVGSVGElement> & { confidence?: LlmConfidence; size?: number }
) {
  const { confidence = "low", size = 24, ...rest } = props;

  const yPositions: Record<LlmConfidence, number[]> = {
    high: [6, 11, 16], // normal spacing
    med: [9, 12], // closer
    low: [11], // single line (tightest by definition)
  };

  const ys = yPositions[confidence];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width={size}
          height={size}
          {...rest}
        >
          {ys.map(y => (
            <path key={y} d={`M4 ${y}h16`} />
          ))}
        </svg>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label[confidence]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
