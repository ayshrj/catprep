"use client";

import { BookOpen, Home, LayoutGrid, User } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type BottomTabBarProps = {
  items?: TabItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
};

const defaultItems: TabItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className={styles.iconSmall} strokeWidth="var(--icon-stroke)" aria-hidden="true" />,
  },
  {
    id: "learn",
    label: "Learn",
    icon: <BookOpen className={styles.iconSmall} strokeWidth="var(--icon-stroke)" aria-hidden="true" />,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutGrid className={styles.iconSmall} strokeWidth="var(--icon-stroke)" aria-hidden="true" />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className={styles.iconSmall} strokeWidth="var(--icon-stroke)" aria-hidden="true" />,
  },
];

export function BottomTabBar({ items = defaultItems, activeId, onChange, className }: BottomTabBarProps) {
  const currentId = activeId ?? items[0]?.id;

  return (
    <nav className={cn(styles.tabBar, className)} aria-label="Primary">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={styles.tabButton}
          data-selected={item.id === currentId}
          aria-current={item.id === currentId ? "page" : undefined}
          aria-label={item.label}
          onClick={() => onChange?.(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
