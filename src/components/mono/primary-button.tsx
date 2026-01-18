"use client";

import type { ButtonHTMLAttributes } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  fullWidth?: boolean;
};

export function PrimaryButton({
  variant = "solid",
  fullWidth,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        variant === "solid" ? styles.buttonSolid : styles.buttonOutline,
        fullWidth && styles.buttonFull,
        className
      )}
      {...props}
    />
  );
}
