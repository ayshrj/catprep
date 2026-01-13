import { useTheme } from "next-themes";
import React, { SVGProps } from "react";

import { AnthropicBlack } from "@/components/ui/svgs/anthropicBlack";
import { AnthropicWhite } from "@/components/ui/svgs/anthropicWhite";
import { Cohere } from "@/components/ui/svgs/cohere";
import { Deepseek } from "@/components/ui/svgs/deepseek";
import { Gemini } from "@/components/ui/svgs/gemini";
import { Meta } from "@/components/ui/svgs/meta";
import { MistralAiLogo } from "@/components/ui/svgs/mistralAiLogo";
import { NvidiaIconDark } from "@/components/ui/svgs/nvidiaIconDark";
import { NvidiaIconLight } from "@/components/ui/svgs/nvidiaIconLight";
import { Openai } from "@/components/ui/svgs/openai";
import { OpenaiDark } from "@/components/ui/svgs/openaiDark";
import { OpenrouterDark } from "@/components/ui/svgs/openrouterDark";
import { OpenrouterLight } from "@/components/ui/svgs/openrouterLight";
import { QwenDark } from "@/components/ui/svgs/qwenDark";
import { QwenLight } from "@/components/ui/svgs/qwenLight";

export const MODELS_ICONS: Record<
  string,
  {
    light: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
    dark?: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  }
> = {
  anthropic: { light: AnthropicBlack, dark: AnthropicWhite },
  deepseek: { light: Deepseek },
  qwen: { light: QwenLight, dark: QwenDark },
  "meta-llama": { light: Meta },
  mistralai: { light: MistralAiLogo },
  openai: { dark: OpenaiDark, light: Openai },
  google: { light: Gemini },
  nvidia: { dark: NvidiaIconDark, light: NvidiaIconLight },
  openrouter: { light: OpenrouterLight, dark: OpenrouterDark },
  cohere: { light: Cohere },
};

export const ModelIcon = ({ model }: { model: string }): React.JSX.Element | null => {
  const { theme } = useTheme();
  const IconComponent =
    MODELS_ICONS[model.split("/")[0]]?.[theme === "dark" && MODELS_ICONS[model.split("/")[0]]?.dark ? "dark" : "light"];
  return IconComponent ? <IconComponent width={24} height={24} /> : null;
};
